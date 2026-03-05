import { db } from './db';
import { settlementCalculations, claims, policies, claimNotes } from './db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { SettlementCalculation, Claim, Policy } from './db/schema';

interface DamageItem {
	category: string;
	description: string;
	estimatedCost: number;
	actualCost?: number;
	ageYears?: number;
	condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface DepreciationRates {
	auto: { perYear: number; maxDepreciation: number };
	home: { perYear: number; maxDepreciation: number };
	health: { perYear: number; maxDepreciation: number };
	life: { perYear: number; maxDepreciation: number };
}

const DEPRECIATION_RATES: DepreciationRates = {
	auto: { perYear: 0.15, maxDepreciation: 0.75 },
	home: { perYear: 0.02, maxDepreciation: 0.30 },
	health: { perYear: 0, maxDepreciation: 0 },
	life: { perYear: 0, maxDepreciation: 0 }
};

const CONDITION_MODIFIERS: Record<string, number> = {
	excellent: 1.0,
	good: 0.85,
	fair: 0.70,
	poor: 0.50
};

export interface CalculationInput {
	claimId: string;
	userId: string;
	damageItems: DamageItem[];
}

export interface CalculationResult {
	totalDamage: number;
	deductible: number;
	depreciation: number;
	coverageLimit: number;
	calculatedPayout: number;
	breakdown: {
		item: string;
		original: number;
		depreciated: number;
	}[];
}

export function calculateDepreciation(
	cost: number,
	policyType: keyof DepreciationRates,
	ageYears: number = 0,
	condition: string = 'good'
): number {
	const rates = DEPRECIATION_RATES[policyType];
	const conditionModifier = CONDITION_MODIFIERS[condition] || 1.0;
	
	let depreciationRate = Math.min(ageYears * rates.perYear, rates.maxDepreciation);
	const depreciatedValue = cost * (1 - depreciationRate) * conditionModifier;
	
	return Math.max(0, depreciatedValue);
}

export async function calculateSettlement(input: CalculationInput): Promise<CalculationResult> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, input.claimId),
		with: { policy: true }
	});

	if (!claim || !claim.policy) {
		throw new Error('Claim or policy not found');
	}

	const policy = claim.policy;
	const policyType = policy.type as keyof DepreciationRates;
	
	let totalDamage = 0;
	let totalDepreciation = 0;
	const breakdown: { item: string; original: number; depreciated: number }[] = [];

	for (const item of input.damageItems) {
		const originalCost = item.actualCost || item.estimatedCost;
		const depreciatedValue = calculateDepreciation(
			originalCost,
			policyType,
			item.ageYears || 0,
			item.condition || 'good'
		);

		totalDamage += originalCost;
		totalDepreciation += (originalCost - depreciatedValue);

		breakdown.push({
			item: item.description,
			original: originalCost,
			depreciated: depreciatedValue
		});
	}

	const afterDepreciation = totalDamage - totalDepreciation;
	const afterDeductible = Math.max(0, afterDepreciation - policy.deductible);
	const calculatedPayout = Math.min(afterDeductible, policy.coverageAmount);

	return {
		totalDamage,
		deductible: policy.deductible,
		depreciation: totalDepreciation,
		coverageLimit: policy.coverageAmount,
		calculatedPayout,
		breakdown
	};
}

export async function saveSettlementCalculation(
	input: CalculationInput,
	result: CalculationResult,
	override?: { finalPayout: number; reason: string }
): Promise<SettlementCalculation> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, input.claimId),
		with: { policy: true }
	});

	if (!claim || !claim.policy) {
		throw new Error('Claim or policy not found');
	}

	const settlementId = uuidv4();
	const settlement: SettlementCalculation = {
		id: settlementId,
		claimId: input.claimId,
		calculatedBy: input.userId,
		damageDetails: JSON.stringify(input.damageItems),
		totalDamage: result.totalDamage,
		deductible: result.deductible,
		depreciation: result.depreciation,
		coverageLimit: result.coverageLimit,
		calculatedPayout: result.calculatedPayout,
		finalPayout: override?.finalPayout || null,
		overrideReason: override?.reason || null,
		isOverridden: !!override,
		createdAt: new Date().toISOString()
	};

	await db.insert(settlementCalculations).values(settlement);

	const recommendedAmount = override?.finalPayout || result.calculatedPayout;
	await db.update(claims)
		.set({
			amountRecommended: recommendedAmount,
			updatedAt: new Date().toISOString()
		})
		.where(eq(claims.id, input.claimId));

	await db.insert(claimNotes).values({
		id: uuidv4(),
		claimId: input.claimId,
		userId: input.userId,
		noteType: 'payout',
		content: `Settlement calculated: Total damage $${result.totalDamage.toLocaleString()}, ` +
			`Depreciation $${result.depreciation.toLocaleString()}, ` +
			`Deductible $${result.deductible.toLocaleString()}, ` +
			`Calculated payout $${result.calculatedPayout.toLocaleString()}` +
			(override ? `. OVERRIDE: Final payout set to $${override.finalPayout.toLocaleString()}. Reason: ${override.reason}` : ''),
		isInternal: true
	});

	return settlement;
}

export async function getClaimSettlements(claimId: string): Promise<SettlementCalculation[]> {
	return db.query.settlementCalculations.findMany({
		where: eq(settlementCalculations.claimId, claimId),
		orderBy: (settlementCalculations, { desc }) => [desc(settlementCalculations.createdAt)]
	});
}

export function formatSettlementSummary(result: CalculationResult): string {
	const lines = [
		'Settlement Calculation Summary',
		'═'.repeat(40),
		'',
		'Damage Assessment:',
	];

	for (const item of result.breakdown) {
		lines.push(`  • ${item.item}: $${item.original.toLocaleString()} → $${item.depreciated.toLocaleString()}`);
	}

	lines.push('');
	lines.push('─'.repeat(40));
	lines.push(`Total Damage:      $${result.totalDamage.toLocaleString()}`);
	lines.push(`Less Depreciation: -$${result.depreciation.toLocaleString()}`);
	lines.push(`Less Deductible:   -$${result.deductible.toLocaleString()}`);
	lines.push(`Coverage Limit:    $${result.coverageLimit.toLocaleString()}`);
	lines.push('─'.repeat(40));
	lines.push(`CALCULATED PAYOUT: $${result.calculatedPayout.toLocaleString()}`);

	return lines.join('\n');
}

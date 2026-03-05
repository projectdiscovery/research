import { db } from './db';
import { claims, users, fraudAlerts, policies, claimNotes } from './db/schema';
import { eq, and, gte, desc, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { notifyClaimAssignment, createNotification } from './notifications';
import type { Claim, User, FraudAlert, Policy } from './db/schema';

interface AdjusterWorkload {
	adjusterId: string;
	adjuster: User;
	activeClaimsCount: number;
	totalClaimsValue: number;
	specialties: string[];
}

interface FraudCheckResult {
	score: number;
	flags: string[];
	alerts: { type: string; severity: 'low' | 'medium' | 'high'; description: string; metadata?: Record<string, unknown> }[];
}

const CLAIM_TYPE_SPECIALTIES: Record<string, string[]> = {
	accident: ['auto', 'liability'],
	theft: ['auto', 'home'],
	damage: ['home', 'auto'],
	medical: ['health'],
	liability: ['auto', 'home'],
	other: ['auto', 'home', 'health', 'life']
};

export async function autoAssignClaim(claimId: string, assignedBy: string): Promise<{ success: boolean; adjusterId?: string; error?: string }> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId),
		with: { policy: true }
	});

	if (!claim) {
		return { success: false, error: 'Claim not found' };
	}

	const adjusters = await db.query.users.findMany({
		where: and(
			eq(users.role, 'adjuster'),
			eq(users.isActive, true)
		)
	});

	if (adjusters.length === 0) {
		return { success: false, error: 'No available adjusters' };
	}

	const workloads = await Promise.all(
		adjusters.map(async (adjuster) => {
			const activeClaims = await db.query.claims.findMany({
				where: and(
					eq(claims.assignedAdjusterId, adjuster.id),
					// Active claims are those not closed, denied, or paid
				)
			});

			const active = activeClaims.filter(c => 
				!['closed', 'denied', 'paid'].includes(c.status)
			);

			return {
				adjusterId: adjuster.id,
				adjuster,
				activeClaimsCount: active.length,
				totalClaimsValue: active.reduce((sum, c) => sum + c.amountClaimed, 0),
				specialties: CLAIM_TYPE_SPECIALTIES[claim.type] || []
			};
		})
	);

	workloads.sort((a, b) => {
		const aHasSpecialty = a.specialties.includes(claim.policy?.type || '');
		const bHasSpecialty = b.specialties.includes(claim.policy?.type || '');
		
		if (aHasSpecialty && !bHasSpecialty) return -1;
		if (!aHasSpecialty && bHasSpecialty) return 1;
		
		if (a.activeClaimsCount !== b.activeClaimsCount) {
			return a.activeClaimsCount - b.activeClaimsCount;
		}
		
		return a.totalClaimsValue - b.totalClaimsValue;
	});

	const selectedAdjuster = workloads[0];

	await db.update(claims)
		.set({
			assignedAdjusterId: selectedAdjuster.adjusterId,
			status: 'under_review',
			updatedAt: new Date().toISOString()
		})
		.where(eq(claims.id, claimId));

	await notifyClaimAssignment(claimId, selectedAdjuster.adjusterId, assignedBy);

	return { success: true, adjusterId: selectedAdjuster.adjusterId };
}

export async function checkForFraud(claimId: string): Promise<FraudCheckResult> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId),
		with: { policy: true, user: true }
	});

	if (!claim) {
		return { score: 0, flags: [], alerts: [] };
	}

	const result: FraudCheckResult = {
		score: 0,
		flags: [],
		alerts: []
	};

	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const recentClaims = await db.query.claims.findMany({
		where: and(
			eq(claims.userId, claim.userId),
			gte(claims.createdAt, thirtyDaysAgo.toISOString())
		)
	});

	if (recentClaims.length > 2) {
		result.score += 30;
		result.flags.push('multiple_claims_30_days');
		result.alerts.push({
			type: 'multiple_claims',
			severity: recentClaims.length > 3 ? 'high' : 'medium',
			description: `${recentClaims.length} claims filed in the last 30 days`,
			metadata: { claimCount: recentClaims.length }
		});
	}

	if (claim.policy) {
		const percentOfCoverage = (claim.amountClaimed / claim.policy.coverageAmount) * 100;
		if (percentOfCoverage >= 90) {
			result.score += 25;
			result.flags.push('near_coverage_limit');
			result.alerts.push({
				type: 'coverage_limit',
				severity: percentOfCoverage >= 95 ? 'high' : 'medium',
				description: `Claim amount is ${percentOfCoverage.toFixed(1)}% of coverage limit`,
				metadata: { percentOfCoverage }
			});
		}
	}

	if (claim.amountClaimed >= 50000) {
		result.score += 15;
		result.flags.push('high_value_claim');
		result.alerts.push({
			type: 'high_amount',
			severity: claim.amountClaimed >= 100000 ? 'high' : 'medium',
			description: `High-value claim: $${claim.amountClaimed.toLocaleString()}`
		});
	}

	if (claim.policy) {
		const policyStartDate = new Date(claim.policy.startDate);
		const daysSincePolicyStart = Math.floor((Date.now() - policyStartDate.getTime()) / (1000 * 60 * 60 * 24));
		
		if (daysSincePolicyStart <= 30) {
			result.score += 20;
			result.flags.push('recent_policy');
			result.alerts.push({
				type: 'recent_policy',
				severity: daysSincePolicyStart <= 14 ? 'high' : 'medium',
				description: `Policy was started only ${daysSincePolicyStart} days ago`,
				metadata: { daysSincePolicyStart }
			});
		}
	}

	const incidentDate = new Date(claim.incidentDate);
	const createdDate = new Date(claim.createdAt);
	const daysBetween = Math.floor((createdDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));
	
	if (daysBetween > 30) {
		result.score += 10;
		result.flags.push('delayed_filing');
		result.alerts.push({
			type: 'suspicious_timing',
			severity: daysBetween > 60 ? 'medium' : 'low',
			description: `Claim filed ${daysBetween} days after incident`,
			metadata: { daysBetween }
		});
	}

	const similarClaims = await db.query.claims.findMany({
		where: and(
			eq(claims.userId, claim.userId),
			eq(claims.type, claim.type)
		)
	});

	const duplicates = similarClaims.filter(c => 
		c.id !== claim.id &&
		c.incidentDate === claim.incidentDate &&
		Math.abs(c.amountClaimed - claim.amountClaimed) < 1000
	);

	if (duplicates.length > 0) {
		result.score += 40;
		result.flags.push('potential_duplicate');
		result.alerts.push({
			type: 'duplicate_claim',
			severity: 'high',
			description: `Potential duplicate of claim ${duplicates[0].claimNumber}`,
			metadata: { duplicateClaimId: duplicates[0].id }
		});
	}

	return result;
}

export async function runFraudCheck(claimId: string): Promise<void> {
	const result = await checkForFraud(claimId);

	await db.update(claims)
		.set({
			fraudScore: result.score,
			fraudFlags: result.flags.length > 0 ? JSON.stringify(result.flags) : null,
			updatedAt: new Date().toISOString()
		})
		.where(eq(claims.id, claimId));

	for (const alert of result.alerts) {
		await db.insert(fraudAlerts).values({
			id: uuidv4(),
			claimId,
			alertType: alert.type as 'multiple_claims' | 'high_amount' | 'coverage_limit' | 'recent_policy' | 'suspicious_timing' | 'duplicate_claim',
			severity: alert.severity,
			description: alert.description,
			metadata: alert.metadata ? JSON.stringify(alert.metadata) : null
		});
	}

	if (result.score >= 50) {
		const claim = await db.query.claims.findFirst({
			where: eq(claims.id, claimId)
		});

		if (claim) {
			await db.insert(claimNotes).values({
				id: uuidv4(),
				claimId,
				userId: claim.assignedAdjusterId || claim.userId,
				noteType: 'internal',
				content: `FRAUD ALERT: Score ${result.score}. Flags: ${result.flags.join(', ')}. This claim requires careful review.`,
				isInternal: true
			});

			const admins = await db.query.users.findMany({
				where: eq(users.role, 'admin')
			});

			for (const admin of admins) {
				await createNotification({
					userId: admin.id,
					type: 'system',
					title: `High Fraud Score Alert - ${claim.claimNumber}`,
					message: `Claim ${claim.claimNumber} has a fraud score of ${result.score}. Flags: ${result.flags.join(', ')}`,
					relatedClaimId: claimId,
					actionUrl: `/admin/claims/${claimId}`
				});
			}
		}
	}
}

export async function triageClaim(claimId: string, submittedBy: string): Promise<{ adjusterId?: string; fraudScore: number }> {
	await runFraudCheck(claimId);

	const assignment = await autoAssignClaim(claimId, submittedBy);

	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId)
	});

	return {
		adjusterId: assignment.adjusterId,
		fraudScore: claim?.fraudScore || 0
	};
}

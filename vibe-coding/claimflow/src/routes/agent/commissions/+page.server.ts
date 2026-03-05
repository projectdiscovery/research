import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { policies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const COMMISSION_RATES: Record<string, number> = {
	auto: 10,
	home: 12,
	health: 8,
	life: 15
};

export const load: PageServerLoad = async ({ locals }) => {
	const agentId = locals.user!.id;

	const agentPolicies = await db.query.policies.findMany({
		where: eq(policies.agentId, agentId),
		with: { user: true }
	});

	const activePolicies = agentPolicies.filter(p => p.status === 'active');

	const policiesWithCommission = activePolicies.map(policy => {
		const rate = COMMISSION_RATES[policy.type] || 10;
		let monthlyPremium = policy.premium;
		if (policy.premiumFrequency === 'quarterly') monthlyPremium /= 3;
		if (policy.premiumFrequency === 'annually') monthlyPremium /= 12;
		
		return {
			...policy,
			commissionRate: rate,
			commission: monthlyPremium * (rate / 100)
		};
	});

	const thisMonth = policiesWithCommission.reduce((sum, p) => sum + p.commission, 0);
	const yearToDate = thisMonth * 12; // Simplified calculation

	return {
		stats: {
			yearToDate: Math.round(yearToDate),
			thisMonth: Math.round(thisMonth),
			monthChange: 5.2, // Placeholder
			activePolicies: activePolicies.length,
			avgRate: activePolicies.length > 0 
				? Math.round(policiesWithCommission.reduce((sum, p) => sum + p.commissionRate, 0) / activePolicies.length)
				: 0
		},
		policies: policiesWithCommission
	};
};

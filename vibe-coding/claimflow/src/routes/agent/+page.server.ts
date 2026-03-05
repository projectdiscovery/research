import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, policies, claims } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const agentId = locals.user!.id;

	const customers = await db.query.users.findMany({
		where: eq(users.assignedAgentId, agentId)
	});

	const customerIds = customers.map(c => c.id);

	const agentPolicies = await db.query.policies.findMany({
		where: eq(policies.agentId, agentId)
	});

	const activePolicies = agentPolicies.filter(p => p.status === 'active');
	const monthlyPremium = activePolicies.reduce((sum, p) => {
		if (p.premiumFrequency === 'monthly') return sum + p.premium;
		if (p.premiumFrequency === 'quarterly') return sum + p.premium / 3;
		if (p.premiumFrequency === 'annually') return sum + p.premium / 12;
		return sum;
	}, 0);

	const allClaims = await db.query.claims.findMany({
		with: { user: true, policy: true },
		orderBy: [desc(claims.createdAt)]
	});

	const customerClaims = allClaims.filter(c => customerIds.includes(c.userId));
	const openClaims = customerClaims.filter(c => !['paid', 'closed', 'denied'].includes(c.status));

	const recentCustomers = customers.slice(0, 5).map(c => ({
		...c,
		policyCount: agentPolicies.filter(p => p.userId === c.id).length
	}));

	return {
		stats: {
			totalCustomers: customers.length,
			activePolicies: activePolicies.length,
			openClaims: openClaims.length,
			monthlyPremium: Math.round(monthlyPremium)
		},
		recentCustomers,
		recentClaims: customerClaims.slice(0, 5)
	};
};

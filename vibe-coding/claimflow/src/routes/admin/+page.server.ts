import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const allUsers = await db.query.users.findMany();
	const allPolicies = await db.query.policies.findMany();
	const allClaims = await db.query.claims.findMany();

	const usersByRole = allUsers.reduce((acc, u) => {
		acc[u.role] = (acc[u.role] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const activePolicies = allPolicies.filter(p => p.status === 'active');
	const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverageAmount, 0);

	const openClaims = allClaims.filter(c => !['paid', 'closed', 'denied'].includes(c.status));
	const pendingUnderwriter = allClaims.filter(c => c.status === 'pending_underwriter');
	const paidClaims = allClaims.filter(c => c.status === 'paid');
	const totalPayouts = paidClaims.reduce((sum, c) => sum + (c.amountApproved || 0), 0);

	const claimsByStatus = {
		pending: allClaims.filter(c => ['submitted', 'under_review', 'needs_info', 'pending_underwriter'].includes(c.status)).length,
		approved: allClaims.filter(c => ['approved', 'paid'].includes(c.status)).length,
		denied: allClaims.filter(c => c.status === 'denied').length
	};

	return {
		stats: {
			totalUsers: allUsers.length,
			usersByRole,
			activePolicies: activePolicies.length,
			totalCoverage,
			openClaims: openClaims.length,
			pendingUnderwriter: pendingUnderwriter.length,
			totalPayouts,
			paidClaims: paidClaims.length,
			claimsByStatus
		}
	};
};

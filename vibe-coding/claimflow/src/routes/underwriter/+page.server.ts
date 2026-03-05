import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims, policies } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const allClaims = await db.query.claims.findMany({
		with: {
			user: true,
			policy: true,
			adjuster: true
		},
		orderBy: [desc(claims.createdAt)]
	});

	const pendingClaims = allClaims.filter(c => 
		c.status === 'pending_underwriter' || c.requiresUnderwriterReview
	);

	const approvedThisMonth = allClaims.filter(c => {
		if (c.status !== 'approved' && c.status !== 'paid') return false;
		if (!c.reviewedAt) return false;
		const reviewDate = new Date(c.reviewedAt);
		const now = new Date();
		return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear();
	});

	const totalExposure = pendingClaims.reduce((sum, c) => sum + c.amountClaimed, 0);

	const allPolicies = await db.query.policies.findMany();
	const avgRiskScore = allPolicies.length > 0
		? Math.round(allPolicies.reduce((sum, p) => sum + (p.riskScore || 0), 0) / allPolicies.length)
		: 0;

	return {
		stats: {
			pendingReview: pendingClaims.length,
			approvedThisMonth: approvedThisMonth.length,
			totalExposure,
			avgRiskScore
		},
		pendingClaims
	};
};

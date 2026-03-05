import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { policies, claims, communications } from '$lib/server/db/schema';
import { eq, and, inArray, not } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const userPolicies = await db.query.policies.findMany({
		where: eq(policies.userId, userId),
		orderBy: (policies, { desc }) => [desc(policies.createdAt)]
	});

	const userClaims = await db.query.claims.findMany({
		where: eq(claims.userId, userId),
		orderBy: (claims, { desc }) => [desc(claims.createdAt)]
	});

	const unreadMessages = await db.query.communications.findMany({
		where: and(
			eq(communications.recipientId, userId),
			eq(communications.isRead, false)
		)
	});

	const activePolicies = userPolicies.filter(p => p.status === 'active').length;
	const openClaims = userClaims.filter(c => !['paid', 'closed', 'denied'].includes(c.status)).length;
	const resolvedClaims = userClaims.filter(c => ['paid', 'closed'].includes(c.status)).length;
	const totalCoverage = userPolicies
		.filter(p => p.status === 'active')
		.reduce((sum, p) => sum + p.coverageAmount, 0);

	return {
		policies: userPolicies,
		claims: userClaims,
		stats: {
			activePolicies,
			openClaims,
			resolvedClaims,
			totalCoverage,
			unreadMessages: unreadMessages.length
		}
	};
};

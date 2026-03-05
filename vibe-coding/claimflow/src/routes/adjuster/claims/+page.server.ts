import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const assignedClaims = await db.query.claims.findMany({
		where: eq(claims.assignedAdjusterId, userId),
		with: {
			user: true,
			policy: true
		},
		orderBy: [desc(claims.createdAt)]
	});

	return {
		claims: assignedClaims
	};
};

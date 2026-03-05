import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const userClaims = await db.query.claims.findMany({
		where: eq(claims.userId, userId),
		with: {
			policy: true
		},
		orderBy: (claims, { desc }) => [desc(claims.createdAt)]
	});

	return {
		claims: userClaims
	};
};

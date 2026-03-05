import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { policies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const userPolicies = await db.query.policies.findMany({
		where: eq(policies.userId, userId),
		orderBy: (policies, { desc }) => [desc(policies.createdAt)]
	});

	return {
		policies: userPolicies
	};
};

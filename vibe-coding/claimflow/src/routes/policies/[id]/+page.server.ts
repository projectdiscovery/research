import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { policies, claims, documents } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id;

	const policy = await db.query.policies.findFirst({
		where: and(
			eq(policies.id, params.id),
			eq(policies.userId, userId)
		)
	});

	if (!policy) {
		throw error(404, 'Policy not found');
	}

	const policyClaims = await db.query.claims.findMany({
		where: eq(claims.policyId, policy.id),
		orderBy: (claims, { desc }) => [desc(claims.createdAt)]
	});

	const policyDocuments = await db.query.documents.findMany({
		where: eq(documents.policyId, policy.id)
	});

	return {
		policy,
		claims: policyClaims,
		documents: policyDocuments
	};
};

import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims, documents, communications } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id;

	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, params.id),
		with: {
			policy: true,
			adjuster: true
		}
	});

	if (!claim) {
		throw error(404, 'Claim not found');
	}

	if (claim.userId !== userId && claim.assignedAdjusterId !== userId && locals.user!.role !== 'admin') {
		throw error(403, 'Access denied');
	}

	const claimDocuments = await db.query.documents.findMany({
		where: eq(documents.claimId, claim.id)
	});

	const claimCommunications = await db.query.communications.findMany({
		where: eq(communications.claimId, claim.id),
		with: {
			sender: true
		},
		orderBy: (communications, { desc }) => [desc(communications.createdAt)]
	});

	return {
		claim,
		documents: claimDocuments,
		communications: claimCommunications
	};
};

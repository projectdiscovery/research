import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims } from '$lib/server/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const pendingClaims = await db.query.claims.findMany({
		with: {
			user: true,
			policy: true,
			adjuster: true
		},
		orderBy: [desc(claims.createdAt)]
	});

	const filtered = pendingClaims.filter(c => 
		c.status === 'pending_underwriter' || 
		(c.requiresUnderwriterReview && c.status !== 'approved' && c.status !== 'denied' && c.status !== 'paid' && c.status !== 'closed')
	);

	return {
		claims: filtered
	};
};

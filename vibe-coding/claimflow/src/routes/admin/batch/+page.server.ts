import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { claims, users } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { batchUpdateStatus, batchAssignClaims } from '$lib/server/batch';
import { fail } from '@sveltejs/kit';
import type { ClaimStatus } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const allClaims = await db.query.claims.findMany({
		with: {
			user: true,
			adjuster: true,
			policy: true
		},
		orderBy: [desc(claims.createdAt)]
	});

	const adjusters = await db.query.users.findMany({
		where: eq(users.role, 'adjuster')
	});

	return {
		claims: allClaims,
		adjusters
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		if (!locals.user || !['admin', 'adjuster'].includes(locals.user.role)) {
			return fail(403, { error: 'Forbidden' });
		}

		const formData = await request.formData();
		const claimIdsJson = formData.get('claimIds') as string;
		const newStatus = formData.get('newStatus') as ClaimStatus;
		const notes = formData.get('notes') as string;

		if (!claimIdsJson || !newStatus) {
			return fail(400, { error: 'Missing required fields' });
		}

		const claimIds = JSON.parse(claimIdsJson);

		if (!Array.isArray(claimIds) || claimIds.length === 0) {
			return fail(400, { error: 'No claims selected' });
		}

		const result = await batchUpdateStatus(claimIds, newStatus, locals.user.id, notes);

		return result;
	},

	assignClaims: async ({ request, locals }) => {
		if (!locals.user || !['admin', 'adjuster'].includes(locals.user.role)) {
			return fail(403, { error: 'Forbidden' });
		}

		const formData = await request.formData();
		const claimIdsJson = formData.get('claimIds') as string;
		const adjusterId = formData.get('adjusterId') as string;

		if (!claimIdsJson || !adjusterId) {
			return fail(400, { error: 'Missing required fields' });
		}

		const claimIds = JSON.parse(claimIdsJson);

		if (!Array.isArray(claimIds) || claimIds.length === 0) {
			return fail(400, { error: 'No claims selected' });
		}

		const result = await batchAssignClaims(claimIds, adjusterId, locals.user.id);

		return result;
	}
};

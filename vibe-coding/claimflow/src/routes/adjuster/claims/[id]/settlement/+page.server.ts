import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { claims } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, redirect, fail } from '@sveltejs/kit';
import { calculateSettlement, saveSettlementCalculation, getClaimSettlements } from '$lib/server/settlement';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || !['adjuster', 'admin'].includes(locals.user.role)) {
		throw error(403, 'Access denied');
	}

	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, params.id),
		with: {
			user: true,
			policy: true
		}
	});

	if (!claim) {
		throw error(404, 'Claim not found');
	}

	if (locals.user.role === 'adjuster' && claim.assignedAdjusterId !== locals.user.id) {
		throw error(403, 'You are not assigned to this claim');
	}

	const previousSettlements = await getClaimSettlements(params.id);

	return {
		claim,
		previousSettlements
	};
};

export const actions: Actions = {
	calculate: async ({ request, params }) => {
		const formData = await request.formData();
		const damageItemsJson = formData.get('damageItems') as string;

		if (!damageItemsJson) {
			return fail(400, { error: 'Missing damage items' });
		}

		const damageItems = JSON.parse(damageItemsJson);

		try {
			const calculation = await calculateSettlement({
				claimId: params.id,
				userId: '',
				damageItems
			});

			return { calculation };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	saveSettlement: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const damageItemsJson = formData.get('damageItems') as string;
		const override = formData.get('override') === 'true';
		const overrideAmount = parseFloat(formData.get('overrideAmount') as string);
		const overrideReason = formData.get('overrideReason') as string;

		if (!damageItemsJson) {
			return fail(400, { error: 'Missing damage items' });
		}

		const damageItems = JSON.parse(damageItemsJson);

		try {
			const result = await calculateSettlement({
				claimId: params.id,
				userId: locals.user.id,
				damageItems
			});

			await saveSettlementCalculation(
				{ claimId: params.id, userId: locals.user.id, damageItems },
				result,
				override ? { finalPayout: overrideAmount, reason: overrideReason } : undefined
			);

			throw redirect(303, `/adjuster/claims/${params.id}`);
		} catch (err) {
			if ((err as { status?: number }).status === 303) throw err;
			return fail(500, { error: (err as Error).message });
		}
	}
};

import type { RequestHandler } from './$types';
import { calculateSettlement, saveSettlementCalculation, getClaimSettlements } from '$lib/server/settlement';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const claimId = url.searchParams.get('claimId');

	if (!claimId) {
		return json({ error: 'Missing claimId' }, { status: 400 });
	}

	const settlements = await getClaimSettlements(claimId);
	return json({ settlements });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!['adjuster', 'admin'].includes(locals.user.role)) {
		return new Response('Forbidden', { status: 403 });
	}

	const { claimId, damageItems, save, override } = await request.json();

	if (!claimId || !damageItems) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		const result = await calculateSettlement({
			claimId,
			userId: locals.user.id,
			damageItems
		});

		if (save) {
			const settlement = await saveSettlementCalculation(
				{ claimId, userId: locals.user.id, damageItems },
				result,
				override ? { finalPayout: override.amount, reason: override.reason } : undefined
			);
			return json({ calculation: result, settlement });
		}

		return json({ calculation: result });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 500 });
	}
};

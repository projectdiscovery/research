import type { RequestHandler } from './$types';
import { triageClaim, runFraudCheck } from '$lib/server/triage';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { claimId, action } = await request.json();

	if (!claimId) {
		return json({ error: 'Missing claimId' }, { status: 400 });
	}

	try {
		if (action === 'fraud-check') {
			await runFraudCheck(claimId);
			return json({ success: true });
		}

		const result = await triageClaim(claimId, locals.user.id);
		return json(result);
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 500 });
	}
};

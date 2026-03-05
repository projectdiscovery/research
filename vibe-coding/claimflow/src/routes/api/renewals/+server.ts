import type { RequestHandler } from './$types';
import { checkPoliciesForRenewal, sendRenewalNotices, getPendingRenewals } from '$lib/server/renewals';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const action = url.searchParams.get('action');

	if (action === 'check') {
		if (!['admin', 'underwriter'].includes(locals.user.role)) {
			return new Response('Forbidden', { status: 403 });
		}
		const notices = await checkPoliciesForRenewal();
		return json({ notices });
	}

	if (action === 'pending') {
		if (!['admin', 'underwriter'].includes(locals.user.role)) {
			return new Response('Forbidden', { status: 403 });
		}
		const renewals = await getPendingRenewals();
		return json({ renewals });
	}

	return json({ error: 'Invalid action' }, { status: 400 });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['admin'].includes(locals.user.role)) {
		return new Response('Forbidden', { status: 403 });
	}

	const { action } = await request.json();

	if (action === 'send-notices') {
		const count = await sendRenewalNotices();
		return json({ success: true, sentCount: count });
	}

	return json({ error: 'Invalid action' }, { status: 400 });
};

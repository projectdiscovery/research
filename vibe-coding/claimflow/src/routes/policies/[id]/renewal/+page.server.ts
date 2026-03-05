import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { policies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, redirect, fail } from '@sveltejs/kit';
import { getRenewalsByPolicy, respondToRenewal } from '$lib/server/renewals';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/auth/login');
	}

	const policy = await db.query.policies.findFirst({
		where: eq(policies.id, params.id),
		with: { user: true }
	});

	if (!policy) {
		throw error(404, 'Policy not found');
	}

	if (policy.userId !== locals.user.id && !['admin', 'agent'].includes(locals.user.role)) {
		throw error(403, 'Access denied');
	}

	const renewal = await getRenewalsByPolicy(params.id);

	return {
		policy,
		renewal
	};
};

export const actions: Actions = {
	respond: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const accepted = formData.get('accepted') === 'true';

		const renewal = await getRenewalsByPolicy(params.id);
		
		if (!renewal) {
			return fail(404, { error: 'Renewal not found' });
		}

		if (renewal.status !== 'sent') {
			return fail(400, { error: 'Renewal cannot be responded to in current state' });
		}

		try {
			await respondToRenewal(renewal.id, accepted);
			throw redirect(303, `/policies/${params.id}/renewal`);
		} catch (err) {
			if ((err as { status?: number }).status === 303) throw err;
			return fail(500, { error: (err as Error).message });
		}
	}
};

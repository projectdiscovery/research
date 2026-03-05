import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { policyRenewals, claims } from '$lib/server/db/schema';
import { eq, gte } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { getPendingRenewals, reviewRenewal } from '$lib/server/renewals';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !['underwriter', 'admin'].includes(locals.user.role)) {
		throw redirect(303, '/auth/login');
	}

	const renewals = await getPendingRenewals();

	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

	const claimsPerPolicy: Record<string, number> = {};
	
	for (const renewal of renewals) {
		if (renewal.policy?.id) {
			const policyClaims = await db.query.claims.findMany({
				where: eq(claims.policyId, renewal.policy.id)
			});
			const recentClaims = policyClaims.filter(c => c.createdAt >= oneYearAgo.toISOString());
			claimsPerPolicy[renewal.policy.id] = recentClaims.length;
		}
	}

	return {
		renewals,
		claimsPerPolicy
	};
};

export const actions: Actions = {
	review: async ({ request, locals }) => {
		if (!locals.user || !['underwriter', 'admin'].includes(locals.user.role)) {
			return fail(403, { error: 'Forbidden' });
		}

		const formData = await request.formData();
		const renewalId = formData.get('renewalId') as string;
		const approved = formData.get('approved') === 'true';
		const notes = formData.get('notes') as string;
		const adjustedPremiumStr = formData.get('adjustedPremium') as string;
		const adjustedPremium = adjustedPremiumStr ? parseFloat(adjustedPremiumStr) : undefined;

		if (!renewalId) {
			return fail(400, { error: 'Missing renewal ID' });
		}

		try {
			await reviewRenewal(renewalId, locals.user.id, approved, notes, adjustedPremium);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	}
};

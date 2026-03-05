import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { policies, claims, claimWorkflowHistory } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { triageClaim } from '$lib/server/triage';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;
	const preselectedPolicy = url.searchParams.get('policy');

	const userPolicies = await db.query.policies.findMany({
		where: eq(policies.userId, userId)
	});

	return {
		policies: userPolicies,
		preselectedPolicy
	};
};

function generateClaimNumber(): string {
	const year = new Date().getFullYear();
	const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
	return `CLM-${year}-${random}`;
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		
		const policyId = formData.get('policyId')?.toString();
		const type = formData.get('type')?.toString();
		const incidentDate = formData.get('incidentDate')?.toString();
		const incidentLocation = formData.get('incidentLocation')?.toString();
		const description = formData.get('description')?.toString();
		const amountClaimed = parseFloat(formData.get('amountClaimed')?.toString() || '0');
		const action = formData.get('action')?.toString();

		if (!policyId || !type || !incidentDate || !description || !amountClaimed) {
			return fail(400, { error: 'Please fill in all required fields' });
		}

		const policy = await db.query.policies.findFirst({
			where: eq(policies.id, policyId)
		});

		if (!policy || policy.userId !== userId) {
			return fail(400, { error: 'Invalid policy selected' });
		}

		const claimId = uuidv4();
		const claimNumber = generateClaimNumber();
		const status = action === 'submit' ? 'filed' : 'draft';
		const submittedAt = action === 'submit' ? new Date().toISOString() : null;
		
		const priority = amountClaimed >= 50000 ? 'urgent' : 
			amountClaimed >= 10000 ? 'high' : 
			amountClaimed >= 1000 ? 'medium' : 'low';

		await db.insert(claims).values({
			id: claimId,
			policyId,
			userId,
			claimNumber,
			type: type as 'accident' | 'theft' | 'damage' | 'medical' | 'liability' | 'other',
			status,
			priority,
			description,
			incidentDate,
			incidentLocation: incidentLocation || null,
			amountClaimed,
			submittedAt,
			requiresUnderwriterReview: amountClaimed >= 50000
		});

		if (action === 'submit') {
			await db.insert(claimWorkflowHistory).values({
				id: uuidv4(),
				claimId,
				fromStatus: 'draft',
				toStatus: 'filed',
				userId,
				notes: 'Claim filed by policyholder'
			});

			await triageClaim(claimId, userId);
		}

		throw redirect(302, `/claims/${claimId}`);
	}
};

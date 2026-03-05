import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims, claimNotes, documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { notifyClaimStatusChange } from '$lib/server/notifications';

export const load: PageServerLoad = async ({ params, locals }) => {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, params.id),
		with: {
			user: true,
			policy: true,
			adjuster: true
		}
	});

	if (!claim) {
		throw error(404, 'Claim not found');
	}

	const claimDocuments = await db.query.documents.findMany({
		where: eq(documents.claimId, claim.id)
	});

	const claimNotesData = await db.query.claimNotes.findMany({
		where: eq(claimNotes.claimId, claim.id),
		with: { user: true },
		orderBy: (claimNotes, { desc }) => [desc(claimNotes.createdAt)]
	});

	return {
		claim,
		documents: claimDocuments,
		notes: claimNotesData
	};
};

export const actions: Actions = {
	makeDecision: async ({ request, params, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		
		const decision = formData.get('decision')?.toString();
		const approvedAmount = parseFloat(formData.get('approvedAmount')?.toString() || '0');
		const notes = formData.get('notes')?.toString();

		if (!decision || !notes) {
			return fail(400, { error: 'Decision and notes are required' });
		}

		const claim = await db.query.claims.findFirst({
			where: eq(claims.id, params.id)
		});

		if (!claim) {
			return fail(404, { error: 'Claim not found' });
		}

		const oldStatus = claim.status;
		let newStatus = claim.status;
		let updateData: Record<string, unknown> = {
			underwriterId: userId,
			underwriterDecision: decision,
			underwriterNotes: notes,
			updatedAt: new Date().toISOString()
		};

		if (decision === 'approved' || decision === 'modified') {
			newStatus = 'approved';
			updateData.status = 'approved';
			updateData.amountApproved = approvedAmount;
			updateData.reviewedAt = new Date().toISOString();
		} else if (decision === 'denied') {
			newStatus = 'denied';
			updateData.status = 'denied';
			updateData.denialReason = notes;
			updateData.resolvedAt = new Date().toISOString();
		} else if (decision === 'review') {
			newStatus = 'under_review';
			updateData.status = 'under_review';
		}

		await db.update(claims)
			.set(updateData)
			.where(eq(claims.id, params.id));

		await db.insert(claimNotes).values({
			id: uuidv4(),
			claimId: params.id,
			userId,
			noteType: 'status_change',
			content: `Underwriter decision: ${decision.toUpperCase()}. ${notes}`,
			isInternal: true
		});

		if (newStatus !== oldStatus) {
			await notifyClaimStatusChange(params.id, oldStatus, newStatus, userId);
		}

		throw redirect(302, '/underwriter/claims');
	}
};

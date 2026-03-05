import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims, claimNotes, documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { getClaimStatusTransitions, requiresUnderwriterReview } from '$lib/server/rbac';
import { notifyClaimStatusChange, notifyDocumentRequest } from '$lib/server/notifications';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id;
	const role = locals.user!.role;

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

	if (role !== 'admin' && claim.assignedAdjusterId !== userId) {
		throw error(403, 'Access denied');
	}

	const claimDocuments = await db.query.documents.findMany({
		where: eq(documents.claimId, claim.id)
	});

	const claimNotesData = await db.query.claimNotes.findMany({
		where: eq(claimNotes.claimId, claim.id),
		with: { user: true },
		orderBy: (claimNotes, { desc }) => [desc(claimNotes.createdAt)]
	});

	const availableTransitions = getClaimStatusTransitions(role, claim.status);

	return {
		claim,
		documents: claimDocuments,
		notes: claimNotesData,
		availableTransitions
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, params, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		
		const status = formData.get('status')?.toString();
		const denialReason = formData.get('denialReason')?.toString();
		const approvedAmount = parseFloat(formData.get('approvedAmount')?.toString() || '0');

		if (!status) {
			return fail(400, { error: 'Status is required' });
		}

		const claim = await db.query.claims.findFirst({
			where: eq(claims.id, params.id)
		});

		if (!claim) {
			return fail(404, { error: 'Claim not found' });
		}

		const oldStatus = claim.status;
		
		const updateData: Record<string, unknown> = {
			status,
			updatedAt: new Date().toISOString()
		};

		if (status === 'denied') {
			updateData.denialReason = denialReason;
			updateData.resolvedAt = new Date().toISOString();
		}

		if (status === 'approved') {
			updateData.amountApproved = approvedAmount;
			updateData.reviewedAt = new Date().toISOString();
		}

		if (status === 'under_review' && !claim.reviewedAt) {
			updateData.reviewedAt = new Date().toISOString();
		}

		if (status === 'pending_underwriter') {
			updateData.requiresUnderwriterReview = true;
		}

		if (['paid', 'closed'].includes(status)) {
			updateData.resolvedAt = new Date().toISOString();
		}

		await db.update(claims)
			.set(updateData)
			.where(eq(claims.id, params.id));

		await db.insert(claimNotes).values({
			id: uuidv4(),
			claimId: params.id,
			userId,
			noteType: 'status_change',
			content: `Status changed from "${oldStatus}" to "${status}"${denialReason ? `. Reason: ${denialReason}` : ''}`,
			isInternal: false
		});

		await notifyClaimStatusChange(params.id, oldStatus, status, userId);

		return { success: true };
	},

	addNote: async ({ request, params, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		
		const content = formData.get('content')?.toString();
		const noteType = formData.get('noteType')?.toString() || 'investigation';

		if (!content) {
			return fail(400, { error: 'Note content is required' });
		}

		await db.insert(claimNotes).values({
			id: uuidv4(),
			claimId: params.id,
			userId,
			noteType: noteType as 'investigation' | 'internal' | 'customer_contact' | 'document_request' | 'status_change' | 'payout',
			content,
			isInternal: noteType === 'internal'
		});

		return { success: true };
	},

	recommendPayout: async ({ request, params, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		
		const amount = parseFloat(formData.get('amount')?.toString() || '0');

		if (amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		const claim = await db.query.claims.findFirst({
			where: eq(claims.id, params.id)
		});

		if (!claim) {
			return fail(404, { error: 'Claim not found' });
		}

		const needsUnderwriter = requiresUnderwriterReview(amount);

		await db.update(claims)
			.set({
				amountRecommended: amount,
				requiresUnderwriterReview: needsUnderwriter,
				updatedAt: new Date().toISOString()
			})
			.where(eq(claims.id, params.id));

		await db.insert(claimNotes).values({
			id: uuidv4(),
			claimId: params.id,
			userId,
			noteType: 'payout',
			content: `Recommended payout amount: $${amount.toLocaleString()}${needsUnderwriter ? ' (Requires underwriter review)' : ''}`,
			isInternal: true
		});

		return { success: true };
	},

	verifyDocument: async ({ request, params, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		
		const documentId = formData.get('documentId')?.toString();

		if (!documentId) {
			return fail(400, { error: 'Document ID is required' });
		}

		await db.update(documents)
			.set({
				isVerified: true,
				verifiedBy: userId,
				verifiedAt: new Date().toISOString()
			})
			.where(eq(documents.id, documentId));

		return { success: true };
	},

	requestDocuments: async ({ params, locals }) => {
		const userId = locals.user!.id;

		await db.update(claims)
			.set({
				status: 'needs_info',
				updatedAt: new Date().toISOString()
			})
			.where(eq(claims.id, params.id));

		await db.insert(claimNotes).values({
			id: uuidv4(),
			claimId: params.id,
			userId,
			noteType: 'document_request',
			content: 'Additional documentation requested from claimant.',
			isInternal: false
		});

		await notifyDocumentRequest(params.id, userId, ['Supporting documents']);

		return { success: true };
	}
};

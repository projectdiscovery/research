import { db } from './db';
import { notifications, users, claims } from './db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { Notification, NewNotification } from './db/schema';

type NotificationType = 'claim_status' | 'document_request' | 'message' | 'assignment' | 'approval_needed' | 'system';

interface CreateNotificationParams {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	relatedClaimId?: string;
	relatedPolicyId?: string;
	actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
	const notification: NewNotification = {
		id: uuidv4(),
		userId: params.userId,
		type: params.type,
		title: params.title,
		message: params.message,
		relatedClaimId: params.relatedClaimId,
		relatedPolicyId: params.relatedPolicyId,
		actionUrl: params.actionUrl,
		isRead: false
	};

	await db.insert(notifications).values(notification);
	
	return notification as Notification;
}

export async function notifyClaimStatusChange(
	claimId: string,
	oldStatus: string,
	newStatus: string,
	actorId: string
): Promise<void> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId),
		with: {
			user: true,
			adjuster: true,
			policy: true
		}
	});

	if (!claim) return;

	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		submitted: 'Submitted',
		under_review: 'Under Review',
		needs_info: 'Additional Information Needed',
		pending_underwriter: 'Pending Underwriter Review',
		approved: 'Approved',
		denied: 'Denied',
		paid: 'Payment Processed',
		closed: 'Closed'
	};

	const newStatusLabel = statusLabels[newStatus] || newStatus;

	if (claim.userId !== actorId) {
		await createNotification({
			userId: claim.userId,
			type: 'claim_status',
			title: `Claim ${claim.claimNumber} - Status Updated`,
			message: `Your claim status has been updated to "${newStatusLabel}".`,
			relatedClaimId: claimId,
			actionUrl: `/claims/${claimId}`
		});
	}

	if (claim.assignedAdjusterId && claim.assignedAdjusterId !== actorId) {
		await createNotification({
			userId: claim.assignedAdjusterId,
			type: 'claim_status',
			title: `Claim ${claim.claimNumber} - Status Changed`,
			message: `Claim status changed from "${statusLabels[oldStatus]}" to "${newStatusLabel}".`,
			relatedClaimId: claimId,
			actionUrl: `/adjuster/claims/${claimId}`
		});
	}

	if (newStatus === 'pending_underwriter') {
		const underwriters = await db.query.users.findMany({
			where: eq(users.role, 'underwriter')
		});

		for (const uw of underwriters) {
			await createNotification({
				userId: uw.id,
				type: 'approval_needed',
				title: `High-Value Claim Requires Review`,
				message: `Claim ${claim.claimNumber} ($${claim.amountClaimed.toLocaleString()}) requires underwriter approval.`,
				relatedClaimId: claimId,
				actionUrl: `/underwriter/claims/${claimId}`
			});
		}
	}
}

export async function notifyDocumentRequest(
	claimId: string,
	requestedBy: string,
	documentTypes: string[]
): Promise<void> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId)
	});

	if (!claim) return;

	await createNotification({
		userId: claim.userId,
		type: 'document_request',
		title: `Documents Requested - Claim ${claim.claimNumber}`,
		message: `Additional documents have been requested: ${documentTypes.join(', ')}. Please upload them to proceed with your claim.`,
		relatedClaimId: claimId,
		actionUrl: `/claims/${claimId}`
	});
}

export async function notifyClaimAssignment(
	claimId: string,
	adjusterId: string,
	assignedBy: string
): Promise<void> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId),
		with: { user: true }
	});

	if (!claim) return;

	await createNotification({
		userId: adjusterId,
		type: 'assignment',
		title: `New Claim Assigned - ${claim.claimNumber}`,
		message: `A new claim has been assigned to you. Claimant: ${claim.user?.firstName} ${claim.user?.lastName}. Amount: $${claim.amountClaimed.toLocaleString()}.`,
		relatedClaimId: claimId,
		actionUrl: `/adjuster/claims/${claimId}`
	});

	await createNotification({
		userId: claim.userId,
		type: 'assignment',
		title: `Adjuster Assigned - Claim ${claim.claimNumber}`,
		message: `A claims adjuster has been assigned to your claim and will begin reviewing it shortly.`,
		relatedClaimId: claimId,
		actionUrl: `/claims/${claimId}`
	});
}

export async function notifyNewMessage(
	claimId: string,
	senderId: string,
	recipientId: string,
	preview: string
): Promise<void> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId)
	});

	const sender = await db.query.users.findFirst({
		where: eq(users.id, senderId)
	});

	if (!claim || !sender) return;

	await createNotification({
		userId: recipientId,
		type: 'message',
		title: `New Message - Claim ${claim.claimNumber}`,
		message: `${sender.firstName} ${sender.lastName}: "${preview.substring(0, 100)}${preview.length > 100 ? '...' : ''}"`,
		relatedClaimId: claimId,
		actionUrl: `/messages?claim=${claimId}`
	});
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
	if (unreadOnly) {
		return db.query.notifications.findMany({
			where: eq(notifications.userId, userId),
			orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
			limit: 50
		}).then(results => results.filter(n => !n.isRead));
	}

	return db.query.notifications.findMany({
		where: eq(notifications.userId, userId),
		orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
		limit: 50
	});
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
	const notification = await db.query.notifications.findFirst({
		where: eq(notifications.id, notificationId)
	});

	if (!notification || notification.userId !== userId) return false;

	await db.update(notifications)
		.set({ isRead: true, readAt: new Date().toISOString() })
		.where(eq(notifications.id, notificationId));

	return true;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
	await db.update(notifications)
		.set({ isRead: true, readAt: new Date().toISOString() })
		.where(eq(notifications.userId, userId));
}

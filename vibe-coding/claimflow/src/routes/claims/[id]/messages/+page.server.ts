import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { claims, communications, messageAttachments, users } from '$lib/server/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { error, redirect, fail } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { notifyNewMessage } from '$lib/server/notifications';

const UPLOAD_DIR = './uploads/attachments';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/auth/login');
	}

	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, params.id),
		with: {
			user: true,
			adjuster: true
		}
	});

	if (!claim) {
		throw error(404, 'Claim not found');
	}

	const canAccess = 
		claim.userId === locals.user.id ||
		claim.assignedAdjusterId === locals.user.id ||
		['admin', 'agent'].includes(locals.user.role);

	if (!canAccess) {
		throw error(403, 'Access denied');
	}

	const messages = await db.query.communications.findMany({
		where: eq(communications.claimId, params.id),
		with: {
			sender: true
		},
		orderBy: [communications.createdAt]
	});

	const messagesWithAttachments = await Promise.all(
		messages.map(async (msg) => {
			const attachments = await db.query.messageAttachments.findMany({
				where: eq(messageAttachments.communicationId, msg.id)
			});
			return { ...msg, attachments };
		})
	);

	const unreadMessages = messagesWithAttachments.filter(
		m => m.recipientId === locals.user!.id && !m.isRead
	);
	
	if (unreadMessages.length > 0) {
		for (const msg of unreadMessages) {
			await db.update(communications)
				.set({ isRead: true, readAt: new Date().toISOString() })
				.where(eq(communications.id, msg.id));
		}
	}

	return {
		claim,
		messages: messagesWithAttachments,
		user: locals.user
	};
};

export const actions: Actions = {
	send: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const message = formData.get('message') as string;
		const attachmentFiles = formData.getAll('attachments') as File[];

		if (!message?.trim()) {
			return fail(400, { error: 'Message is required' });
		}

		const claim = await db.query.claims.findFirst({
			where: eq(claims.id, params.id),
			with: { user: true, adjuster: true }
		});

		if (!claim) {
			return fail(404, { error: 'Claim not found' });
		}

		let recipientId: string | null = null;
		if (locals.user.role === 'policyholder') {
			recipientId = claim.assignedAdjusterId;
		} else if (['adjuster', 'admin'].includes(locals.user.role)) {
			recipientId = claim.userId;
		}

		const communicationId = uuidv4();

		await db.insert(communications).values({
			id: communicationId,
			claimId: params.id,
			senderId: locals.user.id,
			recipientId,
			message: message.trim(),
			isRead: false
		});

		if (attachmentFiles.length > 0) {
			if (!existsSync(UPLOAD_DIR)) {
				await mkdir(UPLOAD_DIR, { recursive: true });
			}

			for (const file of attachmentFiles) {
				if (file.size === 0) continue;
				if (file.size > 50 * 1024 * 1024) continue;

				const ext = path.extname(file.name);
				const fileName = `${uuidv4()}${ext}`;
				const filePath = path.join(UPLOAD_DIR, fileName);

				const buffer = Buffer.from(await file.arrayBuffer());
				await writeFile(filePath, buffer);

				await db.insert(messageAttachments).values({
					id: uuidv4(),
					communicationId,
					fileName,
					originalName: file.name,
					fileType: file.type,
					fileSize: file.size,
					filePath
				});
			}
		}

		if (recipientId) {
			await notifyNewMessage(params.id, locals.user.id, recipientId);
		}

		return { success: true };
	}
};

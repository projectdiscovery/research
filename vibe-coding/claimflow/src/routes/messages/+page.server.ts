import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims, communications } from '$lib/server/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;
	const preselectedClaim = url.searchParams.get('claim');

	const userClaims = await db.query.claims.findMany({
		where: eq(claims.userId, userId)
	});

	const claimIds = userClaims.map(c => c.id);
	
	if (claimIds.length === 0) {
		return {
			claimThreads: [],
			preselectedClaim
		};
	}

	const allMessages = await db.query.communications.findMany({
		where: or(
			...claimIds.map(id => eq(communications.claimId, id))
		),
		with: {
			sender: true,
			claim: true
		},
		orderBy: [desc(communications.createdAt)]
	});

	const threadMap = new Map<string, {
		claimId: string;
		claimNumber: string;
		lastMessage: string;
		lastMessageAt: string;
		unreadCount: number;
		messages: {
			id: string;
			senderId: string;
			senderName: string;
			subject: string | null;
			message: string;
			createdAt: string;
			isRead: boolean;
		}[];
	}>();

	for (const msg of allMessages) {
		if (!msg.claimId) continue;
		
		if (!threadMap.has(msg.claimId)) {
			threadMap.set(msg.claimId, {
				claimId: msg.claimId,
				claimNumber: msg.claim?.claimNumber || 'Unknown',
				lastMessage: msg.message.substring(0, 50) + (msg.message.length > 50 ? '...' : ''),
				lastMessageAt: msg.createdAt,
				unreadCount: 0,
				messages: []
			});
		}
		
		const thread = threadMap.get(msg.claimId)!;
		
		if (!msg.isRead && msg.recipientId === userId) {
			thread.unreadCount++;
		}
		
		thread.messages.push({
			id: msg.id,
			senderId: msg.senderId,
			senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
			subject: msg.subject,
			message: msg.message,
			createdAt: msg.createdAt,
			isRead: msg.isRead
		});
	}

	for (const thread of threadMap.values()) {
		thread.messages.reverse();
	}

	const claimThreads = Array.from(threadMap.values()).sort(
		(a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
	);

	return {
		claimThreads,
		preselectedClaim
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		
		const claimId = formData.get('claimId')?.toString();
		const message = formData.get('message')?.toString();

		if (!claimId || !message) {
			return fail(400, { error: 'Message is required' });
		}

		const claim = await db.query.claims.findFirst({
			where: eq(claims.id, claimId)
		});

		if (!claim || claim.userId !== userId) {
			return fail(403, { error: 'Access denied' });
		}

		await db.insert(communications).values({
			id: uuidv4(),
			claimId,
			senderId: userId,
			recipientId: claim.assignedAdjusterId || null,
			message,
			isRead: false
		});

		return { success: true };
	}
};

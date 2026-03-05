import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '$lib/server/notifications';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const unreadOnly = url.searchParams.get('unread') === 'true';
	const notifications = await getUserNotifications(locals.user.id, unreadOnly);

	return json({ notifications });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { action, notificationId } = body;

	if (action === 'markRead' && notificationId) {
		const success = await markNotificationRead(notificationId, locals.user.id);
		return json({ success });
	}

	if (action === 'markAllRead') {
		await markAllNotificationsRead(locals.user.id);
		return json({ success: true });
	}

	throw error(400, 'Invalid action');
};

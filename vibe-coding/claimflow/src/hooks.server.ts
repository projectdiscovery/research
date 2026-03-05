import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await getSession(event.cookies);
	
	if (session) {
		event.locals.user = session.user;
		event.locals.session = session;
	}

	return resolve(event);
};

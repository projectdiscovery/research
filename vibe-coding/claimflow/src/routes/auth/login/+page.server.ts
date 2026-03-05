import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail, verifyPassword, createSession, getDashboardUrl, hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, getDashboardUrl(locals.user.role));
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const user = await getUserByEmail(email);
		
		if (!user) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		if (!user.isActive) {
			return fail(400, { error: 'Your account has been deactivated. Please contact support.', email });
		}

		const validPassword = await verifyPassword(password, user.passwordHash);
		
		if (!validPassword) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		await createSession(user.id, cookies);
		
		throw redirect(302, getDashboardUrl(user.role));
	}
};

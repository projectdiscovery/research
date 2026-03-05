import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail, createUser, createSession, getDashboardUrl } from '$lib/server/auth';

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
		const firstName = formData.get('firstName')?.toString().trim();
		const lastName = formData.get('lastName')?.toString().trim();
		const phone = formData.get('phone')?.toString().trim();

		if (!email || !password || !firstName || !lastName) {
			return fail(400, { 
				error: 'Please fill in all required fields',
				email,
				firstName,
				lastName,
				phone
			});
		}

		if (password.length < 8) {
			return fail(400, { 
				error: 'Password must be at least 8 characters',
				email,
				firstName,
				lastName,
				phone
			});
		}

		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return fail(400, { 
				error: 'An account with this email already exists',
				email,
				firstName,
				lastName,
				phone
			});
		}

		try {
			const userId = await createUser({
				email,
				password,
				firstName,
				lastName,
				phone: phone || undefined,
				role: 'policyholder'
			});

			await createSession(userId, cookies);
			
			throw redirect(302, '/dashboard');
		} catch (e) {
			if (e instanceof Response) throw e;
			return fail(500, { 
				error: 'Something went wrong. Please try again.',
				email,
				firstName,
				lastName,
				phone
			});
		}
	}
};

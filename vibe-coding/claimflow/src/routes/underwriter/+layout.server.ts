import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	if (locals.user.role !== 'underwriter' && locals.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	return {
		user: locals.user
	};
};

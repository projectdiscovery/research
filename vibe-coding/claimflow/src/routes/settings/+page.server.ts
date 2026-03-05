import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { hashPassword, verifyPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		
		const firstName = formData.get('firstName')?.toString();
		const lastName = formData.get('lastName')?.toString();
		const phone = formData.get('phone')?.toString();
		const address = formData.get('address')?.toString();
		const city = formData.get('city')?.toString();
		const state = formData.get('state')?.toString();
		const zipCode = formData.get('zipCode')?.toString();

		if (!firstName || !lastName) {
			return fail(400, { error: 'First name and last name are required' });
		}

		await db.update(users)
			.set({
				firstName,
				lastName,
				phone: phone || null,
				address: address || null,
				city: city || null,
				state: state || null,
				zipCode: zipCode || null,
				updatedAt: new Date().toISOString()
			})
			.where(eq(users.id, locals.user.id));

		return { success: true };
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		
		const currentPassword = formData.get('currentPassword')?.toString();
		const newPassword = formData.get('newPassword')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'All password fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'New password must be at least 8 characters' });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, locals.user.id)
		});

		if (!user) {
			return fail(400, { error: 'User not found' });
		}

		const validPassword = await verifyPassword(currentPassword, user.passwordHash);
		if (!validPassword) {
			return fail(400, { error: 'Current password is incorrect' });
		}

		const newPasswordHash = await hashPassword(newPassword);

		await db.update(users)
			.set({
				passwordHash: newPasswordHash,
				updatedAt: new Date().toISOString()
			})
			.where(eq(users.id, locals.user.id));

		return { success: true };
	}
};

import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { createUser, hashPassword } from '$lib/server/auth';
import type { UserRole } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const allUsers = await db.query.users.findMany({
		orderBy: [desc(users.createdAt)]
	});

	return {
		users: allUsers
	};
};

export const actions: Actions = {
	createUser: async ({ request }) => {
		const formData = await request.formData();
		
		const firstName = formData.get('firstName')?.toString();
		const lastName = formData.get('lastName')?.toString();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();
		const role = formData.get('role')?.toString() as UserRole;
		const phone = formData.get('phone')?.toString();

		if (!firstName || !lastName || !email || !password || !role) {
			return fail(400, { error: 'All fields are required' });
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});

		if (existingUser) {
			return fail(400, { error: 'A user with this email already exists' });
		}

		try {
			await createUser({
				email,
				password,
				firstName,
				lastName,
				phone: phone || undefined,
				role
			});

			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to create user' });
		}
	},

	updateUser: async ({ request }) => {
		const formData = await request.formData();
		
		const userId = formData.get('userId')?.toString();
		const firstName = formData.get('firstName')?.toString();
		const lastName = formData.get('lastName')?.toString();
		const email = formData.get('email')?.toString();
		const role = formData.get('role')?.toString() as UserRole;
		const isActive = formData.get('isActive')?.toString() === 'true';

		if (!userId || !firstName || !lastName || !email || !role) {
			return fail(400, { error: 'All fields are required' });
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});

		if (existingUser && existingUser.id !== userId) {
			return fail(400, { error: 'A user with this email already exists' });
		}

		await db.update(users)
			.set({
				firstName,
				lastName,
				email: email.toLowerCase(),
				role,
				isActive,
				updatedAt: new Date().toISOString()
			})
			.where(eq(users.id, userId));

		return { success: true };
	}
};

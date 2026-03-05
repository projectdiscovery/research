import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, policies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { createUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const agentId = locals.user!.id;

	const customers = await db.query.users.findMany({
		where: eq(users.assignedAgentId, agentId)
	});

	const allPolicies = await db.query.policies.findMany({
		where: eq(policies.agentId, agentId)
	});

	const customersWithPolicies = customers.map(c => ({
		...c,
		policyCount: allPolicies.filter(p => p.userId === c.id).length
	}));

	return {
		customers: customersWithPolicies
	};
};

export const actions: Actions = {
	addCustomer: async ({ request, locals }) => {
		const agentId = locals.user!.id;
		const formData = await request.formData();
		
		const firstName = formData.get('firstName')?.toString();
		const lastName = formData.get('lastName')?.toString();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();
		const phone = formData.get('phone')?.toString();
		const address = formData.get('address')?.toString();
		const city = formData.get('city')?.toString();
		const state = formData.get('state')?.toString();
		const zipCode = formData.get('zipCode')?.toString();

		if (!firstName || !lastName || !email || !password) {
			return fail(400, { error: 'Name, email, and password are required' });
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});

		if (existingUser) {
			return fail(400, { error: 'A user with this email already exists' });
		}

		try {
			const userId = await createUser({
				email,
				password,
				firstName,
				lastName,
				phone: phone || undefined,
				role: 'policyholder',
				assignedAgentId: agentId
			});

			if (address || city || state || zipCode) {
				await db.update(users)
					.set({
						address: address || null,
						city: city || null,
						state: state || null,
						zipCode: zipCode || null
					})
					.where(eq(users.id, userId));
			}

			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to create customer' });
		}
	}
};

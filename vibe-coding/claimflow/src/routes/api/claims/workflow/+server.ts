import type { RequestHandler } from './$types';
import { executeTransition, getAvailableTransitions, getWorkflowHistory, type ClaimStatus } from '$lib/server/workflow';
import { db } from '$lib/server/db';
import { claims } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { UserRole } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const claimId = url.searchParams.get('claimId');
	const action = url.searchParams.get('action');

	if (!claimId) {
		return json({ error: 'Missing claimId' }, { status: 400 });
	}

	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId)
	});

	if (!claim) {
		return json({ error: 'Claim not found' }, { status: 404 });
	}

	if (action === 'history') {
		const history = await getWorkflowHistory(claimId);
		return json({ history });
	}

	const availableTransitions = getAvailableTransitions(
		claim.status as ClaimStatus,
		locals.user.role as UserRole,
		claim
	);

	return json({ 
		currentStatus: claim.status,
		availableTransitions 
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { claimId, toStatus, updateData, notes } = await request.json();

	if (!claimId || !toStatus) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const result = await executeTransition(
		claimId,
		toStatus as ClaimStatus,
		locals.user.id,
		locals.user.role as UserRole,
		updateData || {},
		notes
	);

	if (!result.success) {
		return json(result, { status: 400 });
	}

	return json(result);
};

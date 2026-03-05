import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { claims, claimNotes } from '$lib/server/db/schema';
import { eq, and, or, desc, gte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const assignedClaims = await db.query.claims.findMany({
		where: eq(claims.assignedAdjusterId, userId),
		with: {
			user: true,
			policy: true
		},
		orderBy: [desc(claims.createdAt)]
	});

	const urgentClaims = assignedClaims
		.filter(c => ['submitted', 'under_review', 'needs_info'].includes(c.status))
		.sort((a, b) => {
			const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
			return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
				   (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
		})
		.slice(0, 5);

	const pendingReview = assignedClaims.filter(c => 
		['submitted', 'under_review', 'needs_info'].includes(c.status)
	).length;

	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const approvedThisMonth = assignedClaims.filter(c => 
		c.status === 'approved' || c.status === 'paid'
	).length;

	const totalPayout = assignedClaims
		.filter(c => c.status === 'paid' || c.status === 'approved')
		.reduce((sum, c) => sum + (c.amountApproved || 0), 0);

	const recentNotes = await db.query.claimNotes.findMany({
		where: eq(claimNotes.userId, userId),
		orderBy: [desc(claimNotes.createdAt)],
		limit: 5,
		with: {
			claim: true
		}
	});

	const recentActivity = recentNotes.map(note => ({
		id: note.id,
		content: `Added ${note.noteType} note on claim ${note.claim?.claimNumber}`,
		createdAt: note.createdAt
	}));

	return {
		stats: {
			assignedClaims: assignedClaims.length,
			pendingReview,
			approvedThisMonth,
			totalPayout
		},
		urgentClaims,
		recentActivity
	};
};

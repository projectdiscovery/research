import { db } from './db';
import { claims, claimNotes, claimWorkflowHistory, users } from './db/schema';
import { eq, inArray, and, gte, lte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { notifyClaimStatusChange, notifyClaimAssignment } from './notifications';
import type { Claim, User, ClaimStatus } from './db/schema';

interface BatchUpdateResult {
	success: number;
	failed: number;
	errors: { claimId: string; error: string }[];
}

interface BatchAssignResult {
	success: number;
	failed: number;
	assignments: { claimId: string; adjusterId: string }[];
	errors: { claimId: string; error: string }[];
}

export async function batchUpdateStatus(
	claimIds: string[],
	newStatus: ClaimStatus,
	userId: string,
	notes?: string
): Promise<BatchUpdateResult> {
	const result: BatchUpdateResult = {
		success: 0,
		failed: 0,
		errors: []
	};

	for (const claimId of claimIds) {
		try {
			const claim = await db.query.claims.findFirst({
				where: eq(claims.id, claimId)
			});

			if (!claim) {
				result.failed++;
				result.errors.push({ claimId, error: 'Claim not found' });
				continue;
			}

			const oldStatus = claim.status;

			await db.update(claims)
				.set({
					status: newStatus,
					updatedAt: new Date().toISOString()
				})
				.where(eq(claims.id, claimId));

			await db.insert(claimWorkflowHistory).values({
				id: uuidv4(),
				claimId,
				fromStatus: oldStatus,
				toStatus: newStatus,
				userId,
				notes: notes || `Batch status update`,
				metadata: JSON.stringify({ batchOperation: true })
			});

			await notifyClaimStatusChange(claimId, oldStatus, newStatus, userId);

			result.success++;
		} catch (error) {
			result.failed++;
			result.errors.push({ claimId, error: (error as Error).message });
		}
	}

	return result;
}

export async function batchAssignClaims(
	claimIds: string[],
	adjusterId: string,
	userId: string
): Promise<BatchAssignResult> {
	const result: BatchAssignResult = {
		success: 0,
		failed: 0,
		assignments: [],
		errors: []
	};

	const adjuster = await db.query.users.findFirst({
		where: and(
			eq(users.id, adjusterId),
			eq(users.role, 'adjuster')
		)
	});

	if (!adjuster) {
		return {
			...result,
			failed: claimIds.length,
			errors: claimIds.map(id => ({ claimId: id, error: 'Invalid adjuster' }))
		};
	}

	for (const claimId of claimIds) {
		try {
			const claim = await db.query.claims.findFirst({
				where: eq(claims.id, claimId)
			});

			if (!claim) {
				result.failed++;
				result.errors.push({ claimId, error: 'Claim not found' });
				continue;
			}

			await db.update(claims)
				.set({
					assignedAdjusterId: adjusterId,
					updatedAt: new Date().toISOString()
				})
				.where(eq(claims.id, claimId));

			await db.insert(claimNotes).values({
				id: uuidv4(),
				claimId,
				userId,
				noteType: 'internal',
				content: `Claim reassigned to ${adjuster.firstName} ${adjuster.lastName} (batch operation)`,
				isInternal: true
			});

			await notifyClaimAssignment(claimId, adjusterId, userId);

			result.success++;
			result.assignments.push({ claimId, adjusterId });
		} catch (error) {
			result.failed++;
			result.errors.push({ claimId, error: (error as Error).message });
		}
	}

	return result;
}

export interface ClaimExportFilters {
	status?: ClaimStatus[];
	type?: string[];
	dateFrom?: string;
	dateTo?: string;
	adjusterId?: string;
	minAmount?: number;
	maxAmount?: number;
}

export async function exportClaimsToCSV(filters: ClaimExportFilters): Promise<string> {
	let allClaims = await db.query.claims.findMany({
		with: {
			user: true,
			policy: true,
			adjuster: true
		},
		orderBy: [desc(claims.createdAt)]
	});

	if (filters.status && filters.status.length > 0) {
		allClaims = allClaims.filter(c => filters.status!.includes(c.status as ClaimStatus));
	}

	if (filters.type && filters.type.length > 0) {
		allClaims = allClaims.filter(c => filters.type!.includes(c.type));
	}

	if (filters.dateFrom) {
		allClaims = allClaims.filter(c => c.createdAt >= filters.dateFrom!);
	}

	if (filters.dateTo) {
		allClaims = allClaims.filter(c => c.createdAt <= filters.dateTo!);
	}

	if (filters.adjusterId) {
		allClaims = allClaims.filter(c => c.assignedAdjusterId === filters.adjusterId);
	}

	if (filters.minAmount !== undefined) {
		allClaims = allClaims.filter(c => c.amountClaimed >= filters.minAmount!);
	}

	if (filters.maxAmount !== undefined) {
		allClaims = allClaims.filter(c => c.amountClaimed <= filters.maxAmount!);
	}

	const headers = [
		'Claim Number',
		'Status',
		'Type',
		'Priority',
		'Claimant Name',
		'Claimant Email',
		'Policy Number',
		'Policy Type',
		'Amount Claimed',
		'Amount Recommended',
		'Amount Approved',
		'Adjuster Name',
		'Incident Date',
		'Incident Location',
		'Created At',
		'Submitted At',
		'Reviewed At',
		'Resolved At',
		'Fraud Score'
	];

	const rows = allClaims.map(claim => [
		claim.claimNumber,
		claim.status,
		claim.type,
		claim.priority,
		`${claim.user?.firstName || ''} ${claim.user?.lastName || ''}`.trim(),
		claim.user?.email || '',
		claim.policy?.policyNumber || '',
		claim.policy?.type || '',
		claim.amountClaimed.toString(),
		claim.amountRecommended?.toString() || '',
		claim.amountApproved?.toString() || '',
		claim.adjuster ? `${claim.adjuster.firstName} ${claim.adjuster.lastName}` : '',
		claim.incidentDate,
		claim.incidentLocation || '',
		claim.createdAt,
		claim.submittedAt || '',
		claim.reviewedAt || '',
		claim.resolvedAt || '',
		claim.fraudScore?.toString() || ''
	]);

	const csvContent = [
		headers.join(','),
		...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
	].join('\n');

	return csvContent;
}

export async function getClaimStatistics(filters?: ClaimExportFilters) {
	let allClaims = await db.query.claims.findMany({
		with: { policy: true }
	});

	if (filters?.dateFrom) {
		allClaims = allClaims.filter(c => c.createdAt >= filters.dateFrom!);
	}
	if (filters?.dateTo) {
		allClaims = allClaims.filter(c => c.createdAt <= filters.dateTo!);
	}

	const byStatus: Record<string, number> = {};
	const byType: Record<string, number> = {};
	const byPriority: Record<string, number> = {};
	let totalClaimed = 0;
	let totalApproved = 0;
	let totalPaid = 0;
	let fraudFlaggedCount = 0;

	for (const claim of allClaims) {
		byStatus[claim.status] = (byStatus[claim.status] || 0) + 1;
		byType[claim.type] = (byType[claim.type] || 0) + 1;
		byPriority[claim.priority] = (byPriority[claim.priority] || 0) + 1;
		
		totalClaimed += claim.amountClaimed;
		totalApproved += claim.amountApproved || 0;
		
		if (claim.status === 'paid') {
			totalPaid += claim.amountApproved || 0;
		}
		
		if (claim.fraudScore && claim.fraudScore >= 30) {
			fraudFlaggedCount++;
		}
	}

	const processingTimes: number[] = [];
	for (const claim of allClaims) {
		if (claim.submittedAt && claim.resolvedAt) {
			const submitted = new Date(claim.submittedAt).getTime();
			const resolved = new Date(claim.resolvedAt).getTime();
			const days = (resolved - submitted) / (1000 * 60 * 60 * 24);
			processingTimes.push(days);
		}
	}

	const avgProcessingTime = processingTimes.length > 0
		? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
		: 0;

	return {
		totalClaims: allClaims.length,
		byStatus,
		byType,
		byPriority,
		totalClaimed,
		totalApproved,
		totalPaid,
		avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
		fraudFlaggedCount,
		approvalRate: allClaims.length > 0 
			? (allClaims.filter(c => ['approved', 'paid', 'closed'].includes(c.status)).length / allClaims.length) * 100 
			: 0
	};
}

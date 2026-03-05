import { db } from './db';
import { claims, claimNotes, users, policies, claimWorkflowHistory } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { notifyClaimStatusChange, notifyClaimAssignment } from './notifications';
import type { UserRole, Claim } from './db/schema';

export type ClaimStatus = 
	| 'draft'
	| 'filed'
	| 'under_review'
	| 'investigation'
	| 'estimation'
	| 'pending_approval'
	| 'approved'
	| 'denied'
	| 'payment_pending'
	| 'paid'
	| 'closed'
	| 'reopened';

export interface WorkflowTransition {
	from: ClaimStatus;
	to: ClaimStatus;
	allowedRoles: UserRole[];
	requiredFields?: string[];
	requiresApproval?: boolean;
	approverRoles?: UserRole[];
	autoTransitionCondition?: (claim: Claim) => boolean;
}

export interface TransitionResult {
	success: boolean;
	error?: string;
	missingFields?: string[];
	requiresApproval?: boolean;
}

const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
	{ from: 'draft', to: 'filed', allowedRoles: ['policyholder', 'agent', 'admin'], requiredFields: ['description', 'incidentDate', 'amountClaimed'] },
	{ from: 'filed', to: 'under_review', allowedRoles: ['adjuster', 'admin'], requiredFields: ['assignedAdjusterId'] },
	{ from: 'under_review', to: 'investigation', allowedRoles: ['adjuster', 'admin'] },
	{ from: 'under_review', to: 'estimation', allowedRoles: ['adjuster', 'admin'] },
	{ from: 'under_review', to: 'denied', allowedRoles: ['adjuster', 'admin'], requiredFields: ['denialReason'] },
	{ from: 'investigation', to: 'estimation', allowedRoles: ['adjuster', 'admin'] },
	{ from: 'investigation', to: 'denied', allowedRoles: ['adjuster', 'admin'], requiredFields: ['denialReason'] },
	{ from: 'estimation', to: 'pending_approval', allowedRoles: ['adjuster', 'admin'], requiredFields: ['amountRecommended'] },
	{ from: 'estimation', to: 'denied', allowedRoles: ['adjuster', 'admin'], requiredFields: ['denialReason'] },
	{ from: 'pending_approval', to: 'approved', allowedRoles: ['adjuster', 'underwriter', 'admin'], requiredFields: ['amountApproved'] },
	{ from: 'pending_approval', to: 'denied', allowedRoles: ['adjuster', 'underwriter', 'admin'], requiredFields: ['denialReason'] },
	{ from: 'pending_approval', to: 'investigation', allowedRoles: ['underwriter', 'admin'] },
	{ from: 'approved', to: 'payment_pending', allowedRoles: ['adjuster', 'admin'] },
	{ from: 'payment_pending', to: 'paid', allowedRoles: ['adjuster', 'admin'] },
	{ from: 'paid', to: 'closed', allowedRoles: ['adjuster', 'admin'] },
	{ from: 'denied', to: 'closed', allowedRoles: ['adjuster', 'admin'] },
	{ from: 'closed', to: 'reopened', allowedRoles: ['admin'], requiredFields: ['reopenReason'] },
	{ from: 'reopened', to: 'under_review', allowedRoles: ['adjuster', 'admin'] }
];

const HIGH_VALUE_THRESHOLD = 50000;

export const STATUS_LABELS: Record<ClaimStatus, string> = {
	draft: 'Draft',
	filed: 'Filed',
	under_review: 'Under Review',
	investigation: 'Investigation',
	estimation: 'Estimation',
	pending_approval: 'Pending Approval',
	approved: 'Approved',
	denied: 'Denied',
	payment_pending: 'Payment Pending',
	paid: 'Paid',
	closed: 'Closed',
	reopened: 'Reopened'
};

export const STATUS_COLORS: Record<ClaimStatus, string> = {
	draft: 'bg-surface-100 text-surface-700',
	filed: 'bg-blue-100 text-blue-700',
	under_review: 'bg-yellow-100 text-yellow-700',
	investigation: 'bg-orange-100 text-orange-700',
	estimation: 'bg-purple-100 text-purple-700',
	pending_approval: 'bg-indigo-100 text-indigo-700',
	approved: 'bg-green-100 text-green-700',
	denied: 'bg-red-100 text-red-700',
	payment_pending: 'bg-teal-100 text-teal-700',
	paid: 'bg-green-100 text-green-700',
	closed: 'bg-surface-100 text-surface-700',
	reopened: 'bg-amber-100 text-amber-700'
};

export function getAvailableTransitions(currentStatus: ClaimStatus, userRole: UserRole, claim?: Claim): ClaimStatus[] {
	const transitions = WORKFLOW_TRANSITIONS.filter(t => 
		t.from === currentStatus && t.allowedRoles.includes(userRole)
	);

	return transitions.map(t => t.to).filter(status => {
		if (claim && status === 'pending_approval' && (claim.amountRecommended || 0) >= HIGH_VALUE_THRESHOLD) {
			return userRole !== 'adjuster';
		}
		return true;
	});
}

export function getTransitionRequirements(from: ClaimStatus, to: ClaimStatus): WorkflowTransition | undefined {
	return WORKFLOW_TRANSITIONS.find(t => t.from === from && t.to === to);
}

export function canTransition(from: ClaimStatus, to: ClaimStatus, userRole: UserRole): boolean {
	const transition = WORKFLOW_TRANSITIONS.find(t => t.from === from && t.to === to);
	if (!transition) return false;
	return transition.allowedRoles.includes(userRole);
}

export function validateTransition(
	claim: Claim,
	toStatus: ClaimStatus,
	updateData: Record<string, unknown>
): TransitionResult {
	const fromStatus = claim.status as ClaimStatus;
	const transition = getTransitionRequirements(fromStatus, toStatus);

	if (!transition) {
		return { success: false, error: `Invalid transition from "${fromStatus}" to "${toStatus}"` };
	}

	if (transition.requiredFields) {
		const missingFields: string[] = [];
		for (const field of transition.requiredFields) {
			const value = updateData[field] ?? (claim as Record<string, unknown>)[field];
			if (value === undefined || value === null || value === '') {
				missingFields.push(field);
			}
		}
		if (missingFields.length > 0) {
			return { success: false, error: 'Missing required fields', missingFields };
		}
	}

	if (toStatus === 'approved' || toStatus === 'pending_approval') {
		const amount = updateData.amountApproved ?? updateData.amountRecommended ?? claim.amountRecommended;
		if (amount && Number(amount) >= HIGH_VALUE_THRESHOLD && !claim.underwriterDecision) {
			return { success: false, error: 'High-value claims require underwriter approval', requiresApproval: true };
		}
	}

	return { success: true };
}

export async function executeTransition(
	claimId: string,
	toStatus: ClaimStatus,
	userId: string,
	userRole: UserRole,
	updateData: Record<string, unknown> = {},
	notes?: string
): Promise<TransitionResult> {
	const claim = await db.query.claims.findFirst({
		where: eq(claims.id, claimId)
	});

	if (!claim) {
		return { success: false, error: 'Claim not found' };
	}

	const fromStatus = claim.status as ClaimStatus;

	if (!canTransition(fromStatus, toStatus, userRole)) {
		return { success: false, error: `You don't have permission to transition from "${fromStatus}" to "${toStatus}"` };
	}

	const validation = validateTransition(claim, toStatus, updateData);
	if (!validation.success) {
		return validation;
	}

	const finalUpdateData: Record<string, unknown> = {
		...updateData,
		status: toStatus,
		updatedAt: new Date().toISOString()
	};

	if (toStatus === 'filed' && !claim.submittedAt) {
		finalUpdateData.submittedAt = new Date().toISOString();
	}
	if (['approved', 'denied'].includes(toStatus) && !claim.reviewedAt) {
		finalUpdateData.reviewedAt = new Date().toISOString();
	}
	if (['paid', 'closed'].includes(toStatus) && !claim.resolvedAt) {
		finalUpdateData.resolvedAt = new Date().toISOString();
	}

	if (toStatus === 'pending_approval') {
		const amount = updateData.amountRecommended ?? claim.amountRecommended ?? claim.amountClaimed;
		if (Number(amount) >= HIGH_VALUE_THRESHOLD) {
			finalUpdateData.requiresUnderwriterReview = true;
		}
	}

	await db.update(claims)
		.set(finalUpdateData)
		.where(eq(claims.id, claimId));

	await db.insert(claimWorkflowHistory).values({
		id: uuidv4(),
		claimId,
		fromStatus,
		toStatus,
		userId,
		notes: notes || null,
		metadata: JSON.stringify(updateData)
	});

	if (notes) {
		await db.insert(claimNotes).values({
			id: uuidv4(),
			claimId,
			userId,
			noteType: 'status_change',
			content: `Status changed from "${STATUS_LABELS[fromStatus]}" to "${STATUS_LABELS[toStatus]}". ${notes}`,
			isInternal: false
		});
	}

	await notifyClaimStatusChange(claimId, fromStatus, toStatus, userId);

	return { success: true };
}

export async function getWorkflowHistory(claimId: string) {
	return db.query.claimWorkflowHistory.findMany({
		where: eq(claimWorkflowHistory.claimId, claimId),
		with: { user: true },
		orderBy: [desc(claimWorkflowHistory.createdAt)]
	});
}

export function getWorkflowSteps(): { status: ClaimStatus; label: string; description: string }[] {
	return [
		{ status: 'filed', label: 'Filed', description: 'Claim submitted by policyholder' },
		{ status: 'under_review', label: 'Under Review', description: 'Assigned to adjuster for initial review' },
		{ status: 'investigation', label: 'Investigation', description: 'Detailed investigation in progress' },
		{ status: 'estimation', label: 'Estimation', description: 'Damage assessment and cost estimation' },
		{ status: 'pending_approval', label: 'Pending Approval', description: 'Awaiting approval decision' },
		{ status: 'approved', label: 'Approved', description: 'Claim approved for payment' },
		{ status: 'payment_pending', label: 'Payment Pending', description: 'Payment being processed' },
		{ status: 'paid', label: 'Paid', description: 'Payment issued to claimant' },
		{ status: 'closed', label: 'Closed', description: 'Claim finalized and closed' }
	];
}

export function getCurrentStep(status: ClaimStatus): number {
	const steps = getWorkflowSteps();
	const index = steps.findIndex(s => s.status === status);
	if (index === -1) {
		if (status === 'denied') return 5;
		if (status === 'draft') return 0;
		if (status === 'reopened') return 1;
	}
	return index;
}

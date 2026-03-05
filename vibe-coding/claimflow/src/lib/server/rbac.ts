import type { UserRole } from './db/schema';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
	policyholder: 1,
	agent: 2,
	adjuster: 3,
	underwriter: 4,
	admin: 5
};

export const ROLE_LABELS: Record<UserRole, string> = {
	policyholder: 'Policyholder',
	agent: 'Agent/Broker',
	adjuster: 'Claims Adjuster',
	underwriter: 'Underwriter',
	admin: 'Administrator'
};

type Permission = 
	| 'view_own_policies'
	| 'view_own_claims'
	| 'file_claims'
	| 'upload_documents'
	| 'update_profile'
	| 'message_adjuster'
	| 'view_assigned_claims'
	| 'update_claim_status'
	| 'request_documents'
	| 'add_claim_notes'
	| 'recommend_payout'
	| 'reassign_claims'
	| 'view_customer_policies'
	| 'view_customer_claims'
	| 'file_claims_for_customers'
	| 'view_commissions'
	| 'add_policyholders'
	| 'review_high_value_claims'
	| 'assess_risk'
	| 'approve_renewals'
	| 'set_coverage_limits'
	| 'manage_users'
	| 'view_analytics'
	| 'manage_workflows'
	| 'manage_templates'
	| 'handle_escalations'
	| 'view_all_claims'
	| 'view_all_policies'
	| 'approve_claims'
	| 'deny_claims';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	policyholder: [
		'view_own_policies',
		'view_own_claims',
		'file_claims',
		'upload_documents',
		'update_profile',
		'message_adjuster'
	],
	adjuster: [
		'view_assigned_claims',
		'update_claim_status',
		'request_documents',
		'add_claim_notes',
		'recommend_payout',
		'reassign_claims',
		'approve_claims',
		'deny_claims',
		'upload_documents',
		'update_profile'
	],
	agent: [
		'view_customer_policies',
		'view_customer_claims',
		'file_claims_for_customers',
		'view_commissions',
		'add_policyholders',
		'upload_documents',
		'update_profile'
	],
	underwriter: [
		'review_high_value_claims',
		'assess_risk',
		'approve_renewals',
		'set_coverage_limits',
		'view_all_claims',
		'view_all_policies',
		'add_claim_notes',
		'approve_claims',
		'deny_claims',
		'update_profile'
	],
	admin: [
		'manage_users',
		'view_analytics',
		'manage_workflows',
		'manage_templates',
		'handle_escalations',
		'view_all_claims',
		'view_all_policies',
		'view_assigned_claims',
		'update_claim_status',
		'request_documents',
		'add_claim_notes',
		'recommend_payout',
		'reassign_claims',
		'approve_claims',
		'deny_claims',
		'review_high_value_claims',
		'assess_risk',
		'approve_renewals',
		'set_coverage_limits',
		'upload_documents',
		'update_profile'
	]
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
	return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
	return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
	return permissions.every(p => hasPermission(role, p));
}

export function canAccessClaim(role: UserRole, claim: { userId: string; assignedAdjusterId?: string | null }, userId: string): boolean {
	if (role === 'admin' || role === 'underwriter') return true;
	if (role === 'policyholder' && claim.userId === userId) return true;
	if (role === 'adjuster' && claim.assignedAdjusterId === userId) return true;
	return false;
}

export function canAccessPolicy(role: UserRole, policy: { userId: string; agentId?: string | null }, userId: string): boolean {
	if (role === 'admin' || role === 'underwriter') return true;
	if (role === 'policyholder' && policy.userId === userId) return true;
	if (role === 'agent' && policy.agentId === userId) return true;
	return false;
}

export function requiresUnderwriterReview(amountClaimed: number): boolean {
	return amountClaimed >= 50000;
}

export function getClaimStatusTransitions(role: UserRole, currentStatus: string): string[] {
	const transitions: Record<string, Record<UserRole, string[]>> = {
		draft: {
			policyholder: ['submitted'],
			agent: ['submitted'],
			adjuster: [],
			underwriter: [],
			admin: ['submitted']
		},
		submitted: {
			policyholder: [],
			agent: [],
			adjuster: ['under_review'],
			underwriter: [],
			admin: ['under_review']
		},
		under_review: {
			policyholder: [],
			agent: [],
			adjuster: ['needs_info', 'pending_underwriter', 'approved', 'denied'],
			underwriter: ['approved', 'denied'],
			admin: ['needs_info', 'pending_underwriter', 'approved', 'denied']
		},
		needs_info: {
			policyholder: ['submitted'],
			agent: ['submitted'],
			adjuster: ['under_review', 'denied'],
			underwriter: [],
			admin: ['under_review', 'denied']
		},
		pending_underwriter: {
			policyholder: [],
			agent: [],
			adjuster: [],
			underwriter: ['approved', 'denied', 'under_review'],
			admin: ['approved', 'denied', 'under_review']
		},
		approved: {
			policyholder: [],
			agent: [],
			adjuster: ['paid'],
			underwriter: [],
			admin: ['paid', 'denied']
		},
		denied: {
			policyholder: [],
			agent: [],
			adjuster: ['closed'],
			underwriter: [],
			admin: ['closed', 'under_review']
		},
		paid: {
			policyholder: [],
			agent: [],
			adjuster: ['closed'],
			underwriter: [],
			admin: ['closed']
		},
		closed: {
			policyholder: [],
			agent: [],
			adjuster: [],
			underwriter: [],
			admin: ['under_review']
		}
	};

	return transitions[currentStatus]?.[role] ?? [];
}

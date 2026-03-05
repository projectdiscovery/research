import { db } from './db';
import { policies, policyRenewals, claims, users, notifications } from './db/schema';
import { eq, and, lte, gte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from './notifications';
import type { Policy, PolicyRenewal } from './db/schema';

interface RenewalNotice {
	policyId: string;
	userId: string;
	policyNumber: string;
	expiryDate: string;
	daysUntilExpiry: number;
	hasRecentClaims: boolean;
	recentClaimsCount: number;
	suggestedPremiumChange: number;
}

export async function checkPoliciesForRenewal(): Promise<RenewalNotice[]> {
	const thirtyDaysFromNow = new Date();
	thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
	
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const expiringPolicies = await db.query.policies.findMany({
		where: and(
			eq(policies.status, 'active'),
			lte(policies.endDate, thirtyDaysFromNow.toISOString().split('T')[0])
		),
		with: {
			user: true
		}
	});

	const notices: RenewalNotice[] = [];

	for (const policy of expiringPolicies) {
		const existingRenewal = await db.query.policyRenewals.findFirst({
			where: eq(policyRenewals.policyId, policy.id)
		});

		if (existingRenewal) continue;

		const expiryDate = new Date(policy.endDate);
		const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

		const oneYearAgo = new Date();
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

		const recentClaims = await db.query.claims.findMany({
			where: and(
				eq(claims.policyId, policy.id),
				gte(claims.createdAt, oneYearAgo.toISOString())
			)
		});

		const paidClaims = recentClaims.filter(c => c.status === 'paid' || c.status === 'approved');
		const totalClaimsPaid = paidClaims.reduce((sum, c) => sum + (c.amountApproved || 0), 0);
		
		let premiumChange = 0;
		if (paidClaims.length === 0) {
			premiumChange = -5;
		} else if (paidClaims.length === 1 && totalClaimsPaid < 5000) {
			premiumChange = 0;
		} else if (paidClaims.length <= 2) {
			premiumChange = 10;
		} else {
			premiumChange = 20 + (paidClaims.length - 2) * 5;
		}

		notices.push({
			policyId: policy.id,
			userId: policy.userId,
			policyNumber: policy.policyNumber,
			expiryDate: policy.endDate,
			daysUntilExpiry,
			hasRecentClaims: paidClaims.length > 0,
			recentClaimsCount: paidClaims.length,
			suggestedPremiumChange: premiumChange
		});
	}

	return notices;
}

export async function createRenewalNotice(notice: RenewalNotice): Promise<PolicyRenewal> {
	const policy = await db.query.policies.findFirst({
		where: eq(policies.id, notice.policyId)
	});

	if (!policy) {
		throw new Error('Policy not found');
	}

	const newPremium = policy.premium * (1 + notice.suggestedPremiumChange / 100);
	const renewalDate = new Date(policy.endDate);
	renewalDate.setFullYear(renewalDate.getFullYear() + 1);

	const renewal: PolicyRenewal = {
		id: uuidv4(),
		policyId: notice.policyId,
		status: 'pending',
		newPremium: Math.round(newPremium * 100) / 100,
		newCoverageAmount: policy.coverageAmount,
		renewalDate: renewalDate.toISOString().split('T')[0],
		expiryDate: policy.endDate,
		noticesSentAt: null,
		reviewedBy: null,
		reviewNotes: null,
		customerResponse: null,
		respondedAt: null,
		createdAt: new Date().toISOString()
	};

	await db.insert(policyRenewals).values(renewal);

	if (notice.hasRecentClaims) {
		await db.update(policyRenewals)
			.set({ status: 'pending' })
			.where(eq(policyRenewals.id, renewal.id));

		const underwriters = await db.query.users.findMany({
			where: eq(users.role, 'underwriter')
		});

		for (const uw of underwriters) {
			await createNotification({
				userId: uw.id,
				type: 'approval_needed',
				title: `Policy Renewal Review - ${policy.policyNumber}`,
				message: `Policy ${policy.policyNumber} has ${notice.recentClaimsCount} recent claims and requires underwriter review before renewal.`,
				relatedPolicyId: policy.id,
				actionUrl: `/underwriter/policies/${policy.id}`
			});
		}
	}

	return renewal;
}

export async function sendRenewalNotices(): Promise<number> {
	const notices = await checkPoliciesForRenewal();
	let sentCount = 0;

	for (const notice of notices) {
		try {
			const renewal = await createRenewalNotice(notice);

			await createNotification({
				userId: notice.userId,
				type: 'system',
				title: `Policy Renewal Notice - ${notice.policyNumber}`,
				message: `Your policy ${notice.policyNumber} expires on ${notice.expiryDate}. Please review and confirm your renewal.`,
				relatedPolicyId: notice.policyId,
				actionUrl: `/policies/${notice.policyId}/renewal`
			});

			await db.update(policyRenewals)
				.set({
					status: 'sent',
					noticesSentAt: new Date().toISOString()
				})
				.where(eq(policyRenewals.id, renewal.id));

			sentCount++;
		} catch (error) {
			console.error(`Failed to send renewal notice for policy ${notice.policyId}:`, error);
		}
	}

	return sentCount;
}

export async function reviewRenewal(
	renewalId: string,
	reviewerId: string,
	approved: boolean,
	notes: string,
	adjustedPremium?: number
): Promise<void> {
	const renewal = await db.query.policyRenewals.findFirst({
		where: eq(policyRenewals.id, renewalId),
		with: { policy: true }
	});

	if (!renewal) {
		throw new Error('Renewal not found');
	}

	await db.update(policyRenewals)
		.set({
			reviewedBy: reviewerId,
			reviewNotes: notes,
			newPremium: adjustedPremium || renewal.newPremium
		})
		.where(eq(policyRenewals.id, renewalId));

	await createNotification({
		userId: renewal.policy!.userId,
		type: 'system',
		title: `Policy Renewal ${approved ? 'Approved' : 'Requires Attention'}`,
		message: approved 
			? `Your policy ${renewal.policy!.policyNumber} renewal has been approved. New premium: $${adjustedPremium || renewal.newPremium}`
			: `Your policy ${renewal.policy!.policyNumber} renewal requires attention. Please contact your agent.`,
		relatedPolicyId: renewal.policyId,
		actionUrl: `/policies/${renewal.policyId}/renewal`
	});
}

export async function respondToRenewal(
	renewalId: string,
	accepted: boolean,
	response?: string
): Promise<void> {
	const renewal = await db.query.policyRenewals.findFirst({
		where: eq(policyRenewals.id, renewalId),
		with: { policy: true }
	});

	if (!renewal) {
		throw new Error('Renewal not found');
	}

	await db.update(policyRenewals)
		.set({
			status: accepted ? 'accepted' : 'rejected',
			customerResponse: response || (accepted ? 'Renewal accepted' : 'Renewal declined'),
			respondedAt: new Date().toISOString()
		})
		.where(eq(policyRenewals.id, renewalId));

	if (accepted && renewal.policy) {
		const newEndDate = new Date(renewal.renewalDate);
		newEndDate.setFullYear(newEndDate.getFullYear() + 1);

		await db.update(policies)
			.set({
				endDate: newEndDate.toISOString().split('T')[0],
				premium: renewal.newPremium || renewal.policy.premium,
				status: 'active',
				updatedAt: new Date().toISOString()
			})
			.where(eq(policies.id, renewal.policyId));
	}

	if (renewal.policy?.agentId) {
		await createNotification({
			userId: renewal.policy.agentId,
			type: 'system',
			title: `Renewal ${accepted ? 'Accepted' : 'Declined'} - ${renewal.policy.policyNumber}`,
			message: `Customer has ${accepted ? 'accepted' : 'declined'} the renewal for policy ${renewal.policy.policyNumber}.`,
			relatedPolicyId: renewal.policyId,
			actionUrl: `/agent/policies/${renewal.policyId}`
		});
	}
}

export async function getPendingRenewals(): Promise<PolicyRenewal[]> {
	return db.query.policyRenewals.findMany({
		where: eq(policyRenewals.status, 'pending'),
		with: {
			policy: {
				with: {
					user: true
				}
			}
		},
		orderBy: [desc(policyRenewals.expiryDate)]
	});
}

export async function getRenewalsByPolicy(policyId: string): Promise<PolicyRenewal | null> {
	return db.query.policyRenewals.findFirst({
		where: eq(policyRenewals.policyId, policyId),
		orderBy: [desc(policyRenewals.createdAt)]
	});
}

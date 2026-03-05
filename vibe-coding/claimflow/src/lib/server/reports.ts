import { db } from './db';
import { claims, users, policies, fraudAlerts, claimWorkflowHistory } from './db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { Claim, User } from './db/schema';

export interface DateRange {
	from?: string;
	to?: string;
}

export interface ClaimsReport {
	summary: {
		totalClaims: number;
		totalClaimed: number;
		totalApproved: number;
		totalPaid: number;
		avgClaimAmount: number;
		avgProcessingDays: number;
		approvalRate: number;
		denialRate: number;
	};
	byStatus: Record<string, number>;
	byType: Record<string, { count: number; totalAmount: number; avgAmount: number }>;
	byPriority: Record<string, number>;
	byMonth: { month: string; count: number; amount: number }[];
	topAdjusters: { adjuster: User; claimsProcessed: number; avgProcessingTime: number; approvalRate: number }[];
}

export interface FraudReport {
	totalAlerts: number;
	byType: Record<string, number>;
	bySeverity: Record<string, number>;
	resolvedCount: number;
	unresolvedCount: number;
	avgFraudScore: number;
	highRiskClaims: number;
}

export interface AdjusterPerformance {
	adjusterId: string;
	adjusterName: string;
	totalClaims: number;
	activeClaims: number;
	resolvedClaims: number;
	avgProcessingTime: number;
	approvalRate: number;
	denialRate: number;
	avgPayoutAmount: number;
	totalPayoutAmount: number;
}

export async function generateClaimsReport(
	dateRange?: DateRange,
	claimType?: string
): Promise<ClaimsReport> {
	let allClaims = await db.query.claims.findMany({
		with: {
			user: true,
			policy: true,
			adjuster: true
		}
	});

	if (dateRange?.from) {
		allClaims = allClaims.filter(c => c.createdAt >= dateRange.from!);
	}
	if (dateRange?.to) {
		allClaims = allClaims.filter(c => c.createdAt <= dateRange.to!);
	}
	if (claimType) {
		allClaims = allClaims.filter(c => c.type === claimType);
	}

	const byStatus: Record<string, number> = {};
	const byType: Record<string, { count: number; totalAmount: number; avgAmount: number }> = {};
	const byPriority: Record<string, number> = {};
	const byMonthMap: Record<string, { count: number; amount: number }> = {};

	let totalClaimed = 0;
	let totalApproved = 0;
	let totalPaid = 0;
	let approvedCount = 0;
	let deniedCount = 0;
	const processingTimes: number[] = [];

	for (const claim of allClaims) {
		byStatus[claim.status] = (byStatus[claim.status] || 0) + 1;
		byPriority[claim.priority] = (byPriority[claim.priority] || 0) + 1;

		if (!byType[claim.type]) {
			byType[claim.type] = { count: 0, totalAmount: 0, avgAmount: 0 };
		}
		byType[claim.type].count++;
		byType[claim.type].totalAmount += claim.amountClaimed;

		const month = claim.createdAt.substring(0, 7);
		if (!byMonthMap[month]) {
			byMonthMap[month] = { count: 0, amount: 0 };
		}
		byMonthMap[month].count++;
		byMonthMap[month].amount += claim.amountClaimed;

		totalClaimed += claim.amountClaimed;
		totalApproved += claim.amountApproved || 0;

		if (claim.status === 'paid') {
			totalPaid += claim.amountApproved || 0;
		}

		if (['approved', 'paid', 'closed'].includes(claim.status) && claim.amountApproved !== null) {
			approvedCount++;
		}
		if (claim.status === 'denied') {
			deniedCount++;
		}

		if (claim.submittedAt && claim.resolvedAt) {
			const submitted = new Date(claim.submittedAt).getTime();
			const resolved = new Date(claim.resolvedAt).getTime();
			const days = (resolved - submitted) / (1000 * 60 * 60 * 24);
			processingTimes.push(days);
		}
	}

	for (const type in byType) {
		byType[type].avgAmount = byType[type].count > 0 
			? byType[type].totalAmount / byType[type].count 
			: 0;
	}

	const byMonth = Object.entries(byMonthMap)
		.map(([month, data]) => ({ month, ...data }))
		.sort((a, b) => a.month.localeCompare(b.month));

	const adjusterStats: Record<string, { claims: Claim[]; processingTimes: number[] }> = {};
	for (const claim of allClaims.filter(c => c.adjuster)) {
		const adjId = claim.adjuster!.id;
		if (!adjusterStats[adjId]) {
			adjusterStats[adjId] = { claims: [], processingTimes: [] };
		}
		adjusterStats[adjId].claims.push(claim);
		
		if (claim.submittedAt && claim.resolvedAt) {
			const days = (new Date(claim.resolvedAt).getTime() - new Date(claim.submittedAt).getTime()) / (1000 * 60 * 60 * 24);
			adjusterStats[adjId].processingTimes.push(days);
		}
	}

	const topAdjusters = Object.entries(adjusterStats)
		.map(([adjId, stats]) => {
			const adjuster = allClaims.find(c => c.adjuster?.id === adjId)?.adjuster;
			const approved = stats.claims.filter(c => ['approved', 'paid', 'closed'].includes(c.status)).length;
			return {
				adjuster: adjuster!,
				claimsProcessed: stats.claims.length,
				avgProcessingTime: stats.processingTimes.length > 0
					? stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length
					: 0,
				approvalRate: stats.claims.length > 0 ? (approved / stats.claims.length) * 100 : 0
			};
		})
		.sort((a, b) => b.claimsProcessed - a.claimsProcessed)
		.slice(0, 10);

	const resolvedClaims = allClaims.filter(c => ['approved', 'denied', 'paid', 'closed'].includes(c.status)).length;

	return {
		summary: {
			totalClaims: allClaims.length,
			totalClaimed,
			totalApproved,
			totalPaid,
			avgClaimAmount: allClaims.length > 0 ? totalClaimed / allClaims.length : 0,
			avgProcessingDays: processingTimes.length > 0
				? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
				: 0,
			approvalRate: resolvedClaims > 0 ? (approvedCount / resolvedClaims) * 100 : 0,
			denialRate: resolvedClaims > 0 ? (deniedCount / resolvedClaims) * 100 : 0
		},
		byStatus,
		byType,
		byPriority,
		byMonth,
		topAdjusters
	};
}

export async function generateFraudReport(dateRange?: DateRange): Promise<FraudReport> {
	let alerts = await db.query.fraudAlerts.findMany({
		with: { claim: true }
	});

	if (dateRange?.from) {
		alerts = alerts.filter(a => a.createdAt >= dateRange.from!);
	}
	if (dateRange?.to) {
		alerts = alerts.filter(a => a.createdAt <= dateRange.to!);
	}

	const byType: Record<string, number> = {};
	const bySeverity: Record<string, number> = {};
	let resolvedCount = 0;

	for (const alert of alerts) {
		byType[alert.alertType] = (byType[alert.alertType] || 0) + 1;
		bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
		if (alert.isResolved) resolvedCount++;
	}

	let allClaims = await db.query.claims.findMany();
	if (dateRange?.from) {
		allClaims = allClaims.filter(c => c.createdAt >= dateRange.from!);
	}
	if (dateRange?.to) {
		allClaims = allClaims.filter(c => c.createdAt <= dateRange.to!);
	}

	const claimsWithScore = allClaims.filter(c => c.fraudScore !== null);
	const avgFraudScore = claimsWithScore.length > 0
		? claimsWithScore.reduce((sum, c) => sum + (c.fraudScore || 0), 0) / claimsWithScore.length
		: 0;

	const highRiskClaims = claimsWithScore.filter(c => (c.fraudScore || 0) >= 50).length;

	return {
		totalAlerts: alerts.length,
		byType,
		bySeverity,
		resolvedCount,
		unresolvedCount: alerts.length - resolvedCount,
		avgFraudScore,
		highRiskClaims
	};
}

export async function generateAdjusterPerformanceReport(dateRange?: DateRange): Promise<AdjusterPerformance[]> {
	const adjusters = await db.query.users.findMany({
		where: eq(users.role, 'adjuster')
	});

	let allClaims = await db.query.claims.findMany({
		with: { adjuster: true }
	});

	if (dateRange?.from) {
		allClaims = allClaims.filter(c => c.createdAt >= dateRange.from!);
	}
	if (dateRange?.to) {
		allClaims = allClaims.filter(c => c.createdAt <= dateRange.to!);
	}

	const performance: AdjusterPerformance[] = [];

	for (const adjuster of adjusters) {
		const adjusterClaims = allClaims.filter(c => c.assignedAdjusterId === adjuster.id);
		const activeClaims = adjusterClaims.filter(c => !['paid', 'closed', 'denied'].includes(c.status));
		const resolvedClaims = adjusterClaims.filter(c => ['paid', 'closed', 'denied'].includes(c.status));
		const approvedClaims = adjusterClaims.filter(c => ['approved', 'paid', 'closed'].includes(c.status) && c.amountApproved !== null);
		const deniedClaims = adjusterClaims.filter(c => c.status === 'denied');

		const processingTimes: number[] = [];
		for (const claim of resolvedClaims) {
			if (claim.submittedAt && claim.resolvedAt) {
				const days = (new Date(claim.resolvedAt).getTime() - new Date(claim.submittedAt).getTime()) / (1000 * 60 * 60 * 24);
				processingTimes.push(days);
			}
		}

		const totalPayout = approvedClaims.reduce((sum, c) => sum + (c.amountApproved || 0), 0);

		performance.push({
			adjusterId: adjuster.id,
			adjusterName: `${adjuster.firstName} ${adjuster.lastName}`,
			totalClaims: adjusterClaims.length,
			activeClaims: activeClaims.length,
			resolvedClaims: resolvedClaims.length,
			avgProcessingTime: processingTimes.length > 0
				? Math.round((processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length) * 10) / 10
				: 0,
			approvalRate: resolvedClaims.length > 0
				? Math.round((approvedClaims.length / resolvedClaims.length) * 1000) / 10
				: 0,
			denialRate: resolvedClaims.length > 0
				? Math.round((deniedClaims.length / resolvedClaims.length) * 1000) / 10
				: 0,
			avgPayoutAmount: approvedClaims.length > 0
				? Math.round(totalPayout / approvedClaims.length)
				: 0,
			totalPayoutAmount: totalPayout
		});
	}

	return performance.sort((a, b) => b.totalClaims - a.totalClaims);
}

export async function getPayoutsByCategory(dateRange?: DateRange): Promise<Record<string, { count: number; total: number; avg: number }>> {
	let paidClaims = await db.query.claims.findMany({
		with: { policy: true }
	});

	paidClaims = paidClaims.filter(c => c.status === 'paid' && c.amountApproved !== null);

	if (dateRange?.from) {
		paidClaims = paidClaims.filter(c => c.resolvedAt && c.resolvedAt >= dateRange.from!);
	}
	if (dateRange?.to) {
		paidClaims = paidClaims.filter(c => c.resolvedAt && c.resolvedAt <= dateRange.to!);
	}

	const byCategory: Record<string, { count: number; total: number; avg: number }> = {};

	for (const claim of paidClaims) {
		const category = claim.policy?.type || 'unknown';
		if (!byCategory[category]) {
			byCategory[category] = { count: 0, total: 0, avg: 0 };
		}
		byCategory[category].count++;
		byCategory[category].total += claim.amountApproved || 0;
	}

	for (const category in byCategory) {
		byCategory[category].avg = byCategory[category].count > 0
			? byCategory[category].total / byCategory[category].count
			: 0;
	}

	return byCategory;
}

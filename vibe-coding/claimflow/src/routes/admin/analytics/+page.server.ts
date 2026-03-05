import type { PageServerLoad } from './$types';
import { generateClaimsReport, generateFraudReport, generateAdjusterPerformanceReport } from '$lib/server/reports';

export const load: PageServerLoad = async ({ url }) => {
	const dateFrom = url.searchParams.get('from') || undefined;
	const dateTo = url.searchParams.get('to') || undefined;
	const dateRange = { from: dateFrom, to: dateTo };

	const [report, fraudReport, adjusterPerformance] = await Promise.all([
		generateClaimsReport(dateRange),
		generateFraudReport(dateRange),
		generateAdjusterPerformanceReport(dateRange)
	]);

	return {
		report,
		fraudReport,
		adjusterPerformance
	};
};

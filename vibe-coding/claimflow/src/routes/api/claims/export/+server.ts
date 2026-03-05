import type { RequestHandler } from './$types';
import { exportClaimsToCSV, type ClaimExportFilters } from '$lib/server/batch';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!['admin', 'adjuster'].includes(locals.user.role)) {
		return new Response('Forbidden', { status: 403 });
	}

	const filters: ClaimExportFilters = {};
	
	const statusParam = url.searchParams.get('status');
	if (statusParam) {
		filters.status = statusParam.split(',') as ClaimExportFilters['status'];
	}
	
	const typeParam = url.searchParams.get('type');
	if (typeParam) {
		filters.type = typeParam.split(',');
	}
	
	const dateFrom = url.searchParams.get('dateFrom');
	if (dateFrom) {
		filters.dateFrom = dateFrom;
	}
	
	const dateTo = url.searchParams.get('dateTo');
	if (dateTo) {
		filters.dateTo = dateTo;
	}
	
	const adjusterId = url.searchParams.get('adjusterId');
	if (adjusterId) {
		filters.adjusterId = adjusterId;
	}
	
	const minAmount = url.searchParams.get('minAmount');
	if (minAmount) {
		filters.minAmount = parseFloat(minAmount);
	}
	
	const maxAmount = url.searchParams.get('maxAmount');
	if (maxAmount) {
		filters.maxAmount = parseFloat(maxAmount);
	}

	const csv = await exportClaimsToCSV(filters);
	const filename = `claims-export-${new Date().toISOString().split('T')[0]}.csv`;

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};

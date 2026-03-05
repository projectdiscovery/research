<script lang="ts">
	import { BarChart3, TrendingUp, DollarSign, Clock, Users, AlertTriangle, Download, Calendar, Filter } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	let dateFrom = $state('');
	let dateTo = $state('');
	let activeTab = $state('overview');

	const statusColors: Record<string, string> = {
		draft: '#94a3b8',
		filed: '#3b82f6',
		under_review: '#eab308',
		investigation: '#f97316',
		estimation: '#a855f7',
		pending_approval: '#6366f1',
		approved: '#22c55e',
		denied: '#ef4444',
		payment_pending: '#14b8a6',
		paid: '#10b981',
		closed: '#64748b'
	};
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">Analytics Dashboard</h1>
			<p class="text-surface-600 mt-1">Claims performance and system metrics</p>
		</div>
		
		<div class="flex gap-2">
			<input type="date" class="input w-auto text-sm" bind:value={dateFrom} />
			<span class="self-center text-surface-400">to</span>
			<input type="date" class="input w-auto text-sm" bind:value={dateTo} />
			<a href="/admin/analytics/export" class="btn-secondary flex items-center gap-2">
				<Download class="w-4 h-4" />
				Export
			</a>
		</div>
	</div>
	
	<div class="flex gap-2 border-b border-surface-200">
		<button 
			class="px-4 py-2 font-medium text-sm transition-colors {activeTab === 'overview' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-surface-600 hover:text-surface-900'}"
			onclick={() => activeTab = 'overview'}
		>
			Overview
		</button>
		<button 
			class="px-4 py-2 font-medium text-sm transition-colors {activeTab === 'adjusters' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-surface-600 hover:text-surface-900'}"
			onclick={() => activeTab = 'adjusters'}
		>
			Adjuster Performance
		</button>
		<button 
			class="px-4 py-2 font-medium text-sm transition-colors {activeTab === 'fraud' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-surface-600 hover:text-surface-900'}"
			onclick={() => activeTab = 'fraud'}
		>
			Fraud Analysis
		</button>
	</div>
	
	{#if activeTab === 'overview'}
		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">Total Claims</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">{data.report.summary.totalClaims}</p>
					</div>
					<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
						<BarChart3 class="w-6 h-6 text-blue-600" />
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">Total Claimed</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">${(data.report.summary.totalClaimed / 1000).toFixed(0)}K</p>
					</div>
					<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
						<DollarSign class="w-6 h-6 text-yellow-600" />
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">Total Paid Out</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">${(data.report.summary.totalPaid / 1000).toFixed(0)}K</p>
					</div>
					<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
						<TrendingUp class="w-6 h-6 text-green-600" />
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">Avg. Processing</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">{data.report.summary.avgProcessingDays.toFixed(1)} days</p>
					</div>
					<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
						<Clock class="w-6 h-6 text-purple-600" />
					</div>
				</div>
			</div>
		</div>
		
		<div class="grid lg:grid-cols-2 gap-6">
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Claims by Status</h3>
				<div class="space-y-3">
					{#each Object.entries(data.report.byStatus) as [status, count]}
						{@const percentage = (count / data.report.summary.totalClaims) * 100}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span class="capitalize text-surface-700">{status.replace('_', ' ')}</span>
								<span class="text-surface-500">{count} ({percentage.toFixed(1)}%)</span>
							</div>
							<div class="h-2 bg-surface-100 rounded-full overflow-hidden">
								<div 
									class="h-full rounded-full transition-all"
									style="width: {percentage}%; background-color: {statusColors[status] || '#94a3b8'}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Claims by Type</h3>
				<div class="space-y-3">
					{#each Object.entries(data.report.byType) as [type, stats]}
						<div class="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
							<div>
								<p class="font-medium text-surface-900 capitalize">{type}</p>
								<p class="text-sm text-surface-500">{stats.count} claims</p>
							</div>
							<div class="text-right">
								<p class="font-medium text-surface-900">${stats.totalAmount.toLocaleString()}</p>
								<p class="text-sm text-surface-500">Avg: ${stats.avgAmount.toLocaleString()}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
		
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Approval Rates</h3>
			<div class="grid sm:grid-cols-2 gap-6">
				<div class="text-center p-6 bg-green-50 rounded-lg">
					<p class="text-4xl font-bold text-green-600">{data.report.summary.approvalRate.toFixed(1)}%</p>
					<p class="text-green-700 mt-1">Approval Rate</p>
				</div>
				<div class="text-center p-6 bg-red-50 rounded-lg">
					<p class="text-4xl font-bold text-red-600">{data.report.summary.denialRate.toFixed(1)}%</p>
					<p class="text-red-700 mt-1">Denial Rate</p>
				</div>
			</div>
		</div>
	{/if}
	
	{#if activeTab === 'adjusters'}
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Adjuster Performance</h3>
			
			{#if data.adjusterPerformance.length === 0}
				<p class="text-surface-500 text-center py-8">No adjuster data available</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-surface-50 border-b border-surface-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Adjuster</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Total Claims</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Active</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Resolved</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Avg. Days</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Approval Rate</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Total Payout</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-surface-100">
							{#each data.adjusterPerformance as adj}
								<tr class="hover:bg-surface-50">
									<td class="px-4 py-4 font-medium text-surface-900">{adj.adjusterName}</td>
									<td class="px-4 py-4">{adj.totalClaims}</td>
									<td class="px-4 py-4">{adj.activeClaims}</td>
									<td class="px-4 py-4">{adj.resolvedClaims}</td>
									<td class="px-4 py-4">{adj.avgProcessingTime} days</td>
									<td class="px-4 py-4">
										<span class="{adj.approvalRate >= 70 ? 'text-green-600' : adj.approvalRate >= 50 ? 'text-yellow-600' : 'text-red-600'} font-medium">
											{adj.approvalRate}%
										</span>
									</td>
									<td class="px-4 py-4">${adj.totalPayoutAmount.toLocaleString()}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
	
	{#if activeTab === 'fraud'}
		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">Total Alerts</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">{data.fraudReport.totalAlerts}</p>
					</div>
					<div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
						<AlertTriangle class="w-6 h-6 text-red-600" />
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">High Risk Claims</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">{data.fraudReport.highRiskClaims}</p>
					</div>
					<div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
						<AlertTriangle class="w-6 h-6 text-orange-600" />
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">Unresolved</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">{data.fraudReport.unresolvedCount}</p>
					</div>
					<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
						<Clock class="w-6 h-6 text-yellow-600" />
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-500">Avg. Fraud Score</p>
						<p class="text-2xl font-bold text-surface-900 mt-1">{data.fraudReport.avgFraudScore.toFixed(1)}</p>
					</div>
					<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
						<BarChart3 class="w-6 h-6 text-purple-600" />
					</div>
				</div>
			</div>
		</div>
		
		<div class="grid lg:grid-cols-2 gap-6">
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Alerts by Type</h3>
				<div class="space-y-3">
					{#each Object.entries(data.fraudReport.byType) as [type, count]}
						<div class="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
							<span class="capitalize text-surface-700">{type.replace('_', ' ')}</span>
							<span class="font-medium text-surface-900">{count}</span>
						</div>
					{/each}
				</div>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Alerts by Severity</h3>
				<div class="space-y-3">
					{#each Object.entries(data.fraudReport.bySeverity) as [severity, count]}
						<div class="flex items-center justify-between p-3 rounded-lg {severity === 'high' ? 'bg-red-50' : severity === 'medium' ? 'bg-yellow-50' : 'bg-green-50'}">
							<span class="capitalize font-medium {severity === 'high' ? 'text-red-700' : severity === 'medium' ? 'text-yellow-700' : 'text-green-700'}">{severity}</span>
							<span class="font-bold {severity === 'high' ? 'text-red-700' : severity === 'medium' ? 'text-yellow-700' : 'text-green-700'}">{count}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

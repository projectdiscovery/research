<script lang="ts">
	import { DollarSign, TrendingUp, Calendar, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Commission Report</h1>
		<p class="text-surface-600 mt-1">Track your earnings from policy sales</p>
	</div>
	
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Total Earned (YTD)</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">${data.stats.yearToDate.toLocaleString()}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<DollarSign class="w-6 h-6 text-green-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">This Month</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">${data.stats.thisMonth.toLocaleString()}</p>
				</div>
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<Calendar class="w-6 h-6 text-primary-600" />
				</div>
			</div>
			<div class="mt-2 flex items-center gap-1 text-sm {data.stats.monthChange >= 0 ? 'text-green-600' : 'text-red-600'}">
				{#if data.stats.monthChange >= 0}
					<ArrowUpRight class="w-4 h-4" />
				{:else}
					<ArrowDownRight class="w-4 h-4" />
				{/if}
				<span>{Math.abs(data.stats.monthChange).toFixed(1)}% from last month</span>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Active Policies</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.activePolicies}</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<FileText class="w-6 h-6 text-blue-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Avg. Commission Rate</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.avgRate}%</p>
				</div>
				<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
					<TrendingUp class="w-6 h-6 text-yellow-600" />
				</div>
			</div>
		</div>
	</div>
	
	<div class="card">
		<h3 class="text-lg font-semibold text-surface-900 mb-4">Commission Breakdown by Policy</h3>
		
		{#if data.policies.length === 0}
			<p class="text-surface-500 text-center py-8">No active policies</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-surface-50 border-b border-surface-200">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Policy</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Customer</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Type</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Premium</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Rate</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Commission</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-100">
						{#each data.policies as policy}
							<tr class="hover:bg-surface-50">
								<td class="px-4 py-4">
									<p class="font-medium text-surface-900">{policy.policyNumber}</p>
									<p class="text-sm text-surface-500">{policy.status}</p>
								</td>
								<td class="px-4 py-4">{policy.user?.firstName} {policy.user?.lastName}</td>
								<td class="px-4 py-4 capitalize">{policy.type}</td>
								<td class="px-4 py-4">${policy.premium.toLocaleString()}/{policy.premiumFrequency.slice(0, 2)}</td>
								<td class="px-4 py-4">{policy.commissionRate}%</td>
								<td class="px-4 py-4 font-medium text-green-600">${policy.commission.toFixed(2)}/mo</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

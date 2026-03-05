<script lang="ts">
	import { AlertTriangle, Clock, CheckCircle, DollarSign, ArrowRight, TrendingUp, FileText } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Underwriter Dashboard</h1>
		<p class="text-surface-600 mt-1">Welcome back, {data.user.firstName}! Review high-value claims and assess risk.</p>
	</div>
	
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Pending Review</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.pendingReview}</p>
				</div>
				<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
					<Clock class="w-6 h-6 text-yellow-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Approved This Month</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.approvedThisMonth}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<CheckCircle class="w-6 h-6 text-green-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Total Exposure</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">${(data.stats.totalExposure / 1000).toFixed(0)}K</p>
				</div>
				<div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
					<DollarSign class="w-6 h-6 text-red-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Avg Risk Score</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.avgRiskScore}</p>
				</div>
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<TrendingUp class="w-6 h-6 text-primary-600" />
				</div>
			</div>
		</div>
	</div>
	
	<div class="card">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-surface-900">Claims Requiring Your Review</h2>
			<a href="/underwriter/claims" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
				View all
				<ArrowRight class="w-4 h-4" />
			</a>
		</div>
		
		{#if data.pendingClaims.length === 0}
			<div class="text-center py-12 text-surface-500">
				<CheckCircle class="w-16 h-16 mx-auto mb-4 text-green-300" />
				<h3 class="text-lg font-medium text-surface-900">All Caught Up!</h3>
				<p>No high-value claims requiring review at the moment.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-surface-50 border-b border-surface-200">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Claim</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Policy Type</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Amount</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Recommended</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Adjuster</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-100">
						{#each data.pendingClaims as claim}
							<tr class="hover:bg-surface-50">
								<td class="px-4 py-4">
									<p class="font-medium text-surface-900">{claim.claimNumber}</p>
									<p class="text-sm text-surface-500">{claim.user?.firstName} {claim.user?.lastName}</p>
								</td>
								<td class="px-4 py-4 capitalize">{claim.policy?.type}</td>
								<td class="px-4 py-4 font-medium">${claim.amountClaimed.toLocaleString()}</td>
								<td class="px-4 py-4 text-primary-600 font-medium">
									{claim.amountRecommended ? `$${claim.amountRecommended.toLocaleString()}` : '—'}
								</td>
								<td class="px-4 py-4 text-sm">
									{claim.adjuster?.firstName} {claim.adjuster?.lastName}
								</td>
								<td class="px-4 py-4">
									<a href="/underwriter/claims/{claim.id}" class="btn-primary text-sm py-1.5">
										Review
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

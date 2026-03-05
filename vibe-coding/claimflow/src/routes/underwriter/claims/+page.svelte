<script lang="ts">
	import { AlertTriangle, Search, CheckCircle, DollarSign, Clock, ArrowRight } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	let searchQuery = $state('');
	
	let filteredClaims = $derived(
		data.claims.filter(claim => {
			return claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				claim.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				claim.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
		})
	);
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">High-Value Claims Review</h1>
		<p class="text-surface-600 mt-1">Claims over $50,000 requiring underwriter approval</p>
	</div>
	
	<div class="flex gap-4">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
			<input
				type="text"
				placeholder="Search claims..."
				class="input pl-10"
				bind:value={searchQuery}
			/>
		</div>
	</div>
	
	{#if filteredClaims.length === 0}
		<div class="card text-center py-12">
			<CheckCircle class="w-16 h-16 mx-auto text-green-300 mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No Claims Pending Review</h3>
			<p class="text-surface-600 mt-1">All high-value claims have been processed</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredClaims as claim}
				<div class="card hover:shadow-md transition-shadow">
					<div class="flex flex-col lg:flex-row lg:items-center gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<h3 class="text-lg font-semibold text-surface-900">{claim.claimNumber}</h3>
								<span class="badge bg-purple-100 text-purple-700">Pending Review</span>
								<span class="badge {claim.priority === 'urgent' ? 'bg-red-100 text-red-700' : claim.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-surface-100 text-surface-700'}">
									{claim.priority}
								</span>
							</div>
							<p class="text-surface-600 line-clamp-2">{claim.description}</p>
							<div class="flex flex-wrap gap-4 mt-3 text-sm text-surface-500">
								<span>{claim.user?.firstName} {claim.user?.lastName}</span>
								<span>{claim.policy?.type} Insurance</span>
								<span>Incident: {format(new Date(claim.incidentDate), 'MMM d, yyyy')}</span>
							</div>
						</div>
						
						<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
							<div class="text-right">
								<p class="text-sm text-surface-500">Claimed Amount</p>
								<p class="text-xl font-bold text-surface-900">${claim.amountClaimed.toLocaleString()}</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-surface-500">Recommended</p>
								<p class="text-xl font-bold text-primary-600">
									{claim.amountRecommended ? `$${claim.amountRecommended.toLocaleString()}` : '—'}
								</p>
							</div>
							<a href="/underwriter/claims/{claim.id}" class="btn-primary whitespace-nowrap">
								Review Claim
							</a>
						</div>
					</div>
					
					{#if claim.adjuster}
						<div class="mt-4 pt-4 border-t border-surface-100 text-sm">
							<span class="text-surface-500">Adjuster:</span>
							<span class="text-surface-900 font-medium ml-1">{claim.adjuster.firstName} {claim.adjuster.lastName}</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

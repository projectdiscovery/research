<script lang="ts">
	import { Car, Home, Heart, Shield, Search, Filter, ChevronRight } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	const policyIcons: Record<string, typeof Car> = {
		auto: Car,
		home: Home,
		health: Heart,
		life: Shield
	};
	
	const policyLabels: Record<string, string> = {
		auto: 'Auto Insurance',
		home: 'Home Insurance',
		health: 'Health Insurance',
		life: 'Life Insurance'
	};
	
	let searchQuery = $state('');
	let typeFilter = $state('all');
	
	let filteredPolicies = $derived(
		data.policies.filter(policy => {
			const matchesSearch = policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				policy.description?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesType = typeFilter === 'all' || policy.type === typeFilter;
			return matchesSearch && matchesType;
		})
	);
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">Your Policies</h1>
			<p class="text-surface-600 mt-1">Manage and view your insurance policies</p>
		</div>
	</div>
	
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
			<input
				type="text"
				placeholder="Search policies..."
				class="input pl-10"
				bind:value={searchQuery}
			/>
		</div>
		<select class="input w-auto" bind:value={typeFilter}>
			<option value="all">All Types</option>
			<option value="auto">Auto</option>
			<option value="home">Home</option>
			<option value="health">Health</option>
			<option value="life">Life</option>
		</select>
	</div>
	
	{#if filteredPolicies.length === 0}
		<div class="card text-center py-12">
			<Shield class="w-16 h-16 mx-auto text-surface-300 mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No policies found</h3>
			<p class="text-surface-600 mt-1">
				{searchQuery || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Contact your agent to add policies'}
			</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each filteredPolicies as policy}
				{@const Icon = policyIcons[policy.type] || Shield}
				<a href="/policies/{policy.id}" class="card hover:shadow-md transition-shadow">
					<div class="flex items-start gap-4">
						<div class="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
							<Icon class="w-7 h-7 text-primary-600" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-start justify-between gap-4">
								<div>
									<h3 class="font-semibold text-surface-900">{policy.description || policyLabels[policy.type]}</h3>
									<p class="text-sm text-surface-500 mt-0.5">{policy.policyNumber}</p>
								</div>
								<span class="badge {policy.status === 'active' ? 'badge-success' : policy.status === 'pending' ? 'badge-warning' : 'badge-neutral'}">
									{policy.status}
								</span>
							</div>
							<div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
								<div>
									<p class="text-xs text-surface-500">Coverage</p>
									<p class="font-medium text-surface-900">${policy.coverageAmount.toLocaleString()}</p>
								</div>
								<div>
									<p class="text-xs text-surface-500">Premium</p>
									<p class="font-medium text-surface-900">${policy.premium}/{policy.premiumFrequency === 'monthly' ? 'mo' : policy.premiumFrequency === 'quarterly' ? 'qtr' : 'yr'}</p>
								</div>
								<div>
									<p class="text-xs text-surface-500">Deductible</p>
									<p class="font-medium text-surface-900">${policy.deductible.toLocaleString()}</p>
								</div>
								<div>
									<p class="text-xs text-surface-500">Expires</p>
									<p class="font-medium text-surface-900">{format(new Date(policy.endDate), 'MMM d, yyyy')}</p>
								</div>
							</div>
						</div>
						<ChevronRight class="w-5 h-5 text-surface-400 flex-shrink-0 hidden sm:block" />
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import { AlertTriangle, Search, Plus, ChevronRight, Clock, CheckCircle, XCircle, FileText } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	const statusColors: Record<string, string> = {
		draft: 'badge-neutral',
		submitted: 'badge-info',
		under_review: 'badge-warning',
		approved: 'badge-success',
		denied: 'badge-error',
		paid: 'badge-success',
		closed: 'badge-neutral'
	};
	
	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		submitted: 'Submitted',
		under_review: 'Under Review',
		approved: 'Approved',
		denied: 'Denied',
		paid: 'Paid',
		closed: 'Closed'
	};
	
	const typeLabels: Record<string, string> = {
		accident: 'Accident',
		theft: 'Theft',
		damage: 'Property Damage',
		medical: 'Medical',
		liability: 'Liability',
		other: 'Other'
	};
	
	let searchQuery = $state('');
	let statusFilter = $state('all');
	
	let filteredClaims = $derived(
		data.claims.filter(claim => {
			const matchesSearch = claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				claim.description.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">Your Claims</h1>
			<p class="text-surface-600 mt-1">Track and manage your insurance claims</p>
		</div>
		<a href="/claims/new" class="btn-primary flex items-center gap-2">
			<Plus class="w-5 h-5" />
			File New Claim
		</a>
	</div>
	
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
			<input
				type="text"
				placeholder="Search claims..."
				class="input pl-10"
				bind:value={searchQuery}
			/>
		</div>
		<select class="input w-auto" bind:value={statusFilter}>
			<option value="all">All Statuses</option>
			<option value="draft">Draft</option>
			<option value="submitted">Submitted</option>
			<option value="under_review">Under Review</option>
			<option value="approved">Approved</option>
			<option value="denied">Denied</option>
			<option value="paid">Paid</option>
			<option value="closed">Closed</option>
		</select>
	</div>
	
	{#if filteredClaims.length === 0}
		<div class="card text-center py-12">
			<AlertTriangle class="w-16 h-16 mx-auto text-surface-300 mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No claims found</h3>
			<p class="text-surface-600 mt-1 mb-4">
				{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'You haven\'t filed any claims yet'}
			</p>
			{#if !searchQuery && statusFilter === 'all'}
				<a href="/claims/new" class="btn-primary inline-flex items-center gap-2">
					<Plus class="w-5 h-5" />
					File Your First Claim
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid gap-4">
			{#each filteredClaims as claim}
				<a href="/claims/{claim.id}" class="card hover:shadow-md transition-shadow">
					<div class="flex items-start gap-4">
						<div class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 {
							claim.status === 'approved' || claim.status === 'paid' ? 'bg-green-100' :
							claim.status === 'denied' ? 'bg-red-100' :
							claim.status === 'under_review' ? 'bg-yellow-100' :
							'bg-surface-100'
						}">
							{#if claim.status === 'approved' || claim.status === 'paid'}
								<CheckCircle class="w-7 h-7 text-green-600" />
							{:else if claim.status === 'denied'}
								<XCircle class="w-7 h-7 text-red-600" />
							{:else if claim.status === 'under_review'}
								<Clock class="w-7 h-7 text-yellow-600" />
							{:else}
								<FileText class="w-7 h-7 text-surface-600" />
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-start justify-between gap-4">
								<div>
									<div class="flex items-center gap-2">
										<h3 class="font-semibold text-surface-900">{claim.claimNumber}</h3>
										<span class="badge {statusColors[claim.status]}">
											{statusLabels[claim.status]}
										</span>
									</div>
									<p class="text-sm text-surface-500 mt-0.5">{typeLabels[claim.type]} • {claim.policy?.policyNumber}</p>
								</div>
								<div class="text-right flex-shrink-0">
									<p class="font-semibold text-surface-900">${claim.amountClaimed.toLocaleString()}</p>
									{#if claim.amountApproved !== null && claim.amountApproved !== undefined}
										<p class="text-sm text-green-600">Approved: ${claim.amountApproved.toLocaleString()}</p>
									{/if}
								</div>
							</div>
							<p class="text-surface-600 mt-2 line-clamp-2">{claim.description}</p>
							<div class="mt-3 flex items-center gap-4 text-sm text-surface-500">
								<span>Incident: {format(new Date(claim.incidentDate), 'MMM d, yyyy')}</span>
								{#if claim.submittedAt}
									<span>Submitted: {format(new Date(claim.submittedAt), 'MMM d, yyyy')}</span>
								{/if}
							</div>
						</div>
						<ChevronRight class="w-5 h-5 text-surface-400 flex-shrink-0 hidden sm:block" />
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

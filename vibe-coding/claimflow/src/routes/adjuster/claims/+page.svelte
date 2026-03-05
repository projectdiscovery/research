<script lang="ts">
	import { AlertTriangle, Search, Filter, ChevronRight, Clock, CheckCircle, XCircle, FileText, MessageSquare } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	const statusColors: Record<string, string> = {
		submitted: 'badge-info',
		under_review: 'badge-warning',
		needs_info: 'badge-warning',
		pending_underwriter: 'badge-info',
		approved: 'badge-success',
		denied: 'badge-error',
		paid: 'badge-success',
		closed: 'badge-neutral'
	};

	const statusLabels: Record<string, string> = {
		submitted: 'Submitted',
		under_review: 'Under Review',
		needs_info: 'Needs Info',
		pending_underwriter: 'Pending UW',
		approved: 'Approved',
		denied: 'Denied',
		paid: 'Paid',
		closed: 'Closed'
	};

	const priorityColors: Record<string, string> = {
		low: 'bg-surface-100 text-surface-600',
		medium: 'bg-blue-100 text-blue-700',
		high: 'bg-orange-100 text-orange-700',
		urgent: 'bg-red-100 text-red-700'
	};
	
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let priorityFilter = $state('all');
	
	let filteredClaims = $derived(
		data.claims.filter(claim => {
			const matchesSearch = claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				claim.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				claim.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
			const matchesPriority = priorityFilter === 'all' || claim.priority === priorityFilter;
			return matchesSearch && matchesStatus && matchesPriority;
		})
	);
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">My Assigned Claims</h1>
		<p class="text-surface-600 mt-1">Manage and process your assigned insurance claims</p>
	</div>
	
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
			<input
				type="text"
				placeholder="Search claims or claimants..."
				class="input pl-10"
				bind:value={searchQuery}
			/>
		</div>
		<select class="input w-auto" bind:value={statusFilter}>
			<option value="all">All Statuses</option>
			<option value="submitted">Submitted</option>
			<option value="under_review">Under Review</option>
			<option value="needs_info">Needs Info</option>
			<option value="pending_underwriter">Pending UW</option>
			<option value="approved">Approved</option>
			<option value="denied">Denied</option>
		</select>
		<select class="input w-auto" bind:value={priorityFilter}>
			<option value="all">All Priorities</option>
			<option value="urgent">Urgent</option>
			<option value="high">High</option>
			<option value="medium">Medium</option>
			<option value="low">Low</option>
		</select>
	</div>
	
	{#if filteredClaims.length === 0}
		<div class="card text-center py-12">
			<AlertTriangle class="w-16 h-16 mx-auto text-surface-300 mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No claims found</h3>
			<p class="text-surface-600 mt-1">
				{searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' ? 'Try adjusting your filters' : 'No claims assigned to you yet'}
			</p>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-surface-200 overflow-hidden">
			<table class="w-full">
				<thead class="bg-surface-50 border-b border-surface-200">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Claim</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider hidden sm:table-cell">Claimant</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider hidden md:table-cell">Type</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Amount</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider hidden lg:table-cell">Priority</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-100">
					{#each filteredClaims as claim}
						<tr class="hover:bg-surface-50 transition-colors">
							<td class="px-4 py-4">
								<div>
									<p class="font-medium text-surface-900">{claim.claimNumber}</p>
									<p class="text-sm text-surface-500">{format(new Date(claim.incidentDate), 'MMM d, yyyy')}</p>
								</div>
							</td>
							<td class="px-4 py-4 hidden sm:table-cell">
								<p class="text-surface-900">{claim.user?.firstName} {claim.user?.lastName}</p>
								<p class="text-sm text-surface-500">{claim.user?.email}</p>
							</td>
							<td class="px-4 py-4 hidden md:table-cell">
								<span class="capitalize">{claim.type}</span>
							</td>
							<td class="px-4 py-4">
								<p class="font-medium text-surface-900">${claim.amountClaimed.toLocaleString()}</p>
								{#if claim.amountRecommended}
									<p class="text-sm text-primary-600">Rec: ${claim.amountRecommended.toLocaleString()}</p>
								{/if}
							</td>
							<td class="px-4 py-4">
								<span class="badge {statusColors[claim.status]}">{statusLabels[claim.status]}</span>
							</td>
							<td class="px-4 py-4 hidden lg:table-cell">
								<span class="badge {priorityColors[claim.priority]}">{claim.priority}</span>
							</td>
							<td class="px-4 py-4">
								<a href="/adjuster/claims/{claim.id}" class="btn-secondary text-sm py-1.5">
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

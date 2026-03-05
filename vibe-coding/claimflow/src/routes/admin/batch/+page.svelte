<script lang="ts">
	import { enhance } from '$app/forms';
	import { CheckSquare, Users, Download, AlertCircle, Check, X } from 'lucide-svelte';
	
	let { data } = $props();
	
	let selectedClaims = $state<string[]>([]);
	let selectedStatus = $state('');
	let selectedAdjuster = $state('');
	let batchNotes = $state('');
	let statusFilter = $state('');
	let typeFilter = $state('');
	let isProcessing = $state(false);
	let result = $state<{ success?: number; failed?: number; errors?: { claimId: string; error: string }[] } | null>(null);
	
	const filteredClaims = $derived(
		data.claims.filter(c => {
			if (statusFilter && c.status !== statusFilter) return false;
			if (typeFilter && c.type !== typeFilter) return false;
			return true;
		})
	);
	
	function toggleSelectAll() {
		if (selectedClaims.length === filteredClaims.length) {
			selectedClaims = [];
		} else {
			selectedClaims = filteredClaims.map(c => c.id);
		}
	}
	
	function toggleClaim(claimId: string) {
		if (selectedClaims.includes(claimId)) {
			selectedClaims = selectedClaims.filter(id => id !== claimId);
		} else {
			selectedClaims = [...selectedClaims, claimId];
		}
	}
	
	function handleExport() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (typeFilter) params.set('type', typeFilter);
		window.open(`/api/claims/export?${params.toString()}`, '_blank');
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">Batch Operations</h1>
			<p class="text-surface-600 mt-1">Bulk update claims, assign adjusters, and export data</p>
		</div>
		
		<button onclick={handleExport} class="btn-secondary flex items-center gap-2">
			<Download class="w-4 h-4" />
			Export to CSV
		</button>
	</div>
	
	{#if result}
		<div class="p-4 rounded-lg {result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
			<div class="flex items-start gap-3">
				{#if result.failed === 0}
					<Check class="w-5 h-5 text-green-600 mt-0.5" />
					<div>
						<p class="font-medium text-green-800">Operation completed successfully</p>
						<p class="text-sm text-green-700">{result.success} claims updated</p>
					</div>
				{:else}
					<AlertCircle class="w-5 h-5 text-yellow-600 mt-0.5" />
					<div>
						<p class="font-medium text-yellow-800">Operation completed with errors</p>
						<p class="text-sm text-yellow-700">{result.success} succeeded, {result.failed} failed</p>
						{#if result.errors && result.errors.length > 0}
							<ul class="mt-2 text-sm text-yellow-700 list-disc ml-4">
								{#each result.errors.slice(0, 5) as error}
									<li>{error.error}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
	
	<div class="grid lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2">
			<div class="card">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
					<h3 class="text-lg font-semibold text-surface-900">
						Select Claims ({selectedClaims.length} selected)
					</h3>
					
					<div class="flex gap-2">
						<select class="input w-auto text-sm" bind:value={statusFilter}>
							<option value="">All Statuses</option>
							<option value="filed">Filed</option>
							<option value="under_review">Under Review</option>
							<option value="investigation">Investigation</option>
							<option value="estimation">Estimation</option>
							<option value="pending_approval">Pending Approval</option>
						</select>
						
						<select class="input w-auto text-sm" bind:value={typeFilter}>
							<option value="">All Types</option>
							<option value="accident">Accident</option>
							<option value="theft">Theft</option>
							<option value="damage">Damage</option>
							<option value="medical">Medical</option>
							<option value="liability">Liability</option>
						</select>
					</div>
				</div>
				
				<div class="overflow-x-auto max-h-96">
					<table class="w-full">
						<thead class="bg-surface-50 border-b border-surface-200 sticky top-0">
							<tr>
								<th class="px-4 py-3 w-12">
									<input 
										type="checkbox" 
										checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
										onchange={toggleSelectAll}
										class="w-4 h-4 rounded border-surface-300"
									/>
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Claim #</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Type</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Amount</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Adjuster</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-surface-100">
							{#each filteredClaims as claim}
								<tr class="hover:bg-surface-50 {selectedClaims.includes(claim.id) ? 'bg-primary-50' : ''}">
									<td class="px-4 py-3">
										<input 
											type="checkbox" 
											checked={selectedClaims.includes(claim.id)}
											onchange={() => toggleClaim(claim.id)}
											class="w-4 h-4 rounded border-surface-300"
										/>
									</td>
									<td class="px-4 py-3 font-medium text-surface-900">{claim.claimNumber}</td>
									<td class="px-4 py-3 capitalize">{claim.type}</td>
									<td class="px-4 py-3">
										<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize bg-surface-100 text-surface-700">
											{claim.status.replace('_', ' ')}
										</span>
									</td>
									<td class="px-4 py-3">${claim.amountClaimed.toLocaleString()}</td>
									<td class="px-4 py-3 text-sm text-surface-600">
										{claim.adjuster ? `${claim.adjuster.firstName} ${claim.adjuster.lastName}` : '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
		
		<div class="space-y-4">
			<form method="POST" action="?/updateStatus" use:enhance={() => {
				isProcessing = true;
				return async ({ result: formResult }) => {
					isProcessing = false;
					if (formResult.type === 'success' && formResult.data) {
						result = formResult.data as typeof result;
						selectedClaims = [];
					}
				};
			}}>
				<div class="card">
					<h3 class="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
						<CheckSquare class="w-5 h-5" />
						Bulk Update Status
					</h3>
					
					<input type="hidden" name="claimIds" value={JSON.stringify(selectedClaims)} />
					
					<div class="space-y-4">
						<div>
							<label class="label">New Status</label>
							<select class="input" name="newStatus" bind:value={selectedStatus} required>
								<option value="">Select status...</option>
								<option value="under_review">Under Review</option>
								<option value="investigation">Investigation</option>
								<option value="estimation">Estimation</option>
								<option value="pending_approval">Pending Approval</option>
								<option value="closed">Closed</option>
							</select>
						</div>
						
						<div>
							<label class="label">Notes (optional)</label>
							<textarea class="input" name="notes" rows="2" bind:value={batchNotes} placeholder="Add batch update notes..."></textarea>
						</div>
						
						<button 
							type="submit" 
							class="btn-primary w-full" 
							disabled={selectedClaims.length === 0 || !selectedStatus || isProcessing}
						>
							{isProcessing ? 'Processing...' : `Update ${selectedClaims.length} Claims`}
						</button>
					</div>
				</div>
			</form>
			
			<form method="POST" action="?/assignClaims" use:enhance={() => {
				isProcessing = true;
				return async ({ result: formResult }) => {
					isProcessing = false;
					if (formResult.type === 'success' && formResult.data) {
						result = formResult.data as typeof result;
						selectedClaims = [];
					}
				};
			}}>
				<div class="card">
					<h3 class="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
						<Users class="w-5 h-5" />
						Bulk Assign Adjuster
					</h3>
					
					<input type="hidden" name="claimIds" value={JSON.stringify(selectedClaims)} />
					
					<div class="space-y-4">
						<div>
							<label class="label">Assign to Adjuster</label>
							<select class="input" name="adjusterId" bind:value={selectedAdjuster} required>
								<option value="">Select adjuster...</option>
								{#each data.adjusters as adj}
									<option value={adj.id}>{adj.firstName} {adj.lastName}</option>
								{/each}
							</select>
						</div>
						
						<button 
							type="submit" 
							class="btn-secondary w-full" 
							disabled={selectedClaims.length === 0 || !selectedAdjuster || isProcessing}
						>
							{isProcessing ? 'Processing...' : `Assign ${selectedClaims.length} Claims`}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>

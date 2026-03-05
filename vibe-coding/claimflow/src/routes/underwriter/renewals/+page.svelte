<script lang="ts">
	import { enhance } from '$app/forms';
	import { FileText, Calendar, DollarSign, AlertCircle, Check, X } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	let selectedRenewal = $state<string | null>(null);
	let reviewNotes = $state('');
	let adjustedPremium = $state<number | null>(null);
	let isSubmitting = $state(false);
	
	function selectRenewal(renewalId: string, currentPremium: number) {
		selectedRenewal = renewalId;
		adjustedPremium = currentPremium;
		reviewNotes = '';
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Policy Renewals</h1>
		<p class="text-surface-600 mt-1">Review and approve policy renewals</p>
	</div>
	
	{#if data.renewals.length === 0}
		<div class="card text-center py-12">
			<Check class="w-12 h-12 text-green-300 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-surface-900">All Caught Up</h3>
			<p class="text-surface-500 mt-1">No policy renewals require your review.</p>
		</div>
	{:else}
		<div class="grid lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-4">
				{#each data.renewals as renewal}
					{@const policy = renewal.policy}
					{@const hasRecentClaims = data.claimsPerPolicy[policy?.id || ''] > 0}
					
					<div 
						class="card cursor-pointer transition-all {selectedRenewal === renewal.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}"
						onclick={() => selectRenewal(renewal.id, renewal.newPremium || 0)}
					>
						<div class="flex items-start justify-between">
							<div>
								<div class="flex items-center gap-2">
									<h3 class="font-semibold text-surface-900">{policy?.policyNumber}</h3>
									{#if hasRecentClaims}
										<span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
											{data.claimsPerPolicy[policy?.id || '']} Recent Claims
										</span>
									{/if}
								</div>
								<p class="text-sm text-surface-500 mt-1">
									{policy?.user?.firstName} {policy?.user?.lastName}
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-surface-500">Expires</p>
								<p class="font-medium text-surface-900">{format(new Date(renewal.expiryDate), 'MMM d, yyyy')}</p>
							</div>
						</div>
						
						<div class="mt-4 grid grid-cols-3 gap-4 text-sm">
							<div>
								<p class="text-surface-500">Policy Type</p>
								<p class="font-medium text-surface-900 capitalize">{policy?.type}</p>
							</div>
							<div>
								<p class="text-surface-500">Coverage</p>
								<p class="font-medium text-surface-900">${policy?.coverageAmount.toLocaleString()}</p>
							</div>
							<div>
								<p class="text-surface-500">New Premium</p>
								<p class="font-medium text-surface-900">${(renewal.newPremium || 0).toLocaleString()}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
			
			<div>
				{#if selectedRenewal}
					{@const renewal = data.renewals.find(r => r.id === selectedRenewal)}
					{@const policy = renewal?.policy}
					
					<div class="card sticky top-4">
						<h3 class="text-lg font-semibold text-surface-900 mb-4">Review Renewal</h3>
						
						<div class="space-y-4 text-sm mb-6">
							<div class="flex justify-between">
								<span class="text-surface-500">Current Premium</span>
								<span class="font-medium">${policy?.premium.toLocaleString()}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-surface-500">Suggested Premium</span>
								<span class="font-medium">${(renewal?.newPremium || 0).toLocaleString()}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-surface-500">Risk Score</span>
								<span class="font-medium">{policy?.riskScore || 'N/A'}</span>
							</div>
						</div>
						
						<form method="POST" action="?/review" use:enhance={() => {
							isSubmitting = true;
							return async () => {
								isSubmitting = false;
								selectedRenewal = null;
							};
						}}>
							<input type="hidden" name="renewalId" value={selectedRenewal} />
							
							<div class="space-y-4">
								<div>
									<label class="label">Adjusted Premium (optional)</label>
									<input type="number" class="input" name="adjustedPremium" bind:value={adjustedPremium} min="0" step="0.01" />
								</div>
								
								<div>
									<label class="label">Review Notes</label>
									<textarea class="input" name="notes" rows="3" bind:value={reviewNotes} placeholder="Add notes for this renewal..."></textarea>
								</div>
								
								<div class="grid grid-cols-2 gap-3">
									<button 
										type="submit" 
										name="approved" 
										value="true"
										class="btn-primary flex items-center justify-center gap-2"
										disabled={isSubmitting}
									>
										<Check class="w-4 h-4" />
										Approve
									</button>
									<button 
										type="submit" 
										name="approved" 
										value="false"
										class="btn-secondary flex items-center justify-center gap-2 text-red-600"
										disabled={isSubmitting}
									>
										<X class="w-4 h-4" />
										Deny
									</button>
								</div>
							</div>
						</form>
					</div>
				{:else}
					<div class="card bg-surface-50 text-center py-8">
						<FileText class="w-10 h-10 text-surface-300 mx-auto mb-3" />
						<p class="text-surface-500">Select a renewal to review</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

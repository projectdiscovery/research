<script lang="ts">
	import { enhance } from '$app/forms';
	import { FileText, Calendar, DollarSign, Check, X, Clock, AlertCircle } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	let isSubmitting = $state(false);
	
	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-700',
		sent: 'bg-blue-100 text-blue-700',
		accepted: 'bg-green-100 text-green-700',
		rejected: 'bg-red-100 text-red-700',
		expired: 'bg-surface-100 text-surface-700'
	};
	
	const premiumDiff = data.renewal 
		? ((data.renewal.newPremium || 0) - data.policy.premium) 
		: 0;
	
	const premiumChangePercent = data.renewal 
		? (((data.renewal.newPremium || 0) - data.policy.premium) / data.policy.premium * 100).toFixed(1)
		: '0';
</script>

<div class="max-w-3xl mx-auto space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Policy Renewal</h1>
		<p class="text-surface-600 mt-1">Policy #{data.policy.policyNumber}</p>
	</div>
	
	{#if !data.renewal}
		<div class="card text-center py-12">
			<Calendar class="w-12 h-12 text-surface-300 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No Renewal Notice</h3>
			<p class="text-surface-500 mt-1">Your policy renewal notice will be sent 30 days before expiration.</p>
			<p class="text-sm text-surface-400 mt-4">
				Policy expires: {format(new Date(data.policy.endDate), 'MMMM d, yyyy')}
			</p>
		</div>
	{:else}
		<div class="card">
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-semibold text-surface-900">Renewal Details</h3>
				<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize {statusColors[data.renewal.status]}">
					{data.renewal.status}
				</span>
			</div>
			
			<div class="grid sm:grid-cols-2 gap-6">
				<div class="space-y-4">
					<div>
						<p class="text-sm text-surface-500">Current Premium</p>
						<p class="text-xl font-semibold text-surface-900">
							${data.policy.premium.toLocaleString()}/{data.policy.premiumFrequency}
						</p>
					</div>
					
					<div>
						<p class="text-sm text-surface-500">Policy Expires</p>
						<p class="text-xl font-semibold text-surface-900">
							{format(new Date(data.renewal.expiryDate), 'MMMM d, yyyy')}
						</p>
					</div>
					
					<div>
						<p class="text-sm text-surface-500">Coverage Amount</p>
						<p class="text-xl font-semibold text-surface-900">
							${data.policy.coverageAmount.toLocaleString()}
						</p>
					</div>
				</div>
				
				<div class="p-4 bg-surface-50 rounded-lg space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-surface-700">New Premium</span>
						<span class="text-xl font-bold text-surface-900">${(data.renewal.newPremium || 0).toLocaleString()}</span>
					</div>
					
					<div class="flex items-center justify-between">
						<span class="text-surface-700">Change</span>
						<span class="{premiumDiff >= 0 ? 'text-red-600' : 'text-green-600'} font-medium">
							{premiumDiff >= 0 ? '+' : ''}${premiumDiff.toFixed(2)} ({premiumChangePercent}%)
						</span>
					</div>
					
					<div class="flex items-center justify-between">
						<span class="text-surface-700">New Coverage</span>
						<span class="font-medium text-surface-900">${(data.renewal.newCoverageAmount || 0).toLocaleString()}</span>
					</div>
					
					<div class="flex items-center justify-between">
						<span class="text-surface-700">New End Date</span>
						<span class="font-medium text-surface-900">{format(new Date(data.renewal.renewalDate), 'MMM d, yyyy')}</span>
					</div>
				</div>
			</div>
			
			{#if data.renewal.reviewNotes}
				<div class="mt-6 p-4 bg-blue-50 rounded-lg">
					<h4 class="font-medium text-blue-900 mb-1">Underwriter Notes</h4>
					<p class="text-sm text-blue-700">{data.renewal.reviewNotes}</p>
				</div>
			{/if}
			
			{#if data.renewal.status === 'sent'}
				<div class="mt-6 pt-6 border-t border-surface-200">
					<h4 class="font-medium text-surface-900 mb-4">Respond to Renewal Offer</h4>
					
					<div class="grid sm:grid-cols-2 gap-4">
						<form method="POST" action="?/respond" use:enhance={() => {
							isSubmitting = true;
							return async () => { isSubmitting = false; };
						}}>
							<input type="hidden" name="accepted" value="true" />
							<button type="submit" class="btn-primary w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
								<Check class="w-5 h-5" />
								Accept Renewal
							</button>
						</form>
						
						<form method="POST" action="?/respond" use:enhance={() => {
							isSubmitting = true;
							return async () => { isSubmitting = false; };
						}}>
							<input type="hidden" name="accepted" value="false" />
							<button type="submit" class="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50" disabled={isSubmitting}>
								<X class="w-5 h-5" />
								Decline Renewal
							</button>
						</form>
					</div>
					
					<p class="text-xs text-surface-400 text-center mt-4">
						By accepting, you agree to the new premium and coverage terms.
					</p>
				</div>
			{:else if data.renewal.status === 'accepted'}
				<div class="mt-6 p-4 bg-green-50 rounded-lg flex items-start gap-3">
					<Check class="w-5 h-5 text-green-600 mt-0.5" />
					<div>
						<h4 class="font-medium text-green-900">Renewal Accepted</h4>
						<p class="text-sm text-green-700 mt-1">
							Your policy has been renewed. The new terms will take effect on {format(new Date(data.renewal.renewalDate), 'MMMM d, yyyy')}.
						</p>
						{#if data.renewal.respondedAt}
							<p class="text-xs text-green-600 mt-2">
								Accepted on {format(new Date(data.renewal.respondedAt), 'MMM d, yyyy')}
							</p>
						{/if}
					</div>
				</div>
			{:else if data.renewal.status === 'rejected'}
				<div class="mt-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
					<X class="w-5 h-5 text-red-600 mt-0.5" />
					<div>
						<h4 class="font-medium text-red-900">Renewal Declined</h4>
						<p class="text-sm text-red-700 mt-1">
							You have declined the renewal offer. Your coverage will end on {format(new Date(data.renewal.expiryDate), 'MMMM d, yyyy')}.
						</p>
						<p class="text-xs text-red-600 mt-2">
							Contact your agent if you would like to discuss alternative options.
						</p>
					</div>
				</div>
			{:else if data.renewal.status === 'pending'}
				<div class="mt-6 p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
					<Clock class="w-5 h-5 text-yellow-600 mt-0.5" />
					<div>
						<h4 class="font-medium text-yellow-900">Under Review</h4>
						<p class="text-sm text-yellow-700 mt-1">
							Your renewal is being reviewed by our underwriting team. You will be notified once a decision is made.
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
	
	<div class="flex justify-center">
		<a href="/policies/{data.policy.id}" class="btn-secondary">Back to Policy</a>
	</div>
</div>

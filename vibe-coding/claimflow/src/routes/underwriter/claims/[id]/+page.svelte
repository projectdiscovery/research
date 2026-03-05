<script lang="ts">
	import { ArrowLeft, User, Calendar, MapPin, DollarSign, FileText, MessageSquare, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-svelte';
	import { format } from 'date-fns';
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	
	let decision = $state('');
	let approvedAmount = $state(data.claim.amountRecommended?.toString() || data.claim.amountClaimed.toString());
	let notes = $state('');
	let loading = $state(false);
</script>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/underwriter/claims" class="p-2 hover:bg-surface-100 rounded-lg transition-colors">
			<ArrowLeft class="w-5 h-5 text-surface-600" />
		</a>
		<div class="flex-1">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold text-surface-900">{data.claim.claimNumber}</h1>
				<span class="badge bg-purple-100 text-purple-700">Pending Underwriter Review</span>
			</div>
			<p class="text-surface-600 mt-0.5">{data.claim.policy?.type} Insurance • High-Value Claim</p>
		</div>
	</div>
	
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
			{form.error}
		</div>
	{/if}
	
	<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
		<div class="flex items-start gap-3">
			<AlertTriangle class="w-5 h-5 text-yellow-600 mt-0.5" />
			<div>
				<p class="font-medium text-yellow-800">High-Value Claim Requires Your Approval</p>
				<p class="text-yellow-700 text-sm mt-1">
					This claim exceeds $50,000 and requires underwriter review before it can be approved or denied.
				</p>
			</div>
		</div>
	</div>
	
	<div class="grid lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Claim Summary</h3>
				
				<div class="grid sm:grid-cols-3 gap-4 mb-6">
					<div class="text-center p-4 bg-surface-50 rounded-lg">
						<p class="text-sm text-surface-500">Amount Claimed</p>
						<p class="text-2xl font-bold text-surface-900">${data.claim.amountClaimed.toLocaleString()}</p>
					</div>
					<div class="text-center p-4 bg-primary-50 rounded-lg">
						<p class="text-sm text-primary-600">Adjuster Recommended</p>
						<p class="text-2xl font-bold text-primary-700">
							{data.claim.amountRecommended ? `$${data.claim.amountRecommended.toLocaleString()}` : '—'}
						</p>
					</div>
					<div class="text-center p-4 bg-surface-50 rounded-lg">
						<p class="text-sm text-surface-500">Policy Coverage</p>
						<p class="text-2xl font-bold text-surface-900">${data.claim.policy?.coverageAmount.toLocaleString()}</p>
					</div>
				</div>
				
				<div class="space-y-4">
					<div>
						<h4 class="text-sm font-medium text-surface-500 mb-1">Incident Description</h4>
						<p class="text-surface-900">{data.claim.description}</p>
					</div>
					
					<div class="grid sm:grid-cols-2 gap-4">
						<div class="flex items-start gap-3">
							<Calendar class="w-5 h-5 text-surface-400 mt-0.5" />
							<div>
								<p class="text-sm text-surface-500">Incident Date</p>
								<p class="font-medium text-surface-900">{format(new Date(data.claim.incidentDate), 'MMMM d, yyyy')}</p>
							</div>
						</div>
						{#if data.claim.incidentLocation}
							<div class="flex items-start gap-3">
								<MapPin class="w-5 h-5 text-surface-400 mt-0.5" />
								<div>
									<p class="text-sm text-surface-500">Location</p>
									<p class="font-medium text-surface-900">{data.claim.incidentLocation}</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Adjuster Notes</h3>
				
				{#if data.notes.length === 0}
					<p class="text-surface-500 text-center py-4">No notes available</p>
				{:else}
					<div class="space-y-3">
						{#each data.notes as note}
							<div class="p-3 bg-surface-50 rounded-lg">
								<div class="flex items-center justify-between mb-1">
									<span class="text-sm font-medium text-surface-900">{note.user?.firstName} {note.user?.lastName}</span>
									<span class="text-xs text-surface-500">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
								</div>
								<span class="badge badge-neutral text-xs mb-2">{note.noteType.replace('_', ' ')}</span>
								<p class="text-surface-700 text-sm">{note.content}</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Documents ({data.documents.length})</h3>
				
				{#if data.documents.length === 0}
					<p class="text-surface-500 text-center py-4">No documents available</p>
				{:else}
					<div class="space-y-2">
						{#each data.documents as doc}
							<div class="flex items-center gap-3 p-3 rounded-lg border border-surface-200">
								<FileText class="w-5 h-5 text-surface-400" />
								<div class="flex-1 min-w-0">
									<p class="font-medium text-surface-900 truncate">{doc.originalName}</p>
									<p class="text-sm text-surface-500">{doc.documentType} • {(doc.fileSize / 1024).toFixed(0)} KB</p>
								</div>
								{#if doc.isVerified}
									<span class="badge badge-success">Verified</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		
		<div class="space-y-6">
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Claimant</h3>
				<div class="flex items-center gap-3 mb-4">
					<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
						<User class="w-6 h-6 text-primary-600" />
					</div>
					<div>
						<p class="font-medium text-surface-900">{data.claim.user?.firstName} {data.claim.user?.lastName}</p>
						<p class="text-sm text-surface-500">{data.claim.user?.email}</p>
					</div>
				</div>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Policy Risk Assessment</h3>
				<div class="space-y-3">
					<div class="flex justify-between">
						<span class="text-surface-500">Policy Type</span>
						<span class="font-medium capitalize">{data.claim.policy?.type}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Coverage Amount</span>
						<span class="font-medium">${data.claim.policy?.coverageAmount.toLocaleString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Deductible</span>
						<span class="font-medium">${data.claim.policy?.deductible.toLocaleString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Risk Score</span>
						<span class="font-medium {(data.claim.policy?.riskScore || 0) > 50 ? 'text-red-600' : (data.claim.policy?.riskScore || 0) > 30 ? 'text-yellow-600' : 'text-green-600'}">
							{data.claim.policy?.riskScore || 'N/A'}/100
						</span>
					</div>
				</div>
			</div>
			
			<div class="card border-2 border-primary-200 bg-primary-50">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Your Decision</h3>
				
				<form method="POST" action="?/makeDecision" class="space-y-4" use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}>
					<div>
						<label class="label">Decision</label>
						<select name="decision" class="input" bind:value={decision} required>
							<option value="">Select decision...</option>
							<option value="approved">Approve Claim</option>
							<option value="denied">Deny Claim</option>
							<option value="modified">Approve with Modified Amount</option>
							<option value="review">Send Back for Review</option>
						</select>
					</div>
					
					{#if decision === 'approved' || decision === 'modified'}
						<div>
							<label class="label">Approved Amount</label>
							<div class="relative">
								<span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">$</span>
								<input
									type="number"
									name="approvedAmount"
									class="input pl-7"
									step="0.01"
									bind:value={approvedAmount}
									required
								/>
							</div>
						</div>
					{/if}
					
					<div>
						<label class="label">Notes</label>
						<textarea
							name="notes"
							class="input resize-none"
							rows="3"
							placeholder="Provide reasoning for your decision..."
							bind:value={notes}
							required
						></textarea>
					</div>
					
					<button 
						type="submit" 
						class="w-full {decision === 'denied' ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'} text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
						disabled={loading || !decision}
					>
						{loading ? 'Submitting...' : decision === 'denied' ? 'Deny Claim' : decision === 'approved' || decision === 'modified' ? 'Approve Claim' : 'Submit Decision'}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>

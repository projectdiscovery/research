<script lang="ts">
	import { ArrowLeft, User, Calendar, MapPin, DollarSign, FileText, MessageSquare, Plus, Send, CheckCircle, XCircle, Clock, AlertTriangle, Calculator } from 'lucide-svelte';
	import { format } from 'date-fns';
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	
	let newNote = $state('');
	let noteType = $state('investigation');
	let newStatus = $state(data.claim.status);
	let recommendedAmount = $state(data.claim.amountRecommended?.toString() || '');
	let denialReason = $state(data.claim.denialReason || '');
	let showStatusModal = $state(false);
	let loading = $state(false);

	const statusColors: Record<string, string> = {
		draft: 'bg-surface-100 text-surface-700',
		filed: 'bg-blue-100 text-blue-700',
		under_review: 'bg-yellow-100 text-yellow-700',
		investigation: 'bg-orange-100 text-orange-700',
		estimation: 'bg-purple-100 text-purple-700',
		pending_approval: 'bg-indigo-100 text-indigo-700',
		approved: 'bg-green-100 text-green-700',
		denied: 'bg-red-100 text-red-700',
		payment_pending: 'bg-teal-100 text-teal-700',
		paid: 'bg-green-100 text-green-700',
		closed: 'bg-surface-100 text-surface-700',
		reopened: 'bg-amber-100 text-amber-700'
	};

	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		filed: 'Filed',
		under_review: 'Under Review',
		investigation: 'Investigation',
		estimation: 'Estimation',
		pending_approval: 'Pending Approval',
		approved: 'Approved',
		denied: 'Denied',
		payment_pending: 'Payment Pending',
		paid: 'Paid',
		closed: 'Closed',
		reopened: 'Reopened'
	};

	const availableTransitions = data.availableTransitions;
</script>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/adjuster/claims" class="p-2 hover:bg-surface-100 rounded-lg transition-colors">
			<ArrowLeft class="w-5 h-5 text-surface-600" />
		</a>
		<div class="flex-1">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold text-surface-900">{data.claim.claimNumber}</h1>
				<span class="px-3 py-1 rounded-full text-sm font-medium {statusColors[data.claim.status]}">
					{statusLabels[data.claim.status]}
				</span>
				<span class="badge {data.claim.priority === 'urgent' ? 'bg-red-100 text-red-700' : data.claim.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-surface-100 text-surface-700'}">
					{data.claim.priority} priority
				</span>
			</div>
			<p class="text-surface-600 mt-0.5">{data.claim.policy?.type} Insurance • {data.claim.type}</p>
		</div>
		<div class="flex gap-2">
			<a href="/adjuster/claims/{data.claim.id}/settlement" class="btn-secondary flex items-center gap-2">
				<Calculator class="w-4 h-4" />
				Settlement
			</a>
			{#if availableTransitions.length > 0}
				<button class="btn-primary" onclick={() => showStatusModal = true}>
					Update Status
				</button>
			{/if}
		</div>
	</div>
	
	<div class="grid lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Claim Details</h3>
				<div class="space-y-4">
					<div>
						<h4 class="text-sm font-medium text-surface-500 mb-1">Description</h4>
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
					
					<div class="grid sm:grid-cols-3 gap-4 pt-4 border-t border-surface-200">
						<div>
							<p class="text-sm text-surface-500">Amount Claimed</p>
							<p class="text-xl font-bold text-surface-900">${data.claim.amountClaimed.toLocaleString()}</p>
						</div>
						<div>
							<p class="text-sm text-surface-500">Recommended</p>
							<p class="text-xl font-bold text-primary-600">
								{data.claim.amountRecommended ? `$${data.claim.amountRecommended.toLocaleString()}` : '—'}
							</p>
						</div>
						<div>
							<p class="text-sm text-surface-500">Approved</p>
							<p class="text-xl font-bold text-green-600">
								{data.claim.amountApproved !== null ? `$${data.claim.amountApproved.toLocaleString()}` : '—'}
							</p>
						</div>
					</div>

					{#if data.claim.requiresUnderwriterReview}
						<div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
							<div class="flex items-center gap-2">
								<AlertTriangle class="w-5 h-5 text-purple-600" />
								<p class="font-medium text-purple-800">High-Value Claim - Requires Underwriter Review</p>
							</div>
							<p class="text-purple-700 text-sm mt-1">Claims over $50,000 must be approved by an underwriter before payout.</p>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-surface-900">Documents ({data.documents.length})</h3>
					<form method="POST" action="?/requestDocuments" use:enhance>
						<button type="submit" class="btn-secondary text-sm">Request Documents</button>
					</form>
				</div>
				
				{#if data.documents.length === 0}
					<div class="text-center py-6 text-surface-500">
						<FileText class="w-10 h-10 mx-auto mb-2 text-surface-300" />
						<p>No documents uploaded yet</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each data.documents as doc}
							<div class="flex items-center gap-3 p-3 rounded-lg border border-surface-200">
								<FileText class="w-5 h-5 text-surface-400" />
								<div class="flex-1 min-w-0">
									<p class="font-medium text-surface-900 truncate">{doc.originalName}</p>
									<p class="text-sm text-surface-500">{doc.documentType} • {(doc.fileSize / 1024).toFixed(0)} KB</p>
								</div>
								<div class="flex items-center gap-2">
									{#if doc.isVerified}
										<span class="badge badge-success">Verified</span>
									{:else}
										<form method="POST" action="?/verifyDocument" use:enhance>
											<input type="hidden" name="documentId" value={doc.id} />
											<button type="submit" class="btn-secondary text-sm py-1">Verify</button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Investigation Notes</h3>
				
				<form method="POST" action="?/addNote" class="mb-4" use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						newNote = '';
						await update();
					};
				}}>
					<div class="flex gap-2 mb-2">
						<select name="noteType" class="input w-auto" bind:value={noteType}>
							<option value="investigation">Investigation</option>
							<option value="internal">Internal Note</option>
							<option value="customer_contact">Customer Contact</option>
							<option value="document_request">Document Request</option>
							<option value="payout">Payout Note</option>
						</select>
					</div>
					<div class="flex gap-2">
						<textarea
							name="content"
							rows="2"
							class="input flex-1 resize-none"
							placeholder="Add a note..."
							bind:value={newNote}
							required
						></textarea>
						<button type="submit" class="btn-primary px-4" disabled={loading || !newNote.trim()}>
							<Plus class="w-5 h-5" />
						</button>
					</div>
				</form>
				
				{#if data.notes.length === 0}
					<p class="text-surface-500 text-center py-4">No notes yet</p>
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
				{#if data.claim.user?.phone}
					<p class="text-sm text-surface-600">Phone: {data.claim.user.phone}</p>
				{/if}
				{#if data.claim.user?.address}
					<p class="text-sm text-surface-600 mt-1">
						{data.claim.user.address}, {data.claim.user.city}, {data.claim.user.state} {data.claim.user.zipCode}
					</p>
				{/if}
				<a href="/messages?claim={data.claim.id}" class="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
					<MessageSquare class="w-4 h-4" />
					Send Message
				</a>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Policy Info</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-surface-500">Policy Number</span>
						<span class="font-medium">{data.claim.policy?.policyNumber}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Type</span>
						<span class="font-medium capitalize">{data.claim.policy?.type}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Coverage</span>
						<span class="font-medium">${data.claim.policy?.coverageAmount.toLocaleString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Deductible</span>
						<span class="font-medium">${data.claim.policy?.deductible.toLocaleString()}</span>
					</div>
				</div>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Recommend Payout</h3>
				<form method="POST" action="?/recommendPayout" use:enhance>
					<div class="mb-3">
						<label for="amount" class="label">Recommended Amount</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">$</span>
							<input
								type="number"
								id="amount"
								name="amount"
								class="input pl-7"
								placeholder="0.00"
								step="0.01"
								bind:value={recommendedAmount}
							/>
						</div>
					</div>
					<button type="submit" class="btn-primary w-full">Save Recommendation</button>
				</form>
			</div>
		</div>
	</div>
</div>

{#if showStatusModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Update Claim Status</h3>
			
			<form method="POST" action="?/updateStatus" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					showStatusModal = false;
					await update();
				};
			}}>
				<div class="space-y-4">
					<div>
						<label class="label">New Status</label>
						<select name="status" class="input" bind:value={newStatus} required>
							{#each availableTransitions as status}
								<option value={status}>{statusLabels[status]}</option>
							{/each}
						</select>
					</div>
					
					{#if newStatus === 'denied'}
						<div>
							<label class="label">Denial Reason</label>
							<textarea
								name="denialReason"
								class="input resize-none"
								rows="3"
								placeholder="Explain why this claim is being denied..."
								bind:value={denialReason}
								required
							></textarea>
						</div>
					{/if}
					
					{#if newStatus === 'approved'}
						<div>
							<label class="label">Approved Amount</label>
							<div class="relative">
								<span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">$</span>
								<input
									type="number"
									name="approvedAmount"
									class="input pl-7"
									step="0.01"
									value={data.claim.amountRecommended || data.claim.amountClaimed}
									required
								/>
							</div>
						</div>
					{/if}
					
					<div class="flex gap-3 pt-2">
						<button type="button" class="btn-secondary flex-1" onclick={() => showStatusModal = false}>
							Cancel
						</button>
						<button type="submit" class="btn-primary flex-1" disabled={loading}>
							{loading ? 'Updating...' : 'Update Status'}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

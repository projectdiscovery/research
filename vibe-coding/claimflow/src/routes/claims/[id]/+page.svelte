<script lang="ts">
	import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, Calendar, MapPin, DollarSign, MessageSquare, Upload, Download, User, AlertTriangle, Plus } from 'lucide-svelte';
	import { format } from 'date-fns';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	
	let { data } = $props();
	
	let showUploadModal = $state(false);
	let uploadFiles = $state<FileList | null>(null);
	let documentType = $state('photo');
	let description = $state('');
	let uploading = $state(false);
	let uploadError = $state('');
	
	const statusColors: Record<string, string> = {
		draft: 'bg-surface-100 text-surface-700',
		submitted: 'bg-blue-100 text-blue-700',
		under_review: 'bg-yellow-100 text-yellow-700',
		needs_info: 'bg-orange-100 text-orange-700',
		pending_underwriter: 'bg-purple-100 text-purple-700',
		approved: 'bg-green-100 text-green-700',
		denied: 'bg-red-100 text-red-700',
		paid: 'bg-green-100 text-green-700',
		closed: 'bg-surface-100 text-surface-700'
	};
	
	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		submitted: 'Submitted',
		under_review: 'Under Review',
		needs_info: 'Additional Info Needed',
		pending_underwriter: 'Under Final Review',
		approved: 'Approved',
		denied: 'Denied',
		paid: 'Paid',
		closed: 'Closed'
	};

	async function handleUpload() {
		if (!uploadFiles || uploadFiles.length === 0) return;
		
		uploading = true;
		uploadError = '';
		
		const formData = new FormData();
		for (let i = 0; i < uploadFiles.length; i++) {
			formData.append('files', uploadFiles[i]);
		}
		formData.append('claimId', data.claim.id);
		formData.append('documentType', documentType);
		if (description) formData.append('description', description);
		
		try {
			const response = await fetch('/api/documents', {
				method: 'POST',
				body: formData
			});
			
			const result = await response.json();
			
			if (!response.ok) {
				uploadError = result.message || 'Upload failed';
				return;
			}
			
			showUploadModal = false;
			uploadFiles = null;
			description = '';
			await invalidateAll();
		} catch (e) {
			uploadError = 'Upload failed. Please try again.';
		} finally {
			uploading = false;
		}
	}
	
	const typeLabels: Record<string, string> = {
		accident: 'Accident',
		theft: 'Theft',
		damage: 'Property Damage',
		medical: 'Medical',
		liability: 'Liability',
		other: 'Other'
	};
	
	const steps = [
		{ status: 'submitted', label: 'Submitted' },
		{ status: 'under_review', label: 'Under Review' },
		{ status: 'approved', label: 'Decision' },
		{ status: 'paid', label: 'Payment' }
	];
	
	function getStepStatus(stepStatus: string, claimStatus: string) {
		const statusOrder = ['draft', 'submitted', 'under_review', 'approved', 'paid', 'closed'];
		const stepIndex = statusOrder.indexOf(stepStatus);
		const currentIndex = statusOrder.indexOf(claimStatus);
		
		if (claimStatus === 'denied' && stepStatus === 'approved') return 'denied';
		if (currentIndex >= stepIndex) return 'completed';
		if (currentIndex === stepIndex - 1) return 'current';
		return 'pending';
	}
</script>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/claims" class="p-2 hover:bg-surface-100 rounded-lg transition-colors">
			<ArrowLeft class="w-5 h-5 text-surface-600" />
		</a>
		<div class="flex-1">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold text-surface-900">{data.claim.claimNumber}</h1>
				<span class="px-3 py-1 rounded-full text-sm font-medium {statusColors[data.claim.status]}">
					{statusLabels[data.claim.status]}
				</span>
			</div>
			<p class="text-surface-600 mt-0.5">{typeLabels[data.claim.type]} Claim • {data.claim.policy?.policyNumber}</p>
		</div>
	</div>
	
	{#if data.claim.status !== 'draft'}
		<div class="card">
			<h3 class="text-sm font-medium text-surface-700 mb-4">Claim Progress</h3>
			<div class="flex items-center">
				{#each steps as step, i}
					{@const stepStatus = getStepStatus(step.status, data.claim.status)}
					<div class="flex-1 flex items-center">
						<div class="flex flex-col items-center">
							<div class="w-10 h-10 rounded-full flex items-center justify-center {
								stepStatus === 'completed' ? 'bg-primary-600 text-white' :
								stepStatus === 'denied' ? 'bg-red-600 text-white' :
								stepStatus === 'current' ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' :
								'bg-surface-100 text-surface-400'
							}">
								{#if stepStatus === 'completed'}
									<CheckCircle class="w-5 h-5" />
								{:else if stepStatus === 'denied'}
									<XCircle class="w-5 h-5" />
								{:else}
									<span class="text-sm font-medium">{i + 1}</span>
								{/if}
							</div>
							<span class="text-xs mt-2 text-surface-600">{step.label}</span>
						</div>
						{#if i < steps.length - 1}
							<div class="flex-1 h-1 mx-2 {
								getStepStatus(steps[i + 1].status, data.claim.status) === 'completed' || 
								getStepStatus(step.status, data.claim.status) === 'completed' ? 'bg-primary-600' : 'bg-surface-200'
							}"></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
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
					
					<div class="grid sm:grid-cols-2 gap-4 pt-4 border-t border-surface-200">
						<div class="flex items-start gap-3">
							<DollarSign class="w-5 h-5 text-surface-400 mt-0.5" />
							<div>
								<p class="text-sm text-surface-500">Amount Claimed</p>
								<p class="font-medium text-surface-900">${data.claim.amountClaimed.toLocaleString()}</p>
							</div>
						</div>
						{#if data.claim.amountApproved !== null && data.claim.amountApproved !== undefined}
							<div class="flex items-start gap-3">
								<CheckCircle class="w-5 h-5 text-green-500 mt-0.5" />
								<div>
									<p class="text-sm text-surface-500">Amount Approved</p>
									<p class="font-medium text-green-600">${data.claim.amountApproved.toLocaleString()}</p>
								</div>
							</div>
						{/if}
					</div>
					
					{#if data.claim.denialReason}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
							<div class="flex items-start gap-3">
								<XCircle class="w-5 h-5 text-red-500 mt-0.5" />
								<div>
									<p class="text-sm font-medium text-red-800">Denial Reason</p>
									<p class="text-red-700 mt-1">{data.claim.denialReason}</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-surface-900">Documents</h3>
					<button 
						class="btn-secondary text-sm flex items-center gap-2"
						onclick={() => showUploadModal = true}
					>
						<Upload class="w-4 h-4" />
						Upload
					</button>
				</div>
				
				{#if data.documents.length === 0}
					<div class="text-center py-8 text-surface-500">
						<FileText class="w-12 h-12 mx-auto mb-3 text-surface-300" />
						<p>No documents uploaded</p>
						<p class="text-sm mt-1">Upload photos, receipts, or reports</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each data.documents as doc}
							<div class="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors">
								<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
									<FileText class="w-5 h-5 text-surface-600" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="font-medium text-surface-900 truncate">{doc.fileName}</p>
									<p class="text-sm text-surface-500">{doc.documentType} • {(doc.fileSize / 1024).toFixed(0)} KB</p>
								</div>
								<button class="p-2 hover:bg-surface-100 rounded-lg transition-colors">
									<Download class="w-5 h-5 text-surface-600" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-surface-900">Messages</h3>
					<a href="/messages?claim={data.claim.id}" class="text-primary-600 hover:text-primary-700 text-sm font-medium">View All</a>
				</div>
				
				{#if data.communications.length === 0}
					<div class="text-center py-8 text-surface-500">
						<MessageSquare class="w-12 h-12 mx-auto mb-3 text-surface-300" />
						<p>No messages yet</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.communications.slice(0, 3) as message}
							<div class="flex gap-3">
								<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
									<User class="w-4 h-4 text-primary-600" />
								</div>
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<span class="font-medium text-surface-900">
											{message.senderId === data.user.id ? 'You' : message.sender?.firstName + ' ' + message.sender?.lastName}
										</span>
										<span class="text-xs text-surface-500">{format(new Date(message.createdAt), 'MMM d, h:mm a')}</span>
									</div>
									{#if message.subject}
										<p class="text-sm font-medium text-surface-700 mt-0.5">{message.subject}</p>
									{/if}
									<p class="text-surface-600 mt-1 line-clamp-2">{message.message}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		
		<div class="space-y-6">
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Timeline</h3>
				<div class="space-y-4">
					{#if data.claim.resolvedAt}
						<div class="flex gap-3">
							<div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
							<div>
								<p class="text-sm font-medium text-surface-900">Resolved</p>
								<p class="text-xs text-surface-500">{format(new Date(data.claim.resolvedAt), 'MMM d, yyyy h:mm a')}</p>
							</div>
						</div>
					{/if}
					{#if data.claim.reviewedAt}
						<div class="flex gap-3">
							<div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
							<div>
								<p class="text-sm font-medium text-surface-900">Reviewed</p>
								<p class="text-xs text-surface-500">{format(new Date(data.claim.reviewedAt), 'MMM d, yyyy h:mm a')}</p>
							</div>
						</div>
					{/if}
					{#if data.claim.submittedAt}
						<div class="flex gap-3">
							<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
							<div>
								<p class="text-sm font-medium text-surface-900">Submitted</p>
								<p class="text-xs text-surface-500">{format(new Date(data.claim.submittedAt), 'MMM d, yyyy h:mm a')}</p>
							</div>
						</div>
					{/if}
					<div class="flex gap-3">
						<div class="w-2 h-2 bg-surface-400 rounded-full mt-2"></div>
						<div>
							<p class="text-sm font-medium text-surface-900">Created</p>
							<p class="text-xs text-surface-500">{format(new Date(data.claim.createdAt), 'MMM d, yyyy h:mm a')}</p>
						</div>
					</div>
				</div>
			</div>
			
			{#if data.claim.adjuster}
				<div class="card">
					<h3 class="text-lg font-semibold text-surface-900 mb-4">Assigned Adjuster</h3>
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
							<User class="w-6 h-6 text-primary-600" />
						</div>
						<div>
							<p class="font-medium text-surface-900">{data.claim.adjuster.firstName} {data.claim.adjuster.lastName}</p>
							<p class="text-sm text-surface-500">{data.claim.adjuster.email}</p>
						</div>
					</div>
					<a href="/messages?claim={data.claim.id}" class="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
						<MessageSquare class="w-4 h-4" />
						Send Message
					</a>
				</div>
			{/if}
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Related Policy</h3>
				<a href="/policies/{data.claim.policy?.id}" class="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors">
					<div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
						<FileText class="w-5 h-5 text-primary-600" />
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-surface-900">{data.claim.policy?.policyNumber}</p>
						<p class="text-sm text-surface-500 capitalize">{data.claim.policy?.type} Insurance</p>
					</div>
				</a>
			</div>
		</div>
	</div>
</div>

{#if showUploadModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Upload Documents</h3>
			
			{#if uploadError}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
					{uploadError}
				</div>
			{/if}
			
			<div class="space-y-4">
				<div>
					<label class="label">Document Type</label>
					<select class="input" bind:value={documentType}>
						<option value="photo">Photo/Image</option>
						<option value="receipt">Receipt</option>
						<option value="police_report">Police Report</option>
						<option value="medical_record">Medical Record</option>
						<option value="estimate">Repair Estimate</option>
						<option value="proof_of_loss">Proof of Loss</option>
						<option value="other">Other</option>
					</select>
				</div>
				
				<div>
					<label class="label">Files</label>
					<input 
						type="file" 
						class="input" 
						multiple 
						accept="image/*,.pdf,.doc,.docx"
						onchange={(e) => uploadFiles = (e.target as HTMLInputElement).files}
					/>
					<p class="text-xs text-surface-500 mt-1">Max 10MB per file. Images, PDFs, and documents accepted.</p>
				</div>
				
				<div>
					<label class="label">Description (Optional)</label>
					<textarea 
						class="input resize-none" 
						rows="2" 
						placeholder="Brief description of the document..."
						bind:value={description}
					></textarea>
				</div>
				
				<div class="flex gap-3 pt-2">
					<button 
						type="button" 
						class="btn-secondary flex-1" 
						onclick={() => showUploadModal = false}
						disabled={uploading}
					>
						Cancel
					</button>
					<button 
						type="button" 
						class="btn-primary flex-1" 
						onclick={handleUpload}
						disabled={uploading || !uploadFiles}
					>
						{uploading ? 'Uploading...' : 'Upload'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { FileText, Image, Video, File, Download, CheckCircle, XCircle, Eye, Upload } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	interface Document {
		id: string;
		fileName: string;
		originalName: string;
		fileType: string;
		fileSize: number;
		documentType: string;
		description?: string;
		isVerified: boolean;
		verifiedBy?: { firstName: string; lastName: string } | null;
		verifiedAt?: string | null;
		uploadedAt: string;
		user?: { firstName: string; lastName: string };
	}
	
	interface Props {
		documents: Document[];
		canVerify?: boolean;
		onVerify?: (documentId: string) => void;
	}
	
	let { documents, canVerify = false, onVerify }: Props = $props();
	
	function getFileIcon(fileType: string) {
		if (fileType.startsWith('image/')) return Image;
		if (fileType.startsWith('video/')) return Video;
		if (fileType === 'application/pdf') return FileText;
		return File;
	}
	
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
	
	const documentTypeLabels: Record<string, string> = {
		photo: 'Photo/Image',
		receipt: 'Receipt',
		police_report: 'Police Report',
		medical_record: 'Medical Record',
		estimate: 'Repair Estimate',
		identification: 'ID Document',
		policy_document: 'Policy Document',
		proof_of_loss: 'Proof of Loss',
		other: 'Other'
	};
	
	const sortedDocuments = $derived(
		[...documents].sort((a, b) => 
			new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
		)
	);
</script>

<div class="space-y-4">
	{#if documents.length === 0}
		<div class="text-center py-8 text-surface-500">
			<Upload class="w-10 h-10 mx-auto mb-2 text-surface-300" />
			<p>No documents uploaded yet</p>
		</div>
	{:else}
		<div class="relative">
			<div class="absolute left-6 top-0 bottom-0 w-px bg-surface-200"></div>
			
			{#each sortedDocuments as doc}
				{@const FileIcon = getFileIcon(doc.fileType)}
				
				<div class="relative flex gap-4 pb-6">
					<div class="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 {doc.isVerified ? 'border-green-500' : 'border-surface-200'} flex items-center justify-center">
						<FileIcon class="w-5 h-5 {doc.isVerified ? 'text-green-500' : 'text-surface-400'}" />
					</div>
					
					<div class="flex-1 bg-surface-50 rounded-lg p-4">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<h4 class="font-medium text-surface-900">{doc.originalName}</h4>
									<span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-200 text-surface-600">
										{documentTypeLabels[doc.documentType] || doc.documentType}
									</span>
									{#if doc.isVerified}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
											<CheckCircle class="w-3 h-3" />
											Verified
										</span>
									{/if}
								</div>
								
								{#if doc.description}
									<p class="text-sm text-surface-500 mt-1">{doc.description}</p>
								{/if}
								
								<div class="flex items-center gap-4 mt-2 text-xs text-surface-400">
									<span>{formatFileSize(doc.fileSize)}</span>
									<span>{format(new Date(doc.uploadedAt), 'MMM d, yyyy h:mm a')}</span>
									{#if doc.user}
										<span>by {doc.user.firstName} {doc.user.lastName}</span>
									{/if}
								</div>
								
								{#if doc.isVerified && doc.verifiedBy}
									<p class="text-xs text-green-600 mt-1">
										Verified by {doc.verifiedBy.firstName} {doc.verifiedBy.lastName} on {format(new Date(doc.verifiedAt || ''), 'MMM d, yyyy')}
									</p>
								{/if}
							</div>
							
							<div class="flex items-center gap-2">
								{#if doc.fileType.startsWith('image/') || doc.fileType === 'application/pdf'}
									<a 
										href="/uploads/{doc.fileName}" 
										target="_blank"
										class="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-200 rounded-lg transition-colors"
										title="Preview"
									>
										<Eye class="w-4 h-4" />
									</a>
								{/if}
								
								<a 
									href="/uploads/{doc.fileName}" 
									download={doc.originalName}
									class="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-200 rounded-lg transition-colors"
									title="Download"
								>
									<Download class="w-4 h-4" />
								</a>
								
								{#if canVerify && !doc.isVerified && onVerify}
									<button 
										class="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
										onclick={() => onVerify(doc.id)}
										title="Verify Document"
									>
										<CheckCircle class="w-4 h-4" />
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

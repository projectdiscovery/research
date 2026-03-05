<script lang="ts">
	import { enhance } from '$app/forms';
	import { Send, Paperclip, Check, CheckCheck, User, X, Download } from 'lucide-svelte';
	import { format } from 'date-fns';
	import { onMount } from 'svelte';
	
	let { data } = $props();
	
	let message = $state('');
	let files = $state<File[]>([]);
	let fileInput: HTMLInputElement | null = $state(null);
	let isSubmitting = $state(false);
	let messageContainer: HTMLDivElement | null = $state(null);
	
	onMount(() => {
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	});
	
	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			files = [...files, ...Array.from(input.files)];
			input.value = '';
		}
	}
	
	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}
	
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
	
	function getInitials(name: string): string {
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	}
</script>

<div class="flex flex-col h-[calc(100vh-200px)]">
	<div class="flex items-center justify-between pb-4 border-b border-surface-200">
		<div>
			<h1 class="text-xl font-bold text-surface-900">Messages</h1>
			<p class="text-sm text-surface-500">Claim #{data.claim.claimNumber}</p>
		</div>
		<a href="/claims/{data.claim.id}" class="btn-secondary text-sm">Back to Claim</a>
	</div>
	
	<div class="flex-1 overflow-y-auto py-4 space-y-4" bind:this={messageContainer}>
		{#if data.messages.length === 0}
			<div class="text-center py-12">
				<p class="text-surface-500">No messages yet. Start the conversation!</p>
			</div>
		{:else}
			{#each data.messages as msg}
				{@const isOwn = msg.senderId === data.user.id}
				<div class="flex {isOwn ? 'justify-end' : 'justify-start'}">
					<div class="flex gap-3 max-w-[80%] {isOwn ? 'flex-row-reverse' : ''}">
						<div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium">
							{getInitials(`${msg.sender.firstName} ${msg.sender.lastName}`)}
						</div>
						
						<div>
							<div class="flex items-center gap-2 mb-1 {isOwn ? 'justify-end' : ''}">
								<span class="text-sm font-medium text-surface-900">{msg.sender.firstName} {msg.sender.lastName}</span>
								<span class="text-xs text-surface-400">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
							</div>
							
							<div class="rounded-lg p-3 {isOwn ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-900'}">
								{#if msg.subject}
									<p class="font-medium text-sm mb-1">{msg.subject}</p>
								{/if}
								<p class="text-sm whitespace-pre-wrap">{msg.message}</p>
								
								{#if msg.attachments && msg.attachments.length > 0}
									<div class="mt-2 pt-2 border-t {isOwn ? 'border-primary-500' : 'border-surface-200'} space-y-1">
										{#each msg.attachments as attachment}
											<a 
												href="/uploads/{attachment.fileName}" 
												target="_blank"
												class="flex items-center gap-2 text-xs {isOwn ? 'text-primary-100 hover:text-white' : 'text-primary-600 hover:text-primary-700'}"
											>
												<Download class="w-3 h-3" />
												{attachment.originalName} ({formatFileSize(attachment.fileSize)})
											</a>
										{/each}
									</div>
								{/if}
							</div>
							
							<div class="flex items-center gap-1 mt-1 {isOwn ? 'justify-end' : ''}">
								{#if isOwn}
									{#if msg.isRead}
										<CheckCheck class="w-4 h-4 text-primary-500" />
									{:else}
										<Check class="w-4 h-4 text-surface-400" />
									{/if}
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
	
	<div class="pt-4 border-t border-surface-200">
		{#if files.length > 0}
			<div class="flex flex-wrap gap-2 mb-3">
				{#each files as file, i}
					<div class="flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-lg text-sm">
						<Paperclip class="w-4 h-4 text-surface-500" />
						<span class="text-surface-700 truncate max-w-[150px]">{file.name}</span>
						<span class="text-surface-400">({formatFileSize(file.size)})</span>
						<button onclick={() => removeFile(i)} class="text-surface-400 hover:text-red-500">
							<X class="w-4 h-4" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
		
		<form method="POST" action="?/send" enctype="multipart/form-data" use:enhance={() => {
			isSubmitting = true;
			return async ({ result }) => {
				isSubmitting = false;
				if (result.type === 'success') {
					message = '';
					files = [];
					if (messageContainer) {
						setTimeout(() => {
							messageContainer!.scrollTop = messageContainer!.scrollHeight;
						}, 100);
					}
				}
			};
		}}>
			<div class="flex gap-2">
				<input type="hidden" name="claimId" value={data.claim.id} />
				
				<button 
					type="button" 
					class="p-3 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
					onclick={() => fileInput?.click()}
				>
					<Paperclip class="w-5 h-5" />
				</button>
				<input 
					type="file" 
					name="attachments" 
					multiple 
					class="hidden" 
					bind:this={fileInput}
					onchange={handleFileSelect}
					accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.webm,.doc,.docx"
				/>
				
				<textarea
					name="message"
					class="input flex-1 resize-none"
					rows="2"
					placeholder="Type your message..."
					bind:value={message}
				></textarea>
				
				<button 
					type="submit" 
					class="btn-primary px-4"
					disabled={!message.trim() || isSubmitting}
				>
					<Send class="w-5 h-5" />
				</button>
			</div>
		</form>
	</div>
</div>

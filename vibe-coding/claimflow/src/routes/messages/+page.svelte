<script lang="ts">
	import { MessageSquare, Search, Send, User, ChevronRight, Clock, CheckCheck, ArrowLeft } from 'lucide-svelte';
	import { format } from 'date-fns';
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	
	let selectedClaimId = $state(data.preselectedClaim || (data.claimThreads[0]?.claimId ?? ''));
	let newMessage = $state('');
	let loading = $state(false);
	
	let selectedThread = $derived(data.claimThreads.find(t => t.claimId === selectedClaimId));
	let mobileShowMessages = $state(!!data.preselectedClaim);
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Messages</h1>
		<p class="text-surface-600 mt-1">Communicate with your claims team</p>
	</div>
	
	{#if data.claimThreads.length === 0}
		<div class="card text-center py-12">
			<MessageSquare class="w-16 h-16 mx-auto text-surface-300 mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No Messages Yet</h3>
			<p class="text-surface-600 mt-1">Messages will appear here when you have active claims.</p>
			<a href="/claims" class="btn-primary mt-4 inline-block">View Claims</a>
		</div>
	{:else}
		<div class="card p-0 overflow-hidden">
			<div class="flex h-[600px]">
				<div class="w-full md:w-80 border-r border-surface-200 flex-shrink-0 {mobileShowMessages ? 'hidden md:block' : ''}">
					<div class="p-4 border-b border-surface-200">
						<div class="relative">
							<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
							<input
								type="text"
								placeholder="Search conversations..."
								class="input pl-10"
							/>
						</div>
					</div>
					
					<div class="overflow-y-auto h-[calc(100%-73px)]">
						{#each data.claimThreads as thread}
							<button
								class="w-full p-4 text-left hover:bg-surface-50 transition-colors border-b border-surface-100 {selectedClaimId === thread.claimId ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''}"
								onclick={() => {
									selectedClaimId = thread.claimId;
									mobileShowMessages = true;
								}}
							>
								<div class="flex items-start gap-3">
									<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
										<User class="w-5 h-5 text-primary-600" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center justify-between gap-2">
											<p class="font-medium text-surface-900 truncate">{thread.claimNumber}</p>
											{#if thread.unreadCount > 0}
												<span class="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
													{thread.unreadCount}
												</span>
											{/if}
										</div>
										<p class="text-sm text-surface-500 truncate mt-0.5">{thread.lastMessage}</p>
										<p class="text-xs text-surface-400 mt-1">{format(new Date(thread.lastMessageAt), 'MMM d, h:mm a')}</p>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
				
				<div class="flex-1 flex flex-col {!mobileShowMessages ? 'hidden md:flex' : ''}">
					{#if selectedThread}
						<div class="p-4 border-b border-surface-200 flex items-center gap-3">
							<button 
								class="md:hidden p-2 hover:bg-surface-100 rounded-lg"
								onclick={() => mobileShowMessages = false}
							>
								<ArrowLeft class="w-5 h-5" />
							</button>
							<div class="flex-1">
								<h3 class="font-semibold text-surface-900">{selectedThread.claimNumber}</h3>
								<p class="text-sm text-surface-500">Claim Discussion</p>
							</div>
							<a href="/claims/{selectedThread.claimId}" class="btn-secondary text-sm">View Claim</a>
						</div>
						
						<div class="flex-1 overflow-y-auto p-4 space-y-4">
							{#each selectedThread.messages as message}
								<div class="flex {message.senderId === data.user.id ? 'justify-end' : 'justify-start'}">
									<div class="max-w-[80%] {message.senderId === data.user.id ? 'order-2' : ''}">
										{#if message.senderId !== data.user.id}
											<div class="flex items-center gap-2 mb-1">
												<div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
													<User class="w-3 h-3 text-primary-600" />
												</div>
												<span class="text-sm font-medium text-surface-700">{message.senderName}</span>
											</div>
										{/if}
										<div class="rounded-lg p-3 {message.senderId === data.user.id ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-900'}">
											{#if message.subject}
												<p class="font-medium text-sm mb-1 {message.senderId === data.user.id ? 'text-primary-100' : 'text-surface-700'}">{message.subject}</p>
											{/if}
											<p class="whitespace-pre-wrap">{message.message}</p>
										</div>
										<div class="flex items-center gap-2 mt-1 {message.senderId === data.user.id ? 'justify-end' : ''}">
											<span class="text-xs text-surface-400">{format(new Date(message.createdAt), 'h:mm a')}</span>
											{#if message.senderId === data.user.id}
												{#if message.isRead}
													<CheckCheck class="w-4 h-4 text-primary-600" />
												{:else}
													<Clock class="w-4 h-4 text-surface-400" />
												{/if}
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
						
						<div class="p-4 border-t border-surface-200">
							<form method="POST" use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									newMessage = '';
									await update();
								};
							}}>
								<input type="hidden" name="claimId" value={selectedClaimId} />
								<div class="flex items-end gap-3">
									<div class="flex-1">
										<textarea
											name="message"
											rows="2"
											class="input resize-none"
											placeholder="Type your message..."
											bind:value={newMessage}
											required
										></textarea>
									</div>
									<button type="submit" class="btn-primary p-3" disabled={loading || !newMessage.trim()}>
										<Send class="w-5 h-5" />
									</button>
								</div>
							</form>
						</div>
					{:else}
						<div class="flex-1 flex items-center justify-center">
							<div class="text-center text-surface-500">
								<MessageSquare class="w-16 h-16 mx-auto text-surface-300 mb-4" />
								<p>Select a conversation to view messages</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

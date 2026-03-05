<script lang="ts">
	import { Check, Clock, Circle } from 'lucide-svelte';
	import { getWorkflowSteps, getCurrentStep, STATUS_LABELS, STATUS_COLORS, type ClaimStatus } from '$lib/server/workflow';
	
	interface Props {
		currentStatus: ClaimStatus;
		workflowHistory?: { fromStatus: string; toStatus: string; createdAt: string; user?: { firstName: string; lastName: string } }[];
	}
	
	let { currentStatus, workflowHistory = [] }: Props = $props();
	
	const steps = getWorkflowSteps();
	const currentStepIndex = getCurrentStep(currentStatus);
	
	function getStepState(stepIndex: number): 'completed' | 'current' | 'pending' {
		if (stepIndex < currentStepIndex) return 'completed';
		if (stepIndex === currentStepIndex) return 'current';
		return 'pending';
	}
	
	function getHistoryForStatus(status: string) {
		return workflowHistory.find(h => h.toStatus === status);
	}
</script>

<div class="relative">
	<div class="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-200"></div>
	
	<div class="space-y-6">
		{#each steps as step, index}
			{@const state = getStepState(index)}
			{@const history = getHistoryForStatus(step.status)}
			
			<div class="relative flex items-start gap-4">
				<div class="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
					{state === 'completed' ? 'bg-green-500 text-white' : 
					  state === 'current' ? 'bg-primary-500 text-white' : 
					  'bg-surface-100 text-surface-400 border-2 border-surface-200'}">
					{#if state === 'completed'}
						<Check class="w-4 h-4" />
					{:else if state === 'current'}
						<Clock class="w-4 h-4" />
					{:else}
						<Circle class="w-3 h-3" />
					{/if}
				</div>
				
				<div class="flex-1 pb-4">
					<div class="flex items-center gap-2">
						<h4 class="font-medium {state === 'pending' ? 'text-surface-400' : 'text-surface-900'}">
							{step.label}
						</h4>
						{#if state === 'current'}
							<span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
								Current
							</span>
						{/if}
					</div>
					
					<p class="text-sm {state === 'pending' ? 'text-surface-300' : 'text-surface-500'} mt-0.5">
						{step.description}
					</p>
					
					{#if history}
						<p class="text-xs text-surface-400 mt-1">
							{new Date(history.createdAt).toLocaleDateString()} 
							{history.user ? `by ${history.user.firstName} ${history.user.lastName}` : ''}
						</p>
					{/if}
				</div>
			</div>
		{/each}
		
		{#if currentStatus === 'denied'}
			<div class="relative flex items-start gap-4">
				<div class="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-500 text-white">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				
				<div class="flex-1">
					<h4 class="font-medium text-red-700">Denied</h4>
					<p class="text-sm text-red-600 mt-0.5">Claim has been denied</p>
				</div>
			</div>
		{/if}
	</div>
</div>

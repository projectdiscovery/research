<script lang="ts">
	import { enhance } from '$app/forms';
	import { Calculator, Plus, Trash2, DollarSign, AlertCircle, Check } from 'lucide-svelte';
	
	let { data } = $props();
	
	interface DamageItem {
		id: string;
		category: string;
		description: string;
		estimatedCost: number;
		actualCost: number;
		ageYears: number;
		condition: string;
	}
	
	let damageItems = $state<DamageItem[]>([
		{ id: crypto.randomUUID(), category: 'property', description: '', estimatedCost: 0, actualCost: 0, ageYears: 0, condition: 'good' }
	]);
	
	let calculationResult = $state<{
		totalDamage: number;
		depreciation: number;
		deductible: number;
		coverageLimit: number;
		calculatedPayout: number;
	} | null>(null);
	
	let override = $state(false);
	let overrideAmount = $state(0);
	let overrideReason = $state('');
	let isProcessing = $state(false);
	let success = $state(false);
	
	function addItem() {
		damageItems = [...damageItems, { id: crypto.randomUUID(), category: 'property', description: '', estimatedCost: 0, actualCost: 0, ageYears: 0, condition: 'good' }];
	}
	
	function removeItem(id: string) {
		damageItems = damageItems.filter(item => item.id !== id);
	}
	
	const totalEstimated = $derived(damageItems.reduce((sum, item) => sum + (item.actualCost || item.estimatedCost), 0));
	
	const categories = ['property', 'vehicle', 'personal_items', 'medical', 'labor', 'other'];
	const conditions = ['excellent', 'good', 'fair', 'poor'];
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">Settlement Calculator</h1>
			<p class="text-surface-600 mt-1">Claim #{data.claim.claimNumber} - {data.claim.user.firstName} {data.claim.user.lastName}</p>
		</div>
		
		<a href="/adjuster/claims/{data.claim.id}" class="btn-secondary">Back to Claim</a>
	</div>
	
	<div class="grid lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-4">
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-surface-900 flex items-center gap-2">
						<Calculator class="w-5 h-5" />
						Damage Assessment
					</h3>
					<button onclick={addItem} class="btn-secondary text-sm flex items-center gap-1">
						<Plus class="w-4 h-4" />
						Add Item
					</button>
				</div>
				
				<div class="space-y-4">
					{#each damageItems as item, index}
						<div class="p-4 bg-surface-50 rounded-lg space-y-3">
							<div class="flex items-center justify-between">
								<span class="font-medium text-surface-700">Item #{index + 1}</span>
								{#if damageItems.length > 1}
									<button onclick={() => removeItem(item.id)} class="text-red-500 hover:text-red-700">
										<Trash2 class="w-4 h-4" />
									</button>
								{/if}
							</div>
							
							<div class="grid sm:grid-cols-2 gap-3">
								<div>
									<label class="label text-sm">Category</label>
									<select class="input text-sm" bind:value={item.category}>
										{#each categories as cat}
											<option value={cat}>{cat.replace('_', ' ')}</option>
										{/each}
									</select>
								</div>
								<div>
									<label class="label text-sm">Description</label>
									<input type="text" class="input text-sm" bind:value={item.description} placeholder="e.g., Front bumper damage" />
								</div>
							</div>
							
							<div class="grid sm:grid-cols-4 gap-3">
								<div>
									<label class="label text-sm">Estimated Cost</label>
									<input type="number" class="input text-sm" bind:value={item.estimatedCost} min="0" step="0.01" />
								</div>
								<div>
									<label class="label text-sm">Actual Cost</label>
									<input type="number" class="input text-sm" bind:value={item.actualCost} min="0" step="0.01" placeholder="If known" />
								</div>
								<div>
									<label class="label text-sm">Age (years)</label>
									<input type="number" class="input text-sm" bind:value={item.ageYears} min="0" max="50" />
								</div>
								<div>
									<label class="label text-sm">Condition</label>
									<select class="input text-sm" bind:value={item.condition}>
										{#each conditions as cond}
											<option value={cond}>{cond}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>
					{/each}
				</div>
				
				<div class="mt-4 pt-4 border-t border-surface-200 flex justify-between items-center">
					<span class="font-medium text-surface-700">Total Estimated Damage:</span>
					<span class="text-xl font-bold text-surface-900">${totalEstimated.toLocaleString()}</span>
				</div>
			</div>
			
			<form method="POST" action="?/calculate" use:enhance={({ formData }) => {
				formData.set('damageItems', JSON.stringify(damageItems));
				isProcessing = true;
				return async ({ result }) => {
					isProcessing = false;
					if (result.type === 'success' && result.data) {
						calculationResult = result.data.calculation as typeof calculationResult;
						overrideAmount = result.data.calculation?.calculatedPayout || 0;
					}
				};
			}}>
				<button type="submit" class="btn-primary w-full" disabled={damageItems.length === 0 || isProcessing}>
					{isProcessing ? 'Calculating...' : 'Calculate Settlement'}
				</button>
			</form>
		</div>
		
		<div class="space-y-4">
			<div class="card bg-surface-50">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Claim Details</h3>
				<dl class="space-y-3 text-sm">
					<div class="flex justify-between">
						<dt class="text-surface-500">Policy Type</dt>
						<dd class="font-medium text-surface-900 capitalize">{data.claim.policy.type}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-surface-500">Coverage Limit</dt>
						<dd class="font-medium text-surface-900">${data.claim.policy.coverageAmount.toLocaleString()}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-surface-500">Deductible</dt>
						<dd class="font-medium text-surface-900">${data.claim.policy.deductible.toLocaleString()}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-surface-500">Amount Claimed</dt>
						<dd class="font-medium text-surface-900">${data.claim.amountClaimed.toLocaleString()}</dd>
					</div>
				</dl>
			</div>
			
			{#if calculationResult}
				<div class="card border-2 border-primary-200 bg-primary-50">
					<h3 class="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
						<DollarSign class="w-5 h-5" />
						Calculation Result
					</h3>
					
					<dl class="space-y-3 text-sm">
						<div class="flex justify-between">
							<dt class="text-primary-700">Total Damage</dt>
							<dd class="font-medium text-primary-900">${calculationResult.totalDamage.toLocaleString()}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-primary-700">Depreciation</dt>
							<dd class="font-medium text-red-600">-${calculationResult.depreciation.toLocaleString()}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-primary-700">Deductible</dt>
							<dd class="font-medium text-red-600">-${calculationResult.deductible.toLocaleString()}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-primary-700">Coverage Limit</dt>
							<dd class="font-medium text-primary-900">${calculationResult.coverageLimit.toLocaleString()}</dd>
						</div>
						<div class="pt-3 border-t border-primary-200 flex justify-between">
							<dt class="text-primary-900 font-semibold">Calculated Payout</dt>
							<dd class="text-xl font-bold text-primary-900">${calculationResult.calculatedPayout.toLocaleString()}</dd>
						</div>
					</dl>
					
					<div class="mt-4 pt-4 border-t border-primary-200">
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" class="w-4 h-4 rounded" bind:checked={override} />
							<span class="text-sm font-medium text-primary-900">Override calculated amount</span>
						</label>
						
						{#if override}
							<div class="mt-3 space-y-3">
								<div>
									<label class="label text-sm">Override Amount</label>
									<input type="number" class="input" bind:value={overrideAmount} min="0" step="0.01" />
								</div>
								<div>
									<label class="label text-sm">Justification (required)</label>
									<textarea class="input" bind:value={overrideReason} rows="3" placeholder="Explain the reason for override..."></textarea>
								</div>
							</div>
						{/if}
					</div>
					
					<form method="POST" action="?/saveSettlement" class="mt-4" use:enhance={({ formData }) => {
						formData.set('damageItems', JSON.stringify(damageItems));
						formData.set('calculatedPayout', String(calculationResult?.calculatedPayout || 0));
						formData.set('override', String(override));
						formData.set('overrideAmount', String(overrideAmount));
						formData.set('overrideReason', overrideReason);
						isProcessing = true;
						return async ({ result }) => {
							isProcessing = false;
							if (result.type === 'redirect') {
								success = true;
							}
						};
					}}>
						<button 
							type="submit" 
							class="btn-primary w-full" 
							disabled={isProcessing || (override && !overrideReason)}
						>
							{isProcessing ? 'Saving...' : 'Save Settlement & Recommend Payout'}
						</button>
					</form>
				</div>
			{/if}
			
			{#if data.previousSettlements.length > 0}
				<div class="card">
					<h3 class="text-lg font-semibold text-surface-900 mb-4">Previous Calculations</h3>
					<div class="space-y-2">
						{#each data.previousSettlements as settlement}
							<div class="p-3 bg-surface-50 rounded-lg text-sm">
								<div class="flex justify-between">
									<span class="text-surface-500">{new Date(settlement.createdAt).toLocaleDateString()}</span>
									<span class="font-medium">${settlement.calculatedPayout.toLocaleString()}</span>
								</div>
								{#if settlement.isOverridden}
									<p class="text-xs text-orange-600 mt-1">Override: ${settlement.finalPayout?.toLocaleString()}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

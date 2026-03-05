<script lang="ts">
	import { ArrowLeft, AlertCircle, Car, Home, Heart, Shield, Upload, X } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	
	let loading = $state(false);
	let selectedPolicy = $state(data.preselectedPolicy || '');
	
	const policyIcons: Record<string, typeof Car> = {
		auto: Car,
		home: Home,
		health: Heart,
		life: Shield
	};
	
	const claimTypes: Record<string, { label: string; types: { value: string; label: string }[] }> = {
		auto: {
			label: 'Auto',
			types: [
				{ value: 'accident', label: 'Accident' },
				{ value: 'theft', label: 'Theft' },
				{ value: 'damage', label: 'Vehicle Damage' },
				{ value: 'liability', label: 'Liability' },
				{ value: 'other', label: 'Other' }
			]
		},
		home: {
			label: 'Home',
			types: [
				{ value: 'damage', label: 'Property Damage' },
				{ value: 'theft', label: 'Theft/Burglary' },
				{ value: 'liability', label: 'Liability' },
				{ value: 'other', label: 'Other' }
			]
		},
		health: {
			label: 'Health',
			types: [
				{ value: 'medical', label: 'Medical Expense' },
				{ value: 'other', label: 'Other' }
			]
		},
		life: {
			label: 'Life',
			types: [
				{ value: 'other', label: 'Claim' }
			]
		}
	};
	
	let selectedPolicyData = $derived(data.policies.find(p => p.id === selectedPolicy));
	let availableTypes = $derived(selectedPolicyData ? claimTypes[selectedPolicyData.type]?.types || [] : []);
</script>

<div class="max-w-3xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<a href="/claims" class="p-2 hover:bg-surface-100 rounded-lg transition-colors">
			<ArrowLeft class="w-5 h-5 text-surface-600" />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-surface-900">File a New Claim</h1>
			<p class="text-surface-600 mt-0.5">Report an incident and start your claim process</p>
		</div>
	</div>
	
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
			<AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
			<p class="text-red-700">{form.error}</p>
		</div>
	{/if}
	
	{#if data.policies.length === 0}
		<div class="card text-center py-12">
			<Shield class="w-16 h-16 mx-auto text-surface-300 mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No Active Policies</h3>
			<p class="text-surface-600 mt-1">You need an active policy to file a claim.</p>
			<a href="/policies" class="btn-primary mt-4 inline-block">View Policies</a>
		</div>
	{:else}
		<form method="POST" use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}>
			<div class="card space-y-6">
				<div>
					<h3 class="text-lg font-semibold text-surface-900 mb-4">Select Policy</h3>
					<div class="grid sm:grid-cols-2 gap-3">
						{#each data.policies.filter(p => p.status === 'active') as policy}
							{@const Icon = policyIcons[policy.type] || Shield}
							<label class="relative cursor-pointer">
								<input
									type="radio"
									name="policyId"
									value={policy.id}
									bind:group={selectedPolicy}
									class="peer sr-only"
									required
								/>
								<div class="p-4 rounded-lg border-2 border-surface-200 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-colors">
									<div class="flex items-start gap-3">
										<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center peer-checked:bg-primary-100">
											<Icon class="w-5 h-5 text-surface-600" />
										</div>
										<div class="flex-1 min-w-0">
											<p class="font-medium text-surface-900">{policy.description}</p>
											<p class="text-sm text-surface-500">{policy.policyNumber}</p>
										</div>
									</div>
								</div>
							</label>
						{/each}
					</div>
				</div>
				
				{#if selectedPolicy}
					<div class="border-t border-surface-200 pt-6">
						<h3 class="text-lg font-semibold text-surface-900 mb-4">Incident Information</h3>
						
						<div class="space-y-4">
							<div class="grid sm:grid-cols-2 gap-4">
								<div>
									<label for="type" class="label">Claim Type</label>
									<select name="type" id="type" class="input" required>
										<option value="">Select type...</option>
										{#each availableTypes as type}
											<option value={type.value}>{type.label}</option>
										{/each}
									</select>
								</div>
								<div>
									<label for="incidentDate" class="label">Date of Incident</label>
									<input
										type="date"
										name="incidentDate"
										id="incidentDate"
										class="input"
										max={new Date().toISOString().split('T')[0]}
										required
									/>
								</div>
							</div>
							
							<div>
								<label for="incidentLocation" class="label">Location of Incident</label>
								<input
									type="text"
									name="incidentLocation"
									id="incidentLocation"
									class="input"
									placeholder="Address or description of location"
								/>
							</div>
							
							<div>
								<label for="description" class="label">Description of Incident</label>
								<textarea
									name="description"
									id="description"
									rows="4"
									class="input resize-none"
									placeholder="Please provide a detailed description of what happened..."
									required
								></textarea>
								<p class="text-xs text-surface-500 mt-1">Include all relevant details: what happened, who was involved, any witnesses, etc.</p>
							</div>
							
							<div>
								<label for="amountClaimed" class="label">Estimated Claim Amount ($)</label>
								<input
									type="number"
									name="amountClaimed"
									id="amountClaimed"
									class="input"
									placeholder="0.00"
									min="0"
									step="0.01"
									required
								/>
								<p class="text-xs text-surface-500 mt-1">This is an estimate. Final amount may differ after review.</p>
							</div>
						</div>
					</div>
					
					<div class="border-t border-surface-200 pt-6">
						<h3 class="text-lg font-semibold text-surface-900 mb-4">Supporting Documents</h3>
						<p class="text-sm text-surface-600 mb-4">Upload photos, receipts, police reports, or any other relevant documentation.</p>
						
						<div class="border-2 border-dashed border-surface-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
							<Upload class="w-10 h-10 text-surface-400 mx-auto mb-3" />
							<p class="text-surface-600">Drag and drop files here, or click to browse</p>
							<p class="text-sm text-surface-500 mt-1">PNG, JPG, PDF up to 10MB each</p>
							<input type="file" name="documents" multiple accept="image/*,.pdf" class="hidden" />
						</div>
					</div>
					
					<div class="border-t border-surface-200 pt-6">
						<label class="flex items-start gap-3 cursor-pointer">
							<input type="checkbox" name="confirm" required class="w-5 h-5 mt-0.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
							<span class="text-sm text-surface-600">
								I confirm that the information provided is accurate and complete to the best of my knowledge. I understand that providing false information may result in claim denial and potential policy cancellation.
							</span>
						</label>
					</div>
				{/if}
			</div>
			
			{#if selectedPolicy}
				<div class="flex items-center justify-end gap-4 mt-6">
					<a href="/claims" class="btn-secondary">Cancel</a>
					<button type="submit" name="action" value="draft" class="btn-secondary" disabled={loading}>
						Save as Draft
					</button>
					<button type="submit" name="action" value="submit" class="btn-primary" disabled={loading}>
						{#if loading}
							<span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						{:else}
							Submit Claim
						{/if}
					</button>
				</div>
			{/if}
		</form>
	{/if}
</div>

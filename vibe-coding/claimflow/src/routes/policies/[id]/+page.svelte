<script lang="ts">
	import { Car, Home, Heart, Shield, ArrowLeft, FileText, Calendar, DollarSign, AlertTriangle, Download, ChevronRight } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	const policyIcons: Record<string, typeof Car> = {
		auto: Car,
		home: Home,
		health: Heart,
		life: Shield
	};
	
	const policyLabels: Record<string, string> = {
		auto: 'Auto Insurance',
		home: 'Home Insurance',
		health: 'Health Insurance',
		life: 'Life Insurance'
	};
	
	const Icon = policyIcons[data.policy.type] || Shield;
	
	let coverageDetails: Record<string, unknown> | null = null;
	try {
		coverageDetails = data.policy.coverageDetails ? JSON.parse(data.policy.coverageDetails) : null;
	} catch {
		coverageDetails = null;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/policies" class="p-2 hover:bg-surface-100 rounded-lg transition-colors">
			<ArrowLeft class="w-5 h-5 text-surface-600" />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-surface-900">{data.policy.description || policyLabels[data.policy.type]}</h1>
			<p class="text-surface-600 mt-0.5">{data.policy.policyNumber}</p>
		</div>
	</div>
	
	<div class="grid lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<div class="card">
				<div class="flex items-start gap-4 mb-6">
					<div class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
						<Icon class="w-8 h-8 text-primary-600" />
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<h2 class="text-xl font-semibold text-surface-900">{policyLabels[data.policy.type]}</h2>
							<span class="badge {data.policy.status === 'active' ? 'badge-success' : data.policy.status === 'pending' ? 'badge-warning' : 'badge-neutral'}">
								{data.policy.status}
							</span>
						</div>
						<p class="text-surface-600">{data.policy.description}</p>
					</div>
				</div>
				
				<div class="grid sm:grid-cols-2 gap-6">
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
								<DollarSign class="w-5 h-5 text-surface-600" />
							</div>
							<div>
								<p class="text-sm text-surface-500">Coverage Amount</p>
								<p class="font-semibold text-surface-900">${data.policy.coverageAmount.toLocaleString()}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
								<DollarSign class="w-5 h-5 text-surface-600" />
							</div>
							<div>
								<p class="text-sm text-surface-500">Deductible</p>
								<p class="font-semibold text-surface-900">${data.policy.deductible.toLocaleString()}</p>
							</div>
						</div>
					</div>
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
								<Calendar class="w-5 h-5 text-surface-600" />
							</div>
							<div>
								<p class="text-sm text-surface-500">Start Date</p>
								<p class="font-semibold text-surface-900">{format(new Date(data.policy.startDate), 'MMMM d, yyyy')}</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
								<Calendar class="w-5 h-5 text-surface-600" />
							</div>
							<div>
								<p class="text-sm text-surface-500">End Date</p>
								<p class="font-semibold text-surface-900">{format(new Date(data.policy.endDate), 'MMMM d, yyyy')}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			{#if coverageDetails}
				<div class="card">
					<h3 class="text-lg font-semibold text-surface-900 mb-4">Coverage Details</h3>
					<div class="space-y-3">
						{#each Object.entries(coverageDetails) as [key, value]}
							<div class="flex justify-between items-center py-2 border-b border-surface-100 last:border-0">
								<span class="text-surface-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
								<span class="font-medium text-surface-900">
									{#if typeof value === 'object' && value !== null}
										{JSON.stringify(value)}
									{:else if typeof value === 'number'}
										{value >= 100 ? `$${value.toLocaleString()}` : value}
									{:else if typeof value === 'boolean'}
										{value ? 'Yes' : 'No'}
									{:else}
										{value}
									{/if}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-surface-900">Claims History</h3>
					<a href="/claims/new?policy={data.policy.id}" class="btn-primary text-sm">
						File a Claim
					</a>
				</div>
				
				{#if data.claims.length === 0}
					<div class="text-center py-8 text-surface-500">
						<AlertTriangle class="w-12 h-12 mx-auto mb-3 text-surface-300" />
						<p>No claims filed for this policy</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each data.claims as claim}
							<a href="/claims/{claim.id}" class="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors">
								<div>
									<p class="font-medium text-surface-900">{claim.claimNumber}</p>
									<p class="text-sm text-surface-500">{format(new Date(claim.incidentDate), 'MMM d, yyyy')}</p>
								</div>
								<div class="flex items-center gap-3">
									<div class="text-right">
										<p class="font-medium text-surface-900">${claim.amountClaimed.toLocaleString()}</p>
										<span class="badge {claim.status === 'approved' || claim.status === 'paid' ? 'badge-success' : claim.status === 'denied' ? 'badge-error' : 'badge-warning'}">
											{claim.status}
										</span>
									</div>
									<ChevronRight class="w-5 h-5 text-surface-400" />
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		
		<div class="space-y-6">
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Premium</h3>
				<div class="text-center">
					<p class="text-3xl font-bold text-surface-900">${data.policy.premium}</p>
					<p class="text-surface-500">/{data.policy.premiumFrequency === 'monthly' ? 'month' : data.policy.premiumFrequency === 'quarterly' ? 'quarter' : 'year'}</p>
				</div>
				<div class="mt-4 pt-4 border-t border-surface-200">
					<div class="flex justify-between text-sm mb-2">
						<span class="text-surface-600">Next Payment</span>
						<span class="font-medium text-surface-900">Mar 1, 2025</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-surface-600">Payment Method</span>
						<span class="font-medium text-surface-900">•••• 4242</span>
					</div>
				</div>
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Documents</h3>
				{#if data.documents.length === 0}
					<p class="text-surface-500 text-sm">No documents uploaded</p>
				{:else}
					<div class="space-y-2">
						{#each data.documents as doc}
							<a href="#" class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors">
								<FileText class="w-5 h-5 text-surface-400" />
								<span class="text-sm text-surface-700 flex-1 truncate">{doc.fileName}</span>
								<Download class="w-4 h-4 text-surface-400" />
							</a>
						{/each}
					</div>
				{/if}
			</div>
			
			<div class="card">
				<h3 class="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h3>
				<div class="space-y-2">
					<a href="/claims/new?policy={data.policy.id}" class="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
						<div class="flex items-center gap-3">
							<AlertTriangle class="w-5 h-5 text-primary-600" />
							<span class="font-medium text-surface-900">File a Claim</span>
						</div>
						<ChevronRight class="w-5 h-5 text-surface-400" />
					</a>
					<a href="/messages" class="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
						<div class="flex items-center gap-3">
							<FileText class="w-5 h-5 text-primary-600" />
							<span class="font-medium text-surface-900">Contact Agent</span>
						</div>
						<ChevronRight class="w-5 h-5 text-surface-400" />
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

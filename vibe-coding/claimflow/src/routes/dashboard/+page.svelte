<script lang="ts">
	import { FileText, AlertTriangle, CheckCircle, Clock, DollarSign, ArrowRight, TrendingUp, Car, Home, Heart, Shield } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	const policyIcons: Record<string, typeof Car> = {
		auto: Car,
		home: Home,
		health: Heart,
		life: Shield
	};
	
	const statusColors: Record<string, string> = {
		draft: 'badge-neutral',
		submitted: 'badge-info',
		under_review: 'badge-warning',
		approved: 'badge-success',
		denied: 'badge-error',
		paid: 'badge-success',
		closed: 'badge-neutral'
	};
	
	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		submitted: 'Submitted',
		under_review: 'Under Review',
		approved: 'Approved',
		denied: 'Denied',
		paid: 'Paid',
		closed: 'Closed'
	};
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Welcome back, {data.user?.firstName}!</h1>
		<p class="text-surface-600 mt-1">Here's an overview of your insurance portfolio.</p>
	</div>
	
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Active Policies</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.activePolicies}</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<FileText class="w-6 h-6 text-blue-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Open Claims</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.openClaims}</p>
				</div>
				<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
					<AlertTriangle class="w-6 h-6 text-yellow-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Resolved Claims</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.resolvedClaims}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<CheckCircle class="w-6 h-6 text-green-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Total Coverage</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">${(data.stats.totalCoverage / 1000).toFixed(0)}K</p>
				</div>
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<DollarSign class="w-6 h-6 text-primary-600" />
				</div>
			</div>
		</div>
	</div>
	
	<div class="grid lg:grid-cols-2 gap-6">
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-surface-900">Your Policies</h2>
				<a href="/policies" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
					View all
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
			
			{#if data.policies.length === 0}
				<div class="text-center py-8 text-surface-500">
					<FileText class="w-12 h-12 mx-auto mb-3 text-surface-300" />
					<p>No policies yet</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.policies.slice(0, 3) as policy}
						{@const Icon = policyIcons[policy.type] || FileText}
						<a href="/policies/{policy.id}" class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors">
							<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
								<Icon class="w-5 h-5 text-surface-600" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-surface-900 truncate">{policy.description}</p>
								<p class="text-sm text-surface-500">{policy.policyNumber}</p>
							</div>
							<div class="text-right">
								<p class="font-medium text-surface-900">${policy.premium}/mo</p>
								<span class="badge {policy.status === 'active' ? 'badge-success' : 'badge-neutral'}">
									{policy.status}
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-surface-900">Recent Claims</h2>
				<a href="/claims" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
					View all
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
			
			{#if data.claims.length === 0}
				<div class="text-center py-8 text-surface-500">
					<AlertTriangle class="w-12 h-12 mx-auto mb-3 text-surface-300" />
					<p>No claims filed</p>
					<a href="/claims/new" class="btn-primary mt-4 inline-block">File a Claim</a>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.claims.slice(0, 3) as claim}
						<a href="/claims/{claim.id}" class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors">
							<div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
								<AlertTriangle class="w-5 h-5 text-surface-600" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-surface-900 truncate">{claim.claimNumber}</p>
								<p class="text-sm text-surface-500 truncate">{claim.description}</p>
							</div>
							<div class="text-right">
								<p class="font-medium text-surface-900">${claim.amountClaimed.toLocaleString()}</p>
								<span class="badge {statusColors[claim.status]}">
									{statusLabels[claim.status]}
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
	
	<div class="card">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-surface-900">Quick Actions</h2>
		</div>
		<div class="grid sm:grid-cols-3 gap-4">
			<a href="/claims/new" class="flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<AlertTriangle class="w-6 h-6 text-primary-600" />
				</div>
				<div>
					<p class="font-medium text-surface-900">File a Claim</p>
					<p class="text-sm text-surface-500">Report an incident</p>
				</div>
			</a>
			
			<a href="/messages" class="flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<Clock class="w-6 h-6 text-primary-600" />
				</div>
				<div>
					<p class="font-medium text-surface-900">View Messages</p>
					<p class="text-sm text-surface-500">{data.stats.unreadMessages} unread</p>
				</div>
			</a>
			
			<a href="/policies" class="flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<TrendingUp class="w-6 h-6 text-primary-600" />
				</div>
				<div>
					<p class="font-medium text-surface-900">Manage Policies</p>
					<p class="text-sm text-surface-500">View coverage details</p>
				</div>
			</a>
		</div>
	</div>
</div>

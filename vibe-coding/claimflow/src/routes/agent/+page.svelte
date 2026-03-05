<script lang="ts">
	import { Users, FileText, AlertTriangle, DollarSign, ArrowRight, Plus, TrendingUp } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">Agent Dashboard</h1>
			<p class="text-surface-600 mt-1">Welcome back, {data.user.firstName}! Manage your clients and policies.</p>
		</div>
		<a href="/agent/customers?action=new" class="btn-primary flex items-center gap-2">
			<Plus class="w-5 h-5" />
			Add Customer
		</a>
	</div>
	
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Total Customers</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.totalCustomers}</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<Users class="w-6 h-6 text-blue-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Active Policies</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.activePolicies}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<FileText class="w-6 h-6 text-green-600" />
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
					<p class="text-sm text-surface-500">Monthly Premium</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">${data.stats.monthlyPremium.toLocaleString()}</p>
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
				<h2 class="text-lg font-semibold text-surface-900">Recent Customers</h2>
				<a href="/agent/customers" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
					View all
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
			
			{#if data.recentCustomers.length === 0}
				<div class="text-center py-8 text-surface-500">
					<Users class="w-12 h-12 mx-auto mb-3 text-surface-300" />
					<p>No customers yet</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.recentCustomers as customer}
						<div class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors">
							<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
								<span class="text-primary-600 font-medium">{customer.firstName[0]}{customer.lastName[0]}</span>
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium text-surface-900">{customer.firstName} {customer.lastName}</p>
								<p class="text-sm text-surface-500">{customer.email}</p>
							</div>
							<div class="text-right text-sm text-surface-500">
								{customer.policyCount} policies
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-surface-900">Recent Claims</h2>
				<a href="/agent/claims" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
					View all
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
			
			{#if data.recentClaims.length === 0}
				<div class="text-center py-8 text-surface-500">
					<AlertTriangle class="w-12 h-12 mx-auto mb-3 text-surface-300" />
					<p>No claims yet</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.recentClaims as claim}
						<div class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors">
							<div class="flex-1 min-w-0">
								<p class="font-medium text-surface-900">{claim.claimNumber}</p>
								<p class="text-sm text-surface-500">{claim.user?.firstName} {claim.user?.lastName}</p>
							</div>
							<div class="text-right">
								<p class="font-medium text-surface-900">${claim.amountClaimed.toLocaleString()}</p>
								<span class="badge {claim.status === 'approved' ? 'badge-success' : claim.status === 'denied' ? 'badge-error' : 'badge-warning'}">
									{claim.status}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

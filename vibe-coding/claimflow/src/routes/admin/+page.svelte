<script lang="ts">
	import { Users, FileText, AlertTriangle, DollarSign, ArrowRight, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-svelte';
	
	let { data } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
		<p class="text-surface-600 mt-1">System overview and management console</p>
	</div>
	
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Total Users</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.totalUsers}</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<Users class="w-6 h-6 text-blue-600" />
				</div>
			</div>
			<div class="mt-2 text-sm text-surface-500">
				{data.stats.usersByRole.policyholder} policyholders
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
			<div class="mt-2 text-sm text-surface-500">
				${(data.stats.totalCoverage / 1000000).toFixed(1)}M total coverage
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
			<div class="mt-2 text-sm text-surface-500">
				{data.stats.pendingUnderwriter} pending underwriter
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Total Payouts (YTD)</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">${(data.stats.totalPayouts / 1000).toFixed(0)}K</p>
				</div>
				<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
					<DollarSign class="w-6 h-6 text-primary-600" />
				</div>
			</div>
			<div class="mt-2 text-sm text-surface-500">
				{data.stats.paidClaims} claims paid
			</div>
		</div>
	</div>
	
	<div class="grid lg:grid-cols-3 gap-6">
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Users by Role</h3>
			<div class="space-y-3">
				{#each Object.entries(data.stats.usersByRole) as [role, count]}
					<div class="flex items-center justify-between">
						<span class="capitalize text-surface-700">{role}</span>
						<span class="font-medium text-surface-900">{count}</span>
					</div>
				{/each}
			</div>
		</div>
		
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Claims by Status</h3>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Clock class="w-4 h-4 text-yellow-500" />
						<span class="text-surface-700">Pending</span>
					</div>
					<span class="font-medium text-surface-900">{data.stats.claimsByStatus.pending}</span>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<CheckCircle class="w-4 h-4 text-green-500" />
						<span class="text-surface-700">Approved/Paid</span>
					</div>
					<span class="font-medium text-surface-900">{data.stats.claimsByStatus.approved}</span>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<XCircle class="w-4 h-4 text-red-500" />
						<span class="text-surface-700">Denied</span>
					</div>
					<span class="font-medium text-surface-900">{data.stats.claimsByStatus.denied}</span>
				</div>
			</div>
		</div>
		
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h3>
			<div class="space-y-2">
				<a href="/admin/users" class="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors">
					<span class="font-medium">Manage Users</span>
					<ArrowRight class="w-5 h-5 text-surface-400" />
				</a>
				<a href="/admin/claims" class="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors">
					<span class="font-medium">View All Claims</span>
					<ArrowRight class="w-5 h-5 text-surface-400" />
				</a>
				<a href="/admin/analytics" class="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors">
					<span class="font-medium">Analytics Dashboard</span>
					<ArrowRight class="w-5 h-5 text-surface-400" />
				</a>
			</div>
		</div>
	</div>
</div>

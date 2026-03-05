<script lang="ts">
	import { AlertTriangle, Clock, CheckCircle, XCircle, FileText, ArrowRight, Users, DollarSign } from 'lucide-svelte';
	import { format } from 'date-fns';
	
	let { data } = $props();
	
	const statusColors: Record<string, string> = {
		submitted: 'badge-info',
		under_review: 'badge-warning',
		needs_info: 'badge-warning',
		pending_underwriter: 'badge-info',
		approved: 'badge-success',
		denied: 'badge-error',
		paid: 'badge-success',
		closed: 'badge-neutral'
	};

	const priorityColors: Record<string, string> = {
		low: 'bg-surface-100 text-surface-600',
		medium: 'bg-blue-100 text-blue-700',
		high: 'bg-orange-100 text-orange-700',
		urgent: 'bg-red-100 text-red-700'
	};
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Claims Adjuster Dashboard</h1>
		<p class="text-surface-600 mt-1">Welcome back, {data.user.firstName}! Here's your claims overview.</p>
	</div>
	
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Assigned Claims</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.assignedClaims}</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<FileText class="w-6 h-6 text-blue-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Pending Review</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.pendingReview}</p>
				</div>
				<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
					<Clock class="w-6 h-6 text-yellow-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Approved This Month</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">{data.stats.approvedThisMonth}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<CheckCircle class="w-6 h-6 text-green-600" />
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-surface-500">Total Payout</p>
					<p class="text-2xl font-bold text-surface-900 mt-1">${(data.stats.totalPayout / 1000).toFixed(0)}K</p>
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
				<h2 class="text-lg font-semibold text-surface-900">Claims Requiring Action</h2>
				<a href="/adjuster/claims" class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
					View all
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
			
			{#if data.urgentClaims.length === 0}
				<div class="text-center py-8 text-surface-500">
					<CheckCircle class="w-12 h-12 mx-auto mb-3 text-green-300" />
					<p>No urgent claims at the moment!</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.urgentClaims as claim}
						<a href="/adjuster/claims/{claim.id}" class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors border border-surface-100">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<p class="font-medium text-surface-900">{claim.claimNumber}</p>
									<span class="badge {priorityColors[claim.priority]}">{claim.priority}</span>
								</div>
								<p class="text-sm text-surface-500 truncate mt-0.5">{claim.user?.firstName} {claim.user?.lastName} • {claim.policy?.type}</p>
							</div>
							<div class="text-right">
								<p class="font-medium text-surface-900">${claim.amountClaimed.toLocaleString()}</p>
								<span class="badge {statusColors[claim.status]}">{claim.status.replace('_', ' ')}</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
		
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-surface-900">Recent Activity</h2>
			</div>
			
			{#if data.recentActivity.length === 0}
				<div class="text-center py-8 text-surface-500">
					<Clock class="w-12 h-12 mx-auto mb-3 text-surface-300" />
					<p>No recent activity</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each data.recentActivity as activity}
						<div class="flex gap-3">
							<div class="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
							<div>
								<p class="text-sm text-surface-900">{activity.content}</p>
								<p class="text-xs text-surface-500 mt-0.5">{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

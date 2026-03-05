<script lang="ts">
	import { page } from '$app/stores';
	import { Shield, LayoutDashboard, FileText, AlertTriangle, MessageSquare, Settings, LogOut, Menu, X, Bell, User, ChevronDown, Users, TrendingUp, CheckSquare, ClipboardList, RefreshCw, BarChart3, Layers } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';
	import type { User as UserType } from '$lib/server/db/schema';
	
	interface Props {
		user: UserType;
		children: Snippet;
	}
	
	let { user, children }: Props = $props();
	
	let sidebarOpen = $state(false);
	let userMenuOpen = $state(false);
	let notificationsOpen = $state(false);

	const roleLabels: Record<string, string> = {
		policyholder: 'Policyholder',
		adjuster: 'Claims Adjuster',
		agent: 'Agent/Broker',
		underwriter: 'Underwriter',
		admin: 'Administrator'
	};

	const navigationByRole: Record<string, { name: string; href: string; icon: typeof LayoutDashboard }[]> = {
		policyholder: [
			{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
			{ name: 'My Policies', href: '/policies', icon: FileText },
			{ name: 'My Claims', href: '/claims', icon: AlertTriangle },
			{ name: 'Messages', href: '/messages', icon: MessageSquare },
		],
		adjuster: [
			{ name: 'Dashboard', href: '/adjuster', icon: LayoutDashboard },
			{ name: 'My Claims', href: '/adjuster/claims', icon: AlertTriangle },
			{ name: 'All Claims', href: '/adjuster/all-claims', icon: ClipboardList },
			{ name: 'Messages', href: '/messages', icon: MessageSquare },
			{ name: 'Batch Ops', href: '/admin/batch', icon: Layers },
		],
		agent: [
			{ name: 'Dashboard', href: '/agent', icon: LayoutDashboard },
			{ name: 'Customers', href: '/agent/customers', icon: Users },
			{ name: 'Policies', href: '/agent/policies', icon: FileText },
			{ name: 'Claims', href: '/agent/claims', icon: AlertTriangle },
			{ name: 'Commissions', href: '/agent/commissions', icon: TrendingUp },
		],
		underwriter: [
			{ name: 'Dashboard', href: '/underwriter', icon: LayoutDashboard },
			{ name: 'Pending Review', href: '/underwriter/claims', icon: CheckSquare },
			{ name: 'Renewals', href: '/underwriter/renewals', icon: RefreshCw },
			{ name: 'Policies', href: '/underwriter/policies', icon: FileText },
			{ name: 'Risk Assessment', href: '/underwriter/risk', icon: TrendingUp },
		],
		admin: [
			{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
			{ name: 'Users', href: '/admin/users', icon: Users },
			{ name: 'Claims', href: '/admin/claims', icon: AlertTriangle },
			{ name: 'Batch Ops', href: '/admin/batch', icon: Layers },
			{ name: 'Policies', href: '/admin/policies', icon: FileText },
			{ name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
		]
	};

	const navigation = $derived(navigationByRole[user.role] || navigationByRole.policyholder);
	
	function isActive(href: string) {
		const basePaths = ['/dashboard', '/adjuster', '/agent', '/underwriter', '/admin'];
		if (basePaths.includes(href)) {
			return $page.url.pathname === href;
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="min-h-screen bg-surface-50">
	<aside class="fixed inset-y-0 left-0 z-50 w-64 bg-surface-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}">
		<div class="flex h-16 items-center gap-2 px-6 border-b border-surface-700">
			<div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
				<Shield class="w-5 h-5 text-white" />
			</div>
			<span class="text-lg font-bold text-white">ClaimFlow</span>
		</div>
		
		<div class="px-4 py-3 border-b border-surface-700">
			<p class="text-xs text-surface-400 uppercase tracking-wider">Logged in as</p>
			<p class="text-sm text-white font-medium mt-0.5">{roleLabels[user.role]}</p>
		</div>
		
		<nav class="p-4 space-y-1">
			{#each navigation as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors {isActive(item.href) ? 'bg-primary-600 text-white' : 'text-surface-300 hover:bg-surface-800 hover:text-white'}"
				>
					<item.icon class="w-5 h-5" />
					<span class="font-medium">{item.name}</span>
				</a>
			{/each}
		</nav>
		
		<div class="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-700">
			<a href="/settings" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
				<Settings class="w-5 h-5" />
				<span class="font-medium">Settings</span>
			</a>
			<form method="POST" action="/auth/logout" use:enhance>
				<button type="submit" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
					<LogOut class="w-5 h-5" />
					<span class="font-medium">Log Out</span>
				</button>
			</form>
		</div>
	</aside>
	
	{#if sidebarOpen}
		<div 
			class="fixed inset-0 bg-black/50 z-40 lg:hidden"
			onclick={() => sidebarOpen = false}
			onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
			role="button"
			tabindex="-1"
		></div>
	{/if}

	<div class="lg:pl-64">
		<header class="sticky top-0 z-30 bg-white border-b border-surface-200">
			<div class="flex h-16 items-center justify-between px-4 sm:px-6">
				<button
					class="lg:hidden p-2 -ml-2 text-surface-500 hover:text-surface-700"
					onclick={() => sidebarOpen = !sidebarOpen}
				>
					{#if sidebarOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
				
				<div class="flex-1 lg:flex-none"></div>
				
				<div class="flex items-center gap-4">
					<button 
						class="relative p-2 text-surface-500 hover:text-surface-700 transition-colors"
						onclick={() => notificationsOpen = !notificationsOpen}
					>
						<Bell class="w-5 h-5" />
						<span class="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
					</button>
					
					<div class="relative">
						<button
							class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
							onclick={() => userMenuOpen = !userMenuOpen}
						>
							<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
								<User class="w-4 h-4 text-primary-600" />
							</div>
							<span class="hidden sm:block text-sm font-medium text-surface-700">
								{user.firstName} {user.lastName}
							</span>
							<ChevronDown class="w-4 h-4 text-surface-400" />
						</button>
						
						{#if userMenuOpen}
							<div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-surface-200 py-1 z-50">
								<div class="px-4 py-2 border-b border-surface-100">
									<p class="text-sm font-medium text-surface-900">{user.firstName} {user.lastName}</p>
									<p class="text-xs text-surface-500">{user.email}</p>
									<p class="text-xs text-primary-600 mt-1">{roleLabels[user.role]}</p>
								</div>
								<a href="/settings" class="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50">Settings</a>
								<form method="POST" action="/auth/logout" use:enhance>
									<button type="submit" class="w-full text-left px-4 py-2 text-sm text-surface-700 hover:bg-surface-50">Log Out</button>
								</form>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</header>
		
		<main class="p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>

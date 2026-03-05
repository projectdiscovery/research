<script lang="ts">
	import { Users, Search, Plus, Edit, Trash2, Check, X, Shield } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	
	let searchQuery = $state('');
	let roleFilter = $state('all');
	let showCreateModal = $state(false);
	let editingUser = $state<typeof data.users[0] | null>(null);
	let loading = $state(false);

	const roleLabels: Record<string, string> = {
		policyholder: 'Policyholder',
		adjuster: 'Claims Adjuster',
		agent: 'Agent/Broker',
		underwriter: 'Underwriter',
		admin: 'Administrator'
	};

	const roleColors: Record<string, string> = {
		policyholder: 'bg-blue-100 text-blue-700',
		adjuster: 'bg-yellow-100 text-yellow-700',
		agent: 'bg-green-100 text-green-700',
		underwriter: 'bg-purple-100 text-purple-700',
		admin: 'bg-red-100 text-red-700'
	};

	let filteredUsers = $derived(
		data.users.filter(user => {
			const matchesSearch = 
				user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === 'all' || user.role === roleFilter;
			return matchesSearch && matchesRole;
		})
	);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">User Management</h1>
			<p class="text-surface-600 mt-1">Manage all users in the system</p>
		</div>
		<button class="btn-primary flex items-center gap-2" onclick={() => showCreateModal = true}>
			<Plus class="w-5 h-5" />
			Add User
		</button>
	</div>
	
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
			{form.error}
		</div>
	{/if}
	
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
			User updated successfully!
		</div>
	{/if}
	
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
			<input
				type="text"
				placeholder="Search users..."
				class="input pl-10"
				bind:value={searchQuery}
			/>
		</div>
		<select class="input w-auto" bind:value={roleFilter}>
			<option value="all">All Roles</option>
			<option value="policyholder">Policyholders</option>
			<option value="adjuster">Adjusters</option>
			<option value="agent">Agents</option>
			<option value="underwriter">Underwriters</option>
			<option value="admin">Admins</option>
		</select>
	</div>
	
	<div class="bg-white rounded-xl border border-surface-200 overflow-hidden">
		<table class="w-full">
			<thead class="bg-surface-50 border-b border-surface-200">
				<tr>
					<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">User</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase hidden sm:table-cell">Email</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase">Role</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase hidden md:table-cell">Status</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-surface-100">
				{#each filteredUsers as user}
					<tr class="hover:bg-surface-50">
						<td class="px-4 py-4">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
									<span class="text-primary-600 font-medium">{user.firstName[0]}{user.lastName[0]}</span>
								</div>
								<div>
									<p class="font-medium text-surface-900">{user.firstName} {user.lastName}</p>
									<p class="text-sm text-surface-500 sm:hidden">{user.email}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-4 hidden sm:table-cell text-surface-600">{user.email}</td>
						<td class="px-4 py-4">
							<span class="badge {roleColors[user.role]}">{roleLabels[user.role]}</span>
						</td>
						<td class="px-4 py-4 hidden md:table-cell">
							{#if user.isActive}
								<span class="badge badge-success">Active</span>
							{:else}
								<span class="badge badge-error">Inactive</span>
							{/if}
						</td>
						<td class="px-4 py-4">
							<div class="flex items-center gap-2">
								<button 
									class="p-1.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
									onclick={() => editingUser = user}
								>
									<Edit class="w-4 h-4" />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Create New User</h3>
			
			<form method="POST" action="?/createUser" class="space-y-4" use:enhance={() => {
				loading = true;
				return async ({ update, result }) => {
					loading = false;
					if (result.type === 'success') {
						showCreateModal = false;
					}
					await update();
				};
			}}>
				<div class="grid sm:grid-cols-2 gap-4">
					<div>
						<label class="label">First Name</label>
						<input type="text" name="firstName" class="input" required />
					</div>
					<div>
						<label class="label">Last Name</label>
						<input type="text" name="lastName" class="input" required />
					</div>
				</div>
				
				<div>
					<label class="label">Email</label>
					<input type="email" name="email" class="input" required />
				</div>
				
				<div>
					<label class="label">Password</label>
					<input type="password" name="password" class="input" required minlength="8" />
				</div>
				
				<div>
					<label class="label">Role</label>
					<select name="role" class="input" required>
						<option value="policyholder">Policyholder</option>
						<option value="adjuster">Claims Adjuster</option>
						<option value="agent">Agent/Broker</option>
						<option value="underwriter">Underwriter</option>
						<option value="admin">Administrator</option>
					</select>
				</div>
				
				<div>
					<label class="label">Phone (Optional)</label>
					<input type="tel" name="phone" class="input" />
				</div>
				
				<div class="flex gap-3 pt-2">
					<button type="button" class="btn-secondary flex-1" onclick={() => showCreateModal = false}>
						Cancel
					</button>
					<button type="submit" class="btn-primary flex-1" disabled={loading}>
						{loading ? 'Creating...' : 'Create User'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if editingUser}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Edit User</h3>
			
			<form method="POST" action="?/updateUser" class="space-y-4" use:enhance={() => {
				loading = true;
				return async ({ update, result }) => {
					loading = false;
					if (result.type === 'success') {
						editingUser = null;
					}
					await update();
				};
			}}>
				<input type="hidden" name="userId" value={editingUser.id} />
				
				<div class="grid sm:grid-cols-2 gap-4">
					<div>
						<label class="label">First Name</label>
						<input type="text" name="firstName" class="input" value={editingUser.firstName} required />
					</div>
					<div>
						<label class="label">Last Name</label>
						<input type="text" name="lastName" class="input" value={editingUser.lastName} required />
					</div>
				</div>
				
				<div>
					<label class="label">Email</label>
					<input type="email" name="email" class="input" value={editingUser.email} required />
				</div>
				
				<div>
					<label class="label">Role</label>
					<select name="role" class="input" value={editingUser.role} required>
						<option value="policyholder">Policyholder</option>
						<option value="adjuster">Claims Adjuster</option>
						<option value="agent">Agent/Broker</option>
						<option value="underwriter">Underwriter</option>
						<option value="admin">Administrator</option>
					</select>
				</div>
				
				<div>
					<label class="label">Status</label>
					<select name="isActive" class="input" required>
						<option value="true" selected={editingUser.isActive}>Active</option>
						<option value="false" selected={!editingUser.isActive}>Inactive</option>
					</select>
				</div>
				
				<div class="flex gap-3 pt-2">
					<button type="button" class="btn-secondary flex-1" onclick={() => editingUser = null}>
						Cancel
					</button>
					<button type="submit" class="btn-primary flex-1" disabled={loading}>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

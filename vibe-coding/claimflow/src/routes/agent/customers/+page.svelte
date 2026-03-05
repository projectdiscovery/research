<script lang="ts">
	import { Users, Search, Plus, Mail, Phone, FileText, ArrowRight, Edit, User } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	
	let searchQuery = $state('');
	let showAddModal = $state(false);
	let loading = $state(false);

	let filteredCustomers = $derived(
		data.customers.filter(customer => {
			return customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				customer.email.toLowerCase().includes(searchQuery.toLowerCase());
		})
	);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-surface-900">My Customers</h1>
			<p class="text-surface-600 mt-1">Manage your assigned policyholders</p>
		</div>
		<button class="btn-primary flex items-center gap-2" onclick={() => showAddModal = true}>
			<Plus class="w-5 h-5" />
			Add Customer
		</button>
	</div>
	
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
			{form.error}
		</div>
	{/if}
	
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
			Customer added successfully!
		</div>
	{/if}
	
	<div class="relative">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
		<input
			type="text"
			placeholder="Search customers..."
			class="input pl-10"
			bind:value={searchQuery}
		/>
	</div>
	
	{#if filteredCustomers.length === 0}
		<div class="card text-center py-12">
			<Users class="w-16 h-16 mx-auto text-surface-300 mb-4" />
			<h3 class="text-lg font-medium text-surface-900">No Customers Found</h3>
			<p class="text-surface-600 mt-1">
				{searchQuery ? 'Try adjusting your search' : 'Add your first customer to get started'}
			</p>
		</div>
	{:else}
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredCustomers as customer}
				<div class="card hover:shadow-md transition-shadow">
					<div class="flex items-start gap-3 mb-4">
						<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
							<span class="text-primary-600 font-medium text-lg">{customer.firstName[0]}{customer.lastName[0]}</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="font-semibold text-surface-900 truncate">{customer.firstName} {customer.lastName}</p>
							<p class="text-sm text-surface-500 truncate">{customer.email}</p>
						</div>
					</div>
					
					<div class="space-y-2 text-sm mb-4">
						{#if customer.phone}
							<div class="flex items-center gap-2 text-surface-600">
								<Phone class="w-4 h-4" />
								<span>{customer.phone}</span>
							</div>
						{/if}
						<div class="flex items-center gap-2 text-surface-600">
							<FileText class="w-4 h-4" />
							<span>{customer.policyCount} policies</span>
						</div>
					</div>
					
					<div class="flex gap-2">
						<a href="/agent/customers/{customer.id}" class="btn-secondary flex-1 text-center text-sm">
							View Details
						</a>
						<a href="/agent/claims?customer={customer.id}&action=new" class="btn-primary flex-1 text-center text-sm">
							File Claim
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showAddModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Add New Customer</h3>
			
			<form method="POST" action="?/addCustomer" class="space-y-4" use:enhance={() => {
				loading = true;
				return async ({ update, result }) => {
					loading = false;
					if (result.type === 'success') {
						showAddModal = false;
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
					<p class="text-xs text-surface-500 mt-1">Temporary password for the customer</p>
				</div>
				
				<div>
					<label class="label">Phone (Optional)</label>
					<input type="tel" name="phone" class="input" />
				</div>
				
				<div>
					<label class="label">Address (Optional)</label>
					<input type="text" name="address" class="input" placeholder="Street address" />
				</div>
				
				<div class="grid sm:grid-cols-3 gap-4">
					<div>
						<label class="label">City</label>
						<input type="text" name="city" class="input" />
					</div>
					<div>
						<label class="label">State</label>
						<input type="text" name="state" class="input" />
					</div>
					<div>
						<label class="label">ZIP</label>
						<input type="text" name="zipCode" class="input" />
					</div>
				</div>
				
				<div class="flex gap-3 pt-2">
					<button type="button" class="btn-secondary flex-1" onclick={() => showAddModal = false}>
						Cancel
					</button>
					<button type="submit" class="btn-primary flex-1" disabled={loading}>
						{loading ? 'Adding...' : 'Add Customer'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

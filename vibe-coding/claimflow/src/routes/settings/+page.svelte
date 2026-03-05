<script lang="ts">
	import { User, Mail, Phone, MapPin, Lock, Bell, Shield } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	
	let { data, form } = $props();
	
	let loading = $state(false);
	let activeTab = $state('profile');
</script>

<div class="max-w-3xl mx-auto space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-surface-900">Settings</h1>
		<p class="text-surface-600 mt-1">Manage your account settings and preferences</p>
	</div>
	
	<div class="flex gap-2 border-b border-surface-200">
		<button 
			class="px-4 py-2 font-medium text-sm transition-colors {activeTab === 'profile' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-surface-600 hover:text-surface-900'}"
			onclick={() => activeTab = 'profile'}
		>
			Profile
		</button>
		<button 
			class="px-4 py-2 font-medium text-sm transition-colors {activeTab === 'security' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-surface-600 hover:text-surface-900'}"
			onclick={() => activeTab = 'security'}
		>
			Security
		</button>
		<button 
			class="px-4 py-2 font-medium text-sm transition-colors {activeTab === 'notifications' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-surface-600 hover:text-surface-900'}"
			onclick={() => activeTab = 'notifications'}
		>
			Notifications
		</button>
	</div>
	
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
			{form.error}
		</div>
	{/if}
	
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
			Settings updated successfully!
		</div>
	{/if}
	
	{#if activeTab === 'profile'}
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Personal Information</h3>
			
			<form method="POST" action="?/updateProfile" class="space-y-4" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}>
				<div class="grid sm:grid-cols-2 gap-4">
					<div>
						<label class="label">First Name</label>
						<input type="text" name="firstName" class="input" value={data.user.firstName} required />
					</div>
					<div>
						<label class="label">Last Name</label>
						<input type="text" name="lastName" class="input" value={data.user.lastName} required />
					</div>
				</div>
				
				<div>
					<label class="label">Email</label>
					<input type="email" class="input bg-surface-50" value={data.user.email} disabled />
					<p class="text-xs text-surface-500 mt-1">Contact support to change your email address</p>
				</div>
				
				<div>
					<label class="label">Phone</label>
					<input type="tel" name="phone" class="input" value={data.user.phone || ''} />
				</div>
				
				<div>
					<label class="label">Address</label>
					<input type="text" name="address" class="input" value={data.user.address || ''} placeholder="Street address" />
				</div>
				
				<div class="grid sm:grid-cols-3 gap-4">
					<div>
						<label class="label">City</label>
						<input type="text" name="city" class="input" value={data.user.city || ''} />
					</div>
					<div>
						<label class="label">State</label>
						<input type="text" name="state" class="input" value={data.user.state || ''} />
					</div>
					<div>
						<label class="label">ZIP Code</label>
						<input type="text" name="zipCode" class="input" value={data.user.zipCode || ''} />
					</div>
				</div>
				
				<div class="pt-2">
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	{/if}
	
	{#if activeTab === 'security'}
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Change Password</h3>
			
			<form method="POST" action="?/changePassword" class="space-y-4" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}>
				<div>
					<label class="label">Current Password</label>
					<input type="password" name="currentPassword" class="input" required />
				</div>
				
				<div>
					<label class="label">New Password</label>
					<input type="password" name="newPassword" class="input" required minlength="8" />
					<p class="text-xs text-surface-500 mt-1">At least 8 characters</p>
				</div>
				
				<div>
					<label class="label">Confirm New Password</label>
					<input type="password" name="confirmPassword" class="input" required />
				</div>
				
				<div class="pt-2">
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Updating...' : 'Update Password'}
					</button>
				</div>
			</form>
		</div>
		
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Active Sessions</h3>
			<p class="text-surface-600 text-sm mb-4">Manage your logged-in sessions across devices.</p>
			
			<div class="border border-surface-200 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium text-surface-900">Current Session</p>
						<p class="text-sm text-surface-500">Last active: Now</p>
					</div>
					<span class="badge badge-success">Active</span>
				</div>
			</div>
		</div>
	{/if}
	
	{#if activeTab === 'notifications'}
		<div class="card">
			<h3 class="text-lg font-semibold text-surface-900 mb-4">Notification Preferences</h3>
			
			<div class="space-y-4">
				<div class="flex items-center justify-between py-3 border-b border-surface-100">
					<div>
						<p class="font-medium text-surface-900">Claim Status Updates</p>
						<p class="text-sm text-surface-500">Get notified when your claim status changes</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" class="sr-only peer" checked />
						<div class="w-11 h-6 bg-surface-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
					</label>
				</div>
				
				<div class="flex items-center justify-between py-3 border-b border-surface-100">
					<div>
						<p class="font-medium text-surface-900">Document Requests</p>
						<p class="text-sm text-surface-500">Get notified when additional documents are needed</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" class="sr-only peer" checked />
						<div class="w-11 h-6 bg-surface-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
					</label>
				</div>
				
				<div class="flex items-center justify-between py-3 border-b border-surface-100">
					<div>
						<p class="font-medium text-surface-900">New Messages</p>
						<p class="text-sm text-surface-500">Get notified when you receive a new message</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" class="sr-only peer" checked />
						<div class="w-11 h-6 bg-surface-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
					</label>
				</div>
				
				<div class="flex items-center justify-between py-3">
					<div>
						<p class="font-medium text-surface-900">Policy Reminders</p>
						<p class="text-sm text-surface-500">Get reminded before your policy expires</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" class="sr-only peer" checked />
						<div class="w-11 h-6 bg-surface-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
					</label>
				</div>
			</div>
		</div>
	{/if}
</div>

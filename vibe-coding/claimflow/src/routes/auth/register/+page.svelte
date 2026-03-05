<script lang="ts">
	import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	
	let { form } = $props();
	
	let showPassword = $state(false);
	let loading = $state(false);
</script>

<div class="min-h-screen bg-surface-50 flex">
	<div class="hidden lg:flex lg:w-1/2 bg-primary-600 p-12 flex-col justify-between">
		<div class="flex items-center gap-2">
			<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
				<div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
					<Shield class="w-6 h-6 text-white" />
				</div>
				<span class="text-xl font-bold text-white">ClaimFlow</span>
			</a>
		</div>
		
		<div>
			<h1 class="text-4xl font-bold text-white mb-4">Get started today</h1>
			<p class="text-primary-100 text-lg">
				Create your account to manage policies, file claims, and stay connected with your insurance team.
			</p>
			
			<div class="mt-8 space-y-4">
				<div class="flex items-center gap-3 text-primary-100">
					<div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>
					<span>Easy claim filing in minutes</span>
				</div>
				<div class="flex items-center gap-3 text-primary-100">
					<div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>
					<span>Real-time status tracking</span>
				</div>
				<div class="flex items-center gap-3 text-primary-100">
					<div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">✓</div>
					<span>Direct communication with adjusters</span>
				</div>
			</div>
		</div>
		
		<div class="text-primary-200 text-sm">
			&copy; 2024 ClaimFlow. All rights reserved.
		</div>
	</div>
	
	<div class="w-full lg:w-1/2 flex items-center justify-center p-8">
		<div class="w-full max-w-md">
			<div class="lg:hidden mb-6">
				<a href="/" class="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-6">
					<ArrowLeft class="w-5 h-5" />
					<span>Back to home</span>
				</a>
				<div class="flex items-center gap-2 justify-center">
					<div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
						<Shield class="w-6 h-6 text-white" />
					</div>
					<span class="text-xl font-bold text-surface-900">ClaimFlow</span>
				</div>
			</div>
			
			<div class="hidden lg:block mb-6">
				<a href="/" class="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors">
					<ArrowLeft class="w-5 h-5" />
					<span>Back to home</span>
				</a>
			</div>
			
			<h2 class="text-2xl font-bold text-surface-900 mb-2">Create your account</h2>
			<p class="text-surface-600 mb-8">
				Already have an account? <a href="/auth/login" class="text-primary-600 hover:text-primary-700 font-medium">Sign in</a>
			</p>
			
			{#if form?.error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
					<AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
					<p class="text-red-700 text-sm">{form.error}</p>
				</div>
			{/if}
			
			<form method="POST" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}>
				<div class="space-y-5">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="firstName" class="label">First name</label>
							<input
								type="text"
								id="firstName"
								name="firstName"
								required
								class="input"
								placeholder="John"
								value={form?.firstName ?? ''}
							/>
						</div>
						<div>
							<label for="lastName" class="label">Last name</label>
							<input
								type="text"
								id="lastName"
								name="lastName"
								required
								class="input"
								placeholder="Doe"
								value={form?.lastName ?? ''}
							/>
						</div>
					</div>
					
					<div>
						<label for="email" class="label">Email address</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							class="input"
							placeholder="you@example.com"
							value={form?.email ?? ''}
						/>
					</div>
					
					<div>
						<label for="phone" class="label">Phone number <span class="text-surface-400">(optional)</span></label>
						<input
							type="tel"
							id="phone"
							name="phone"
							class="input"
							placeholder="555-123-4567"
							value={form?.phone ?? ''}
						/>
					</div>
					
					<div>
						<label for="password" class="label">Password</label>
						<div class="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								required
								minlength="8"
								class="input pr-12"
								placeholder="Create a password"
							/>
							<button
								type="button"
								class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
								onclick={() => showPassword = !showPassword}
							>
								{#if showPassword}
									<EyeOff class="w-5 h-5" />
								{:else}
									<Eye class="w-5 h-5" />
								{/if}
							</button>
						</div>
						<p class="text-xs text-surface-500 mt-1">Must be at least 8 characters</p>
					</div>
					
					<div>
						<label class="flex items-start gap-2 cursor-pointer">
							<input type="checkbox" name="terms" required class="w-4 h-4 mt-0.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
							<span class="text-sm text-surface-600">
								I agree to the <a href="#" class="text-primary-600 hover:underline">Terms of Service</a> and <a href="#" class="text-primary-600 hover:underline">Privacy Policy</a>
							</span>
						</label>
					</div>
					
					<button type="submit" class="btn-primary w-full py-3" disabled={loading}>
						{#if loading}
							<span class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						{:else}
							Create Account
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

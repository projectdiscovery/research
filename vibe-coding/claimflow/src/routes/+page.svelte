<script lang="ts">
	import { Shield, FileText, MessageSquare, Clock, CheckCircle, Users, ArrowRight, ChevronRight } from 'lucide-svelte';
	
	let { data } = $props();
</script>

<div class="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
	<header class="bg-white/80 backdrop-blur-sm border-b border-surface-200 sticky top-0 z-50">
		<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16 items-center">
				<div class="flex items-center gap-2">
					<div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
						<Shield class="w-6 h-6 text-white" />
					</div>
					<span class="text-xl font-bold text-surface-900">ClaimFlow</span>
				</div>
				<div class="hidden md:flex items-center gap-8">
					<a href="#features" class="text-surface-600 hover:text-surface-900 transition-colors">Features</a>
					<a href="#how-it-works" class="text-surface-600 hover:text-surface-900 transition-colors">How It Works</a>
					<a href="#contact" class="text-surface-600 hover:text-surface-900 transition-colors">Contact</a>
				</div>
				<div class="flex items-center gap-4">
					{#if data.user}
						<a href="/dashboard" class="btn-primary flex items-center gap-2">
							Dashboard
							<ArrowRight class="w-4 h-4" />
						</a>
					{:else}
						<a href="/auth/login" class="text-surface-600 hover:text-surface-900 font-medium transition-colors">Log In</a>
						<a href="/auth/register" class="btn-primary">Get Started</a>
					{/if}
				</div>
			</div>
		</nav>
	</header>

	<main>
		<section class="py-20 lg:py-32">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="text-center max-w-4xl mx-auto">
					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 leading-tight">
						Streamline Your
						<span class="text-primary-600"> Insurance Claims</span>
					</h1>
					<p class="mt-6 text-xl text-surface-600 max-w-2xl mx-auto">
						File claims faster, track progress in real-time, and communicate seamlessly with your insurance team — all in one place.
					</p>
					<div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
						<a href="/auth/register" class="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2">
							Start Free Trial
							<ArrowRight class="w-5 h-5" />
						</a>
						<a href="#how-it-works" class="btn-secondary text-lg px-8 py-3">
							Learn More
						</a>
					</div>
				</div>
				
				<div class="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
					<div>
						<div class="text-3xl font-bold text-primary-600">50K+</div>
						<div class="text-surface-600 mt-1">Claims Processed</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-primary-600">98%</div>
						<div class="text-surface-600 mt-1">Satisfaction Rate</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-primary-600">24hrs</div>
						<div class="text-surface-600 mt-1">Avg. Response Time</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-primary-600">10K+</div>
						<div class="text-surface-600 mt-1">Active Users</div>
					</div>
				</div>
			</div>
		</section>

		<section id="features" class="py-20 bg-white">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="text-center mb-16">
					<h2 class="text-3xl sm:text-4xl font-bold text-surface-900">Everything You Need</h2>
					<p class="mt-4 text-lg text-surface-600 max-w-2xl mx-auto">
						Powerful features designed to make insurance claims management effortless
					</p>
				</div>
				
				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					<div class="card hover:shadow-md transition-shadow">
						<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
							<FileText class="w-6 h-6 text-primary-600" />
						</div>
						<h3 class="text-xl font-semibold text-surface-900 mb-2">Easy Claim Filing</h3>
						<p class="text-surface-600">
							Submit claims in minutes with our intuitive form. Upload photos, documents, and descriptions all in one place.
						</p>
					</div>
					
					<div class="card hover:shadow-md transition-shadow">
						<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
							<Clock class="w-6 h-6 text-primary-600" />
						</div>
						<h3 class="text-xl font-semibold text-surface-900 mb-2">Real-Time Tracking</h3>
						<p class="text-surface-600">
							Follow your claim status every step of the way. Get instant notifications when there are updates.
						</p>
					</div>
					
					<div class="card hover:shadow-md transition-shadow">
						<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
							<MessageSquare class="w-6 h-6 text-primary-600" />
						</div>
						<h3 class="text-xl font-semibold text-surface-900 mb-2">Direct Communication</h3>
						<p class="text-surface-600">
							Message your claims adjuster directly. No more phone tag or lost emails — everything in one thread.
						</p>
					</div>
					
					<div class="card hover:shadow-md transition-shadow">
						<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
							<Shield class="w-6 h-6 text-primary-600" />
						</div>
						<h3 class="text-xl font-semibold text-surface-900 mb-2">Policy Management</h3>
						<p class="text-surface-600">
							View all your policies in one dashboard. Access coverage details, documents, and payment history.
						</p>
					</div>
					
					<div class="card hover:shadow-md transition-shadow">
						<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
							<CheckCircle class="w-6 h-6 text-primary-600" />
						</div>
						<h3 class="text-xl font-semibold text-surface-900 mb-2">Fast Approvals</h3>
						<p class="text-surface-600">
							Our streamlined process means faster claim reviews and quicker payouts when you need them most.
						</p>
					</div>
					
					<div class="card hover:shadow-md transition-shadow">
						<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
							<Users class="w-6 h-6 text-primary-600" />
						</div>
						<h3 class="text-xl font-semibold text-surface-900 mb-2">Expert Support</h3>
						<p class="text-surface-600">
							Our dedicated team of adjusters and agents are here to help you through every step of the process.
						</p>
					</div>
				</div>
			</div>
		</section>

		<section id="how-it-works" class="py-20 bg-surface-50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="text-center mb-16">
					<h2 class="text-3xl sm:text-4xl font-bold text-surface-900">How It Works</h2>
					<p class="mt-4 text-lg text-surface-600 max-w-2xl mx-auto">
						Filing a claim has never been easier. Follow these simple steps.
					</p>
				</div>
				
				<div class="grid md:grid-cols-4 gap-8">
					<div class="text-center">
						<div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
							1
						</div>
						<h3 class="text-lg font-semibold text-surface-900 mb-2">Create Account</h3>
						<p class="text-surface-600">Sign up and link your insurance policies to your account.</p>
					</div>
					
					<div class="text-center">
						<div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
							2
						</div>
						<h3 class="text-lg font-semibold text-surface-900 mb-2">File a Claim</h3>
						<p class="text-surface-600">Describe the incident and upload supporting documents.</p>
					</div>
					
					<div class="text-center">
						<div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
							3
						</div>
						<h3 class="text-lg font-semibold text-surface-900 mb-2">Track Progress</h3>
						<p class="text-surface-600">Monitor your claim status and respond to any requests.</p>
					</div>
					
					<div class="text-center">
						<div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
							4
						</div>
						<h3 class="text-lg font-semibold text-surface-900 mb-2">Get Paid</h3>
						<p class="text-surface-600">Receive your approved claim payment quickly and securely.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="py-20 bg-primary-600">
			<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
				<p class="text-primary-100 text-lg mb-8">
					Join thousands of customers who trust ClaimFlow for their insurance needs.
				</p>
				<a href="/auth/register" class="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
					Create Free Account
					<ChevronRight class="w-5 h-5" />
				</a>
			</div>
		</section>
	</main>

	<footer id="contact" class="bg-surface-900 text-surface-300 py-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid md:grid-cols-4 gap-8">
				<div>
					<div class="flex items-center gap-2 mb-4">
						<div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
							<Shield class="w-5 h-5 text-white" />
						</div>
						<span class="text-lg font-bold text-white">ClaimFlow</span>
					</div>
					<p class="text-sm">
						Making insurance claims simple, transparent, and fast.
					</p>
				</div>
				
				<div>
					<h4 class="text-white font-semibold mb-4">Product</h4>
					<ul class="space-y-2 text-sm">
						<li><a href="#features" class="hover:text-white transition-colors">Features</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Pricing</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Security</a></li>
					</ul>
				</div>
				
				<div>
					<h4 class="text-white font-semibold mb-4">Company</h4>
					<ul class="space-y-2 text-sm">
						<li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Press</a></li>
					</ul>
				</div>
				
				<div>
					<h4 class="text-white font-semibold mb-4">Support</h4>
					<ul class="space-y-2 text-sm">
						<li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Contact Us</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Privacy Policy</a></li>
					</ul>
				</div>
			</div>
			
			<div class="border-t border-surface-700 mt-8 pt-8 text-sm text-center">
				<p>&copy; 2024 ClaimFlow. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>

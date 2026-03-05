<script lang="ts">
	import '../app.css';
	
	let { children, data } = $props();
</script>

<svelte:head>
	<title>ClaimFlow - Insurance Claims Management</title>
	<meta name="description" content="Professional insurance claims management system" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}

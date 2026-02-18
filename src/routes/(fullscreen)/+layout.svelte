<script lang="ts">
	import './../layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import InitializationGuard from '$lib/stremio/InitializationGuard.svelte';
	import MobileGuard from '$lib/components/mobileGuard.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<InitializationGuard>
	<MobileGuard>
		<div class="min-h-screen bg-background text-white">
			{@render children()}
		</div>
	</MobileGuard>
</InitializationGuard>

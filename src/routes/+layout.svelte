<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import InitializationGuard from '$lib/stremio/InitializationGuard.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<InitializationGuard>
	<nav class="flex items-center gap-4 p-4">
		<h1 class="font-bold text-2xl">JLK</h1>
		<a class="border px-2" href="/auth">Auth</a>
		<a class="border px-2" href="/addons">Addons</a>
		<a class="border px-2" href="/discover">Discovery</a>
		<a class="border px-2" href="/meta">Meta</a>
	</nav>
	<div class="p-4">
		{@render children()}
	</div>
</InitializationGuard>

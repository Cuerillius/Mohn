<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import InitializationGuard from '$lib/stremio/InitializationGuard.svelte';
	import { House, IdCard, Package, Search } from 'lucide-svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<InitializationGuard>
	<div class="min-h-screen bg-background text-white">
		<nav
			class="sticky top-4 z-1000 mx-12 flex items-center gap-4 rounded-xl border border-border p-2 backdrop-blur-md"
		>
			<a class="text-2xl font-bold" href="/">JLK</a>
			<a class="flex items-center gap-2 rounded-md p-2 hover:bg-muted" href="/"><House /> Home</a>
			<a class="flex items-center gap-2 rounded-md p-2 hover:bg-muted" href="/search"
				><Search /> Search</a
			>
			<a class="flex items-center gap-2 rounded-md p-2 hover:bg-muted" href="/auth"
				><IdCard />Auth</a
			>
			<a class="flex items-center gap-2 rounded-md p-2 hover:bg-muted" href="/addons"
				><Package />Addons</a
			>
		</nav>
		{@render children()}
	</div>
</InitializationGuard>

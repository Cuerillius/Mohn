<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import InitializationGuard from '$lib/stremio/InitializationGuard.svelte';
	import { House, Package, User } from 'lucide-svelte';
	import Logo from '$lib/assets/logo.svelte';
	import SearchComponent from '$lib/components/search.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<InitializationGuard>
	<div class="min-h-screen bg-background text-white">
		<nav
			class="fixed inset-x-12 top-4 z-1000 flex items-center gap-4 rounded-xl border border-border bg-background/40 px-4 py-2 backdrop-blur-xl"
		>
			<a href="/">
				<Logo class="h-14 w-14" />
			</a>

			<a class="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50" href="/"><House /> Home</a
			>

			<a class="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50" href="/addons"
				><Package />Addons</a
			>
			<div class="flex-1"></div>

			<SearchComponent />

			<a
				class="flex items-center gap-2 rounded-full border border-border bg-muted/70 p-2 hover:bg-muted/50"
				href="/auth"><User /></a
			>
		</nav>

		{@render children()}
	</div>
</InitializationGuard>

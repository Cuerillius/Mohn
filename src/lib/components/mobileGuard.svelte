<script lang="ts">
	import { OctagonAlert } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Button from './ui/button/button.svelte';
	import EmptyState from './emptyState.svelte';
	let { children } = $props();

	let isDesktop = $state(true);
	let forceShow = $state(false);

	onMount(() => {
		const mql = window.matchMedia('(min-width: 640px)');
		isDesktop = mql.matches;

		const handler = (e: MediaQueryListEvent) => (isDesktop = e.matches);
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	});
</script>

{#if isDesktop || forceShow}
	{@render children()}
{:else}
	<EmptyState
		icon={OctagonAlert}
		layout="fullscreen"
		title="Mobile is currently not supported"
		description="Unfortunately, it is currently only designed for desktop or larger screens. So for a pleasant experience, please use a desktop device or tablet."
	>
		<Button onclick={() => (forceShow = true)}>Proceed anyway</Button>
	</EmptyState>
{/if}

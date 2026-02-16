<script lang="ts">
	import { OctagonAlert } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Button from './ui/button/button.svelte';
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
	<div class="flex h-dvh w-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div class="rounded-lg border p-3">
				<OctagonAlert class="h-8 w-8" />
			</div>
		<h1 class="text-xl font-bold">Mobile is currently not supported</h1>
		<p class="text-balance text-sm text-gray-500">
			Unfortunatly, it is currently only designed for desktop or larger screens. So for a plesant experience, please use a desktop device or tablet.
		</p>
         <Button 
            onclick={() => forceShow = true}
        >
            Proceed anyway
    </Button>
	</div>
{/if}
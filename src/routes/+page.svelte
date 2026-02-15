<script lang="ts">
	import { board } from '$lib/stremio/store/board';
	import { onMount, onDestroy } from 'svelte';
	import Catalog from '$lib/components/catalog.svelte';
	import HeroCaroussel from '$lib/components/heroCaroussel.svelte';
	import HeroCarousselSkeleton from '$lib/components/skeletons/heroCaroussel.svelte';

	let sentinel: HTMLElement;
	let observer: IntersectionObserver;

	const ITEMS_PER_PAGE = 5;
	let currentOffset = 0;

	function loadMore() {
		board.loadRange(currentOffset, currentOffset + ITEMS_PER_PAGE);
		currentOffset += ITEMS_PER_PAGE;
	}

	onMount(() => {
		board.initialLoad();
		loadMore();
		observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting) {
					loadMore();
				}
			},
			{
				rootMargin: '400px'
			}
		);

		if (sentinel) {
			observer.observe(sentinel);
		}
	});

	onDestroy(() => {
		if (observer) observer.disconnect();
		board.unload();
	});
	let heroIndex = $derived($board.catalogs?.findIndex((c) => c.content?.type === 'Ready') ?? -1);
</script>

<div class="relative flex flex-col gap-8">
	{#if heroIndex !== -1 && $board.catalogs?.[heroIndex]}
		<HeroCaroussel catalog={$board.catalogs[heroIndex]} />
	{:else}
		<HeroCarousselSkeleton />
	{/if}

	{#each $board.catalogs as catalog, i}
		{#if i !== heroIndex}
			<Catalog {catalog} />
		{/if}
	{/each}

	<div bind:this={sentinel} class="h-4"></div>
</div>

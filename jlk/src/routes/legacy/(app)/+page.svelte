<script lang="ts">
	import { board } from '$lib/stremio/store/board';
	import { onMount, onDestroy } from 'svelte';
	import Catalog from '$lib/components/catalog.svelte';
	import HeroCaroussel from '$lib/components/heroCaroussel.svelte';
	import HeroCarousselSkeleton from '$lib/components/skeletons/heroCaroussel.svelte';
	import { library } from '$lib/stremio/store/library';
	import CatalogSkeleton from '$lib/components/skeletons/catalog.svelte';
	import { Bookmark } from 'lucide-svelte';

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
		library.load(null);
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
	});
	let heroIndex = $derived($board.catalogs?.findIndex((c) => c.content?.type !== 'Err') ?? -1);
</script>

<div class="relative flex flex-col gap-8">
	{#if heroIndex !== -1 && $board.catalogs?.[heroIndex] && $board.catalogs[heroIndex].content?.type === 'Ready'}
		<HeroCaroussel catalog={$board.catalogs[heroIndex]} />
	{:else}
		<HeroCarousselSkeleton />
	{/if}

	{#if $library.catalog}
		<Catalog
			catalog={$library.catalog.slice(0, 10)}
			name="Watch Later"
			type={null}
			icon={Bookmark}
		/>
	{/if}
	{#each $board.catalogs as catalog, i}
		{#if i !== heroIndex}
			{#if catalog?.content}
				{#if catalog.content.type === 'Loading'}
					<CatalogSkeleton />
				{:else if catalog.content.type === 'Ready'}
					<Catalog
						catalog={catalog.content.content}
						name={catalog.name}
						type={catalog.type}
						addon={catalog.addon}
					/>
				{/if}
			{/if}
		{/if}
	{/each}

	<div bind:this={sentinel} class="h-4"></div>
</div>

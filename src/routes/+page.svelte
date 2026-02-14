<script lang="ts">
	import { board } from '$lib/stremio/store/board';
	import { onMount, onDestroy } from 'svelte';

	import Catalog from '$lib/components/catalog.svelte';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import Image from '$lib/components/image.svelte';
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
	});
</script>

<div class="flex flex-col gap-8">
	{#if $board.catalogs?.[0]?.content?.type === 'Err'}
		<p class="px-20 text-red-500">Failed to load the first catalog.</p>
	{/if}
	{#each $board.catalogs?.splice(1) as catalog}
		<Catalog {catalog} />
	{/each}
	<div bind:this={sentinel}></div>
</div>

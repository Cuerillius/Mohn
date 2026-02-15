<script lang="ts">
	import { localSearch } from '$lib/stremio/store/localSearch';
	import { search } from '$lib/stremio/store/search';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';
	import Catalog from '$lib/components/catalog.svelte';

	let query = $derived(page.url.searchParams.get('query') ?? '');

	$effect(() => {
		if (query) {
			search.initialLoad(query);
			search.loadRange(0, 5);
		}
	});

	onMount(() => {
		if (query) {
			search.initialLoad(query);
			search.loadRange(0, 5);
		}
	});

	onDestroy(() => {
		search.unload();
		localSearch.unload();
	});
</script>

<div class="flex flex-col gap-4 px-20 py-26">
	{#if $search?.catalogs}
		{#each $search.catalogs as catalog}
			<Catalog {catalog} />
		{/each}
	{/if}
</div>

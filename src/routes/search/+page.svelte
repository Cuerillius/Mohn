<script lang="ts">
	import { goto } from '$app/navigation';
	import { localSearch } from '$lib/stremio/store/localSearch';
	import { search } from '$lib/stremio/store/search';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Catalog from '$lib/components/catalog.svelte';

	let query = $derived(page.url.searchParams.get('query') ?? '');

	$effect(() => {
		if (query) {
			search.initialLoad(query);
			search.loadRange(0, 5);
		}
	});
	search.subscribe((value) => {
		console.log('Search store updated:', value);
	});
	localSearch.subscribe((value) => {
		console.log('Local Search store updated:', value);
	});

	onMount(() => {
		if (query) {
			search.initialLoad(query);
			search.loadRange(0, 5);
		}
	});
</script>

<div class="flex flex-col gap-4 px-20 py-26">
	{#if $search?.catalogs}
		{#each $search.catalogs as catalog}
			<Catalog {catalog} />
		{/each}
	{/if}
</div>

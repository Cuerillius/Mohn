<script lang="ts">
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
			{#if catalog.content && catalog.content.type === 'Ready'}
				<Catalog catalog={catalog.content.content} name={catalog.name} type={catalog.type} />
			{/if}
		{/each}
	{/if}
</div>

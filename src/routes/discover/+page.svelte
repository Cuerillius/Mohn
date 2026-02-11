<script lang="ts">
	import { discover } from '$lib/stremio/store/discover';
	discover.subscribe((value) => {
		console.log('Discover store updated:', value);
	});
</script>

<div class="flex flex-col gap-4 border p-4">
	{#if $discover?.catalogs}
		{#each $discover.catalogs.selectable?.catalogs as catalog}
			<div class="border p-4">
				<p>{catalog.name}</p>
				<p>{catalog.addon.manifest.name}</p>
				<button class="border px-1" onclick={() => discover.load(catalog)}>Load</button>
			</div>
		{/each}
		<p>Selected:</p>
		{#if $discover.catalogs.catalog}
			{#if $discover.catalogs.catalog.content.type === 'Err'}
				<p>Error!</p>
			{:else if $discover.catalogs.catalog.content.type === 'Loading'}
				<p>Loading...</p>
			{:else}
				{#each $discover.catalogs.catalog.content.content as catalogItem}
					<div class="border p-4">
						<p>{catalogItem.name}</p>
					</div>
				{/each}
			{/if}
		{/if}
	{/if}
</div>

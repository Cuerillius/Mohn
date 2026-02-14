<script lang="ts">
	import { goto } from '$app/navigation';
	import { search } from '$lib/stremio/store/search';

	let query = $state('');
	search.subscribe((value) => {
		console.log('Search store updated:', value);
	});
	function onClick() {
		search.initialLoad(query);
		search.loadRange(0, 5);
	}

	function onClick2(id: string, type: string) {
		goto(`/meta/${type}/${id}`);
	}
</script>

<div class="flex flex-col gap-4">
	<input bind:value={query} />
	<button onclick={onClick}>Search</button>
	{#if $search?.catalogs}
		{#each $search.catalogs as catalog}
			<div class="border p-4">
				<p>{catalog.name}</p>
				{#if catalog?.content}
					<div class="flex gap-4">
						{#if catalog.content.type === 'Err'}
							<p>Error!</p>
						{:else if catalog.content.type === 'Loading'}
							<p>Loading...</p>
						{:else}
							{#each catalog.content.content as entry}
								<div class="border p-4">
									<p>{entry.name}</p>
									<button class="border px-2" onclick={() => onClick2(entry.id, entry.type)}
										>meta</button
									>
								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

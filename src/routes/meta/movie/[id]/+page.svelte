<script lang="ts">
	import { goto } from '$app/navigation';
	import { meta } from '$lib/stremio/store/meta';
	import { stream } from '$lib/stremio/store/player';
	import { onMount } from 'svelte';

	const { data } = $props();
	meta.subscribe((value) => {
		console.log('Meta store updated:', value);
	});
	function selectStream(selectedStream: Stream) {
		stream.set(selectedStream);
		goto('/player');
	}

	onMount(() => {
		meta.loadStream(data.id, 'movie');
	});
</script>

<div class="flex flex-col gap-4 border p-4">
	{#if $meta?.details}
		<div class="border p-4">
			{#if $meta.details.content.type === 'Err'}
				<p>Error!</p>
			{:else if $meta.details.content.type === 'Loading'}
				<p>Loading...</p>
			{:else}
				<h1>{$meta.details.content.content.name}</h1>
				<p>{$meta.details.content.content.description}</p>
				<img src={$meta.details.content.content.logo} alt="" class="w-32" />
			{/if}
		</div>
	{/if}
	<div class="flex flex-col gap-4 border p-4">
		<h1>Streams</h1>
		{#each $meta?.streams as metaItem}
			<div class="flex flex-col gap-4 border p-4">
				<p>{metaItem.addon.manifest.name}</p>
				{#if metaItem?.content}
					{#if metaItem.content.type === 'Err'}
						<p>Error!</p>
					{:else if metaItem.content.type === 'Loading'}
						<p>Loading...</p>
					{:else}
						{#each metaItem.content.content as metaItemItem}
							<div class="border p-4">
								<p>{metaItemItem.name}</p>
								<p>{metaItemItem.description}</p>
								<button onclick={() => selectStream(metaItemItem)}>Select</button>
							</div>
						{/each}
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>

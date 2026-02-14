<script lang="ts">
	import { goto } from '$app/navigation';
	import { meta } from '$lib/stremio/store/meta';
	import { onMount } from 'svelte';

	const { data } = $props();
	meta.subscribe((value) => {
		console.log('Meta store updated:', value);
	});
	function onClick(episodeId: string) {
		goto(`/meta/series/${data.id}/${episodeId}`);
	}

	onMount(() => {
		meta.loadMeta(data.id, 'series');
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
		{#if $meta?.details?.content.type === 'Err'}
			<p>Error!</p>
		{:else if $meta?.details?.content.type === 'Loading'}
			<p>Loading...</p>
		{:else}
			{#each $meta?.details?.content.content.videos as metaItem}
				<p>{metaItem.title}</p>
				<button onclick={() => onClick(metaItem.id)}>meta</button>
			{/each}
		{/if}
	</div>
</div>

<script lang="ts">
	import Image from '$lib/components/image.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { meta } from '$lib/stremio/store/meta';
	import { Star } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Streams from '$lib/components/streams.svelte';
	const { data } = $props();

	meta.subscribe((value) => {
		console.log('Meta store updated:', value);
	});

	onMount(() => {
		meta.loadStream(data.id, 'movie');
	});
</script>

<div class="flex flex-col gap-4">
	{#if $meta?.details}
		{#if $meta.details.content.type === 'Err'}
			<p>Error!</p>
		{:else if $meta.details.content.type === 'Loading'}
			<p>Loading...</p>
		{:else}
			<div class="relative h-screen w-full">
				<div
					class="absolute inset-x-0 top-0 z-10 h-60 bg-linear-to-b from-background/50 via-background/20 to-transparent"
				></div>
				<div
					class="absolute inset-y-0 left-0 z-10 w-48 bg-linear-to-r from-background to-transparent opacity-80"
				></div>
				<div
					class="absolute inset-y-0 right-0 z-10 w-48 bg-linear-to-l from-background to-transparent opacity-80"
				></div>

				<div
					class="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_bottom,transparent_20%,hsl(var(--background))_100%)] opacity-90"
				></div>

				<div
					class="absolute inset-x-0 bottom-0 z-30 h-1/2 bg-linear-to-t from-background via-background/40 to-transparent"
				></div>
				<div
					class="absolute right-0 bottom-0 left-0 h-2/4 bg-linear-to-t from-background to-transparent"
				></div>
				<Image
					src={$meta.details.content.content.background}
					alt={$meta.details.content.content.name}
					class="h-full w-full object-cover"
				/>
				<div class="absolute bottom-1/6 left-20 z-40 max-w-2xl">
					<Image
						src={$meta.details.content.content.logo}
						alt={$meta.details.content.content.name}
						class=" w-min-20 h-48 rounded-xl"
					/>
					<div class="mt-1 flex gap-2">
						{#each $meta.details.content.content.links as link}
							{#if link.category === 'Genres'}
								<Badge variant="outline" class="px-4 py-2 backdrop-blur-lg">{link.name}</Badge>
							{:else if link.category === 'imdb'}
								<Badge variant="outline" class="px-4 py-2 backdrop-blur-lg"
									><Star color="yellow" fill="currentColor" />{link.name}</Badge
								>
							{/if}
						{/each}
					</div>

					<p class="my-6 w-120 text-gray-300">{$meta.details.content.content.description}</p>
				</div>
			</div>
		{/if}
	{/if}
	<Streams streams={$meta?.streams ?? []} />
</div>

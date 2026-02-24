<script lang="ts">
	import Image from '$lib/components/image.svelte';
	import { meta } from '$lib/stremio/store/meta';
	import { auth } from '$lib/stremio/store/auth';
	import { Bookmark, Pause, Play } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Streams from '$lib/components/streams.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import ImageVignete from '$lib/components/imageVignete.svelte';
	import DetailBlock from '$lib/components/detailBlock.svelte';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import DetailBlockSkeleton from '$lib/components/skeletons/detailBlock.svelte';
	import SeriesSeasons from '$lib/components/seriesSeasons.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { library } from '$lib/stremio/store/library.js';

	const { data } = $props();

	let selectedEpisode = $state<string | null>(null);
	let iframeElement = $state<HTMLIFrameElement | undefined>();
	let isImmersiveMode = $state(false);
	let initialClicked = $state(false);
	let isPlaying = $state(false);
	let isSidebarOpen = $derived(!isImmersiveMode && selectedEpisode !== null);

	$effect(() => {
		if (selectedEpisode) {
			meta.loadStream(data.id, selectedEpisode, 'series');
		}
	});

	onMount(() => {
		meta.loadMeta(data.id, 'series');
	});

	function sendCommand(action: 'playVideo' | 'pauseVideo') {
		if (!iframeElement || !iframeElement.contentWindow) return;

		iframeElement.contentWindow.postMessage(
			JSON.stringify({
				event: 'command',
				func: action,
				args: []
			}),
			'*'
		);
	}
	function togglePlay() {
		if (isPlaying) {
			sendCommand('pauseVideo');
		} else {
			sendCommand('playVideo');
		}
		isPlaying = !isPlaying;
	}
</script>

<div class="flex flex-col gap-4">
	{#if $meta?.details}
		{#if $meta.details.content.type === 'Err'}
			<div
				class="flex h-screen w-screen flex-col content-center items-center justify-center gap-4 p-8"
			>
				<h1 class="text-4xl font-bold">Something went wrong</h1>
				<p class="text-xl">The requested movie could not be loaded.</p>
				<a href="/" class="flex items-center gap-1 text-gray-500"
					><ArrowLeft class="h-4 w-4" /> Go back to home</a
				>
			</div>
		{:else if $meta.details.content.type === 'Loading'}
			<Skeleton class="absolute inset-0 h-full w-full rounded-none" />
			<div class="absolute bottom-20 left-20 z-40 w-full max-w-2xl space-y-6">
				<DetailBlockSkeleton />
				<div class="flex gap-6 pt-4">
					<Skeleton class="h-14 w-48 rounded-xl" />
					<Skeleton class="h-14 w-40 rounded-xl" />
				</div>
			</div>
		{:else}
			<div class="relative h-screen w-full">
				<ImageVignete />
				<div class="absolute inset-0 h-full w-full object-cover">
					{#if isImmersiveMode || initialClicked}
						<iframe
							bind:this={iframeElement}
							class="h-full w-full object-cover"
							src="https://www.youtube.com/embed/{$meta.details.content.content.trailerStreams[0]
								.ytId}?autoplay=1&disablekb&controls=0&enablejsapi=1&showinfo=0&iv_load_policy=3&loop=1&fs=0"
							frameborder="0"
							title={$meta.details.content.content.name + ' Trailer'}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							referrerpolicy="strict-origin-when-cross-origin"
							allowfullscreen
						></iframe>
						{#if !isImmersiveMode}
							<div class="absolute bottom-0 z-40 h-40 w-full bg-background"></div>
							<div
								class="absolute bottom-40 z-40 h-30 w-full bg-linear-to-t from-background via-background/40 to-transparent"
							></div>
						{/if}
					{:else}
						<Image
							class="h-full w-full object-cover"
							src={$meta.details.content.content.background}
							alt={$meta.details.content.content.name}
						/>
					{/if}
				</div>
				<div class="absolute bottom-20 left-20 z-40 max-w-2xl">
					{#if !isImmersiveMode}
						<DetailBlock item={$meta.details.content.content} />
					{/if}
					<div class="flex gap-6">
						<Button
							disabled={$meta.details.content.content.trailerStreams.length === 0}
							class="p-6"
							onclick={() => {
								((isImmersiveMode = !isImmersiveMode), (initialClicked = true), togglePlay());
							}}
							>{#if isImmersiveMode}<Pause />Pause Trailer{:else}<Play />Watch Trailer{/if}</Button
						>
						<Button
							disabled={!$auth.isLoggedIn}
							variant="outline"
							class="p-6"
							onclick={(e) => {
								e.stopPropagation();
								if ($meta?.details?.content?.type === 'Ready') {
									$meta.details?.content.content.inLibrary
										? library.removeFromLibrary($meta.details.content.content.id)
										: library.addToLibrary($meta.details.content.content);
								}
							}}
							><Bookmark
								fill={$meta.details.content.content.inLibrary ? 'currentColor' : 'none'}
							/>Watch Later</Button
						>
					</div>
				</div>
			</div>
			<div class={isSidebarOpen ? 'pr-120' : 'pr-0'}>
				<SeriesSeasons episodes={$meta.details.content.content.videos} bind:selectedEpisode />
			</div>
		{/if}
	{/if}
	{#if !isImmersiveMode && selectedEpisode}
		<div class="fixed top-0 right-0 bottom-0 z-50">
			<Streams streams={$meta?.streams ?? []} />
		</div>
	{/if}
</div>

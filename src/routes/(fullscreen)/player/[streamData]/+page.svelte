<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Seekbar from '$lib/components/seekbar.svelte';
	import { ChevronLeft, OctagonAlert } from 'lucide-svelte';

	import { decodeStream } from '$lib/streamCoder';
	import VideoControlles from '$lib/components/videoControlles.svelte';
	import EmptyState from '$lib/components/emptyState.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Loader from '$lib/components/loader.svelte';
	import { createVideoStore } from '$lib/stremio/store/video';

	const video = createVideoStore();
	let container = $state<HTMLDivElement>();
	let showUI = $state(true);
	let hideTimeout: ReturnType<typeof setTimeout>;

	let decodedStream = $derived(decodeStream(page.params.streamData));

	const resetHideTimer = () => {
		showUI = true;
		clearTimeout(hideTimeout);
		hideTimeout = setTimeout(() => {
			showUI = false;
		}, 3000);
	};

	onMount(() => {
		if (container) {
			video.init(container);
		}

		if (decodedStream) {
			video.loadStream(decodedStream);
		}

		const handleKeydown = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault();
				$video.paused ? video.play() : video.pause();
			}
		};

		const handleMouseMove = () => {
			resetHideTimer();
		};

		window.addEventListener('keydown', handleKeydown);
		container?.addEventListener('mousemove', handleMouseMove);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			container?.removeEventListener('mousemove', handleMouseMove);
			clearTimeout(hideTimeout);
		};
	});
</script>

{#if !decodedStream}
	<EmptyState
		icon={OctagonAlert}
		layout="fullscreen"
		title="Stream not found"
		titleClass="text-4xl font-bold"
		description="The stream you are trying to access is not available. It might have been removed or is temporarily unavailable. Please check back later or try a different stream."
	>
		<a href="/" class="flex items-center gap-1 text-gray-500 transition-colors hover:text-white">
			<ArrowLeft class="h-4 w-4" /> Go back to home
		</a>
	</EmptyState>
{:else if $video.hasError}
	<EmptyState
		icon={OctagonAlert}
		layout="fullscreen"
		title="Playback Error"
		titleClass="text-4xl font-bold"
		description="An error occurred while trying to play the stream. This could be due to a network issue, an unsupported format, or a problem with the stream source. Please try refreshing the page, checking your network connection, or selecting a different stream."
	>
		<button
			onclick={() => window.history.back()}
			class="flex items-center gap-1 text-gray-500 transition-colors hover:text-white"
		>
			<ArrowLeft class="h-4 w-4" /> Go back
		</button>
	</EmptyState>
{:else}
	<div
		onclick={() => {
			$video.paused ? video.play() : video.pause();
		}}
		onmousemove={resetHideTimer}
		bind:this={container}
		role="button"
		tabindex="0"
		aria-label="Video player"
		class="fixed inset-0 z-0 flex h-screen w-screen items-center justify-center bg-black"
	></div>

	{#if !$video.loaded || $video.buffering}
		<div
			class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm"
		>
			<Loader text="Loading stream..." />
		</div>
	{/if}

	<div
		class="absolute top-4 left-4 z-50 transition-opacity duration-300"
		class:opacity-0={!showUI}
		class:pointer-events-none={!showUI}
	>
		<button
			onclick={() => history.back()}
			class="rounded-xl border border-white/10 bg-black/40 p-4 text-white shadow-2xl backdrop-blur-lg transition-colors hover:bg-black/60"
			aria-label="Go back"
		>
			<ChevronLeft class="h-8 w-8" />
		</button>
	</div>

	<div
		class="absolute right-4 bottom-4 left-4 z-50 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/60 p-3 shadow-2xl backdrop-blur-xl transition-opacity duration-300"
		class:opacity-0={!showUI}
		class:pointer-events-none={!showUI}
	>
		<Seekbar
			time={$video.time}
			duration={$video.duration}
			buffered={$video.buffered}
			updateTime={(newTime) => video.setTime(newTime)}
		/>

		<VideoControlles
			paused={$video.paused}
			volume={$video.volume}
			muted={$video.muted}
			subtitleTracks={$video.subtitlesTracks}
			audioTracks={$video.audioTracks}
			selectedSubtitle={$video.selectedSubtitlesTrackId}
			selectedAudioTrack={$video.selectedAudioTrackId}
			setVolume={(v) => video.volume(v)}
			toggleMute={() => video.muted(!$video.muted)}
			selectAudioTrack={(id) => video.setAudioTrack(id)}
			selectSubtitleTrack={(id) => video.setSubtitlesTrack(id)}
			play={() => video.play()}
			pause={() => video.pause()}
		/>
	</div>
{/if}

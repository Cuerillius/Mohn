<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Seekbar from '$lib/components/seekbar.svelte';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		AudioLines,
		Captions,
		CaptionsOff,
		ChevronLeft,
		Maximize,
		Pause,
		Play,
		Volume1,
		Volume2,
		VolumeOff
	} from 'lucide-svelte';

	import { video, videoState } from '$lib/stremio/store/video';
	import { toggleFullscreen } from '$lib/stremio/store/fullscreen';
	import { decodeStream } from '$lib/streamCoder';

	let container = $state<HTMLDivElement>();
	let showUI = $state(true);
	let hideTimeout: ReturnType<typeof setTimeout>;

	let decodedStream = $derived(decodeStream($page.params.streamData));

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
				$videoState.paused ? video.play() : video.pause();
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

	let selectedAudioLabel = $derived(
		$videoState.audioTracks.find((t) => t.id === $videoState.selectedAudioTrackId)?.label ??
			'Default Audio'
	);

	let selectedSubtitleLabel = $derived(
		$videoState.subtitlesTracks.find((t) => t.id === $videoState.selectedSubtitlesTrackId)?.label ??
			'Default Subtitles'
	);
</script>

{#if !decodedStream}
	<div class="flex h-screen w-screen items-center justify-center bg-black text-white">
		<p>Invalid stream data</p>
	</div>
{:else}
	<div
		onclick={() => {
			$videoState.paused ? video.play() : video.pause();
		}}
		onmousemove={() => resetHideTimer()}
		bind:this={container}
		role="button"
		tabindex="0"
		aria-label="Video player"
		class="fixed inset-0 z-0 flex h-screen w-screen items-center justify-center bg-black"
	></div>

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
			time={$videoState.time}
			duration={$videoState.duration}
			buffered={$videoState.buffered}
			updateTime={(newTime) => video.setTime(newTime)}
		/>

		<div class="flex items-center justify-between text-white">
			<div class="flex items-center gap-4">
				<button
					onclick={() => ($videoState.paused ? video.play() : video.pause())}
					class="rounded-full p-2 transition-colors hover:bg-white/10"
				>
					{#if $videoState.paused}
						<Play class="h-6 w-6 fill-current" />
					{:else}
						<Pause class="h-6 w-6 fill-current" />
					{/if}
				</button>

				<div class="group flex items-center gap-3">
					<button
						onclick={() => video.muted(!$videoState.muted)}
						class="rounded-full p-2 transition-colors hover:bg-white/10"
					>
						{#if $videoState.muted || $videoState.volume === 0}
							<VolumeOff class="h-5 w-5" />
						{:else if $videoState.volume < 50}
							<Volume1 class="h-5 w-5" />
						{:else}
							<Volume2 class="h-5 w-5" />
						{/if}
					</button>

					<div class="w-24">
						<Slider
							type="single"
							value={$videoState.volume}
							max={100}
							onValueChange={(v) => video.volume(v as number)}
						/>
					</div>
				</div>
			</div>

			<div class="flex items-center gap-4">
				{#if $videoState.audioTracks.length > 0}
					<div class="flex items-center gap-2">
						<AudioLines class="h-5 w-5 text-white/70" />
						<Select.Root
							type="single"
							value={$videoState.selectedAudioTrackId || ''}
							onValueChange={(id) => video.setAudioTrack(id)}
						>
							<Select.Trigger
								class="h-8 min-w-25 border-none bg-transparent text-xs font-medium text-white shadow-none hover:bg-white/5 focus:ring-0"
							>
								{selectedAudioLabel}
							</Select.Trigger>
							<Select.Content class="max-h-50 overflow-y-auto">
								{#each $videoState.audioTracks as track}
									<Select.Item value={track.id} label={track.label}>
										{track.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				{#if $videoState.subtitlesTracks.length > 0}
					<div class="flex items-center gap-2">
						{#if $videoState.selectedSubtitlesTrackId}
							<Captions class="h-5 w-5" />
						{:else}
							<CaptionsOff class="h-5 w-5" />
						{/if}
						<Select.Root
							type="single"
							value={$videoState.selectedSubtitlesTrackId || ''}
							onValueChange={(id) => video.setSubtitlesTrack(id)}
						>
							<Select.Trigger
								class="h-8 min-w-25 border-none bg-transparent text-xs font-medium text-white shadow-none hover:bg-white/5 focus:ring-0"
							>
								{selectedSubtitleLabel}
							</Select.Trigger>
							<Select.Content class="max-h-50 overflow-y-auto">
								{#each $videoState.subtitlesTracks as track}
									<Select.Item value={track.id} label={track.label}>
										{track.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<button
					class="rounded-full p-2 transition-colors hover:bg-white/10"
					onclick={() => toggleFullscreen()}
				>
					<Maximize class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import Seekbar from '$lib/components/seekbar.svelte';
	import Slider from '$lib/components/ui/slider/slider.svelte';
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
		VolumeOff,
		VolumeX
	} from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { video, videoState } from '$lib/stremio/store/video';
	import { onMount } from 'svelte';
	import { toggleFullscreen } from '$lib/stremio/store/fullscreen';
	import { player, stream } from '$lib/stremio/store/player';

	let container: HTMLDivElement;

	onMount(() => {
		video.init(container)
		stream.subscribe((s) => {
			if(s){
				player.loadStream(s);
			}
		});
	});

	const getVolumeIcon = () => {
		if ($videoState.muted || $videoState.volume === 0) return VolumeX;
		if ($videoState.volume < 33) return VolumeOff;
		if ($videoState.volume < 66) return Volume1;
		return Volume2;
	};
</script>

<div
	class="absolute top-4 left-4 rounded-xl border bg-background/40 p-4 shadow-2xl backdrop-blur-lg"
>
	<ChevronLeft class="h-8 w-8" />
</div>

<div bind:this={container} class="video-holder"></div>

<div
	class="absolute right-4 bottom-4 left-4 rounded-xl border bg-background/40 p-2 px-3 shadow-2xl backdrop-blur-lg"
>
	<Seekbar
		time={$videoState.time}
		duration={$videoState.duration}
		buffered={$videoState.buffered}
		updateTime={(newTime: number) => video.setTime(newTime)}
	/>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<button
				onclick={() => {
					$videoState.paused ? video.play() : video.pause();
				}}
				class="rounded-full p-2 transition-colors"
			>
				{#if $videoState.paused}
					<Play class="h-6 w-6 fill-current" />
				{:else}
					<Pause class="h-6 w-6 fill-current" />
				{/if}
			</button>

			<div class="group flex items-center gap-2">
				<button
					onclick={() => video.muted(!$videoState.muted)}
					class="rounded-full p-2 transition-colors"
				>
					<svelte:component this={getVolumeIcon()} class="h-5 w-5" />
				</button>
				<div class="w-24">
					<Slider type="single" bind:value={$videoState.volume} max={100} step={1} />
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			{#if $videoState.audioTracks.length > 0}
				<div class="flex items-center gap-1">
					<AudioLines class="h-5 w-5" />
					<Select.Root type="single">
						<Select.Trigger class="h-8 border-none bg-transparent  text-xs  focus:ring-0">
							{$videoState.audioTracks.find((t) => t.id === $videoState.selectedAudioTrackId)
								?.label}
						</Select.Trigger>
						<Select.Content>
							{#each $videoState.audioTracks as track}
								<Select.Item value={track.id}>{track.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<!-- <div class="flex items-center gap-1">
				<button onclick={() => video.setSubtitlesEnabled(!subtitlesEnabled)}>
                    {#if subtitlesEnabled}
                        <Captions class="h-5 w-5 " />
                    {:else}
                        <CaptionsOff class="h-5 w-5 " />
                    {/if}
                </button>
				<Select.Root type="single" bind:value={$videoState.selectedSubtitlesTrackId}>
					<Select.Trigger class="h-8 border-none bg-transparent text-xs  focus:ring-0">
						{subtitlesTracks.find((t) => t.id === $videoState.selectedSubtitlesTrackId)?.label}
					</Select.Trigger>
					<Select.Content >
						{#each $videoState.subtitlesTracks as track}
							<Select.Item value={track.id}>{track.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div> -->

			<button class="rounded-full p-2" onclick={async () => toggleFullscreen()}>
				<Maximize class="h-5 w-5" />
			</button>
		</div>
	</div>
</div>

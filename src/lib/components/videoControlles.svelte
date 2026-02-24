<script lang="ts">
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		AudioLines,
		Captions,
		CaptionsOff,
		Maximize,
		Pause,
		Play,
		Volume1,
		Volume2,
		VolumeOff
	} from 'lucide-svelte';

	import { toggleFullscreen } from '$lib/stremio/store/fullscreen';

	let {
		paused,
		volume,
		muted,
		subtitleTracks,
		audioTracks,
		selectedSubtitle,
		selectedAudioTrack,
		setVolume,
		toggleMute,
		selectAudioTrack,
		selectSubtitleTrack,
		play,
		pause
	}: {
		paused: boolean;
		volume: number;
		muted: boolean;
		subtitleTracks: any[];
		audioTracks: any[];
		selectedSubtitle: string | null;
		selectedAudioTrack: string | null;
		setVolume: (volume: number) => void;
		toggleMute: () => void;
		selectAudioTrack: (id: string) => void;
		selectSubtitleTrack: (id: string) => void;
		play: () => void;
		pause: () => void;
	} = $props();

	let selectedAudioLabel = $derived(
		audioTracks.find((t) => t.id === selectedAudioTrack)?.label ?? 'Default Audio'
	);

	let selectedSubtitleLabel = $derived(
		subtitleTracks.find((t) => t.id === selectedSubtitle)?.label ?? 'Default Subtitles'
	);
</script>

<div class="flex items-center justify-between text-white">
	<div class="flex items-center gap-4">
		<button
			onclick={() => (paused ? play() : pause())}
			class="rounded-full p-2 transition-colors hover:bg-white/10"
		>
			{#if paused}
				<Play class="h-6 w-6 fill-current" />
			{:else}
				<Pause class="h-6 w-6 fill-current" />
			{/if}
		</button>

		<div class="group flex items-center gap-3">
			<button
				onclick={() => toggleMute()}
				class="rounded-full p-2 transition-colors hover:bg-white/10"
			>
				{#if muted || volume === 0}
					<VolumeOff class="h-5 w-5" />
				{:else if volume < 50}
					<Volume1 class="h-5 w-5" />
				{:else}
					<Volume2 class="h-5 w-5" />
				{/if}
			</button>

			<div class="w-24">
				<Slider
					type="single"
					value={volume}
					max={100}
					onValueChange={(v) => setVolume(v as number)}
				/>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-4">
		{#if audioTracks.length > 0}
			<div class="flex items-center gap-2">
				<AudioLines class="h-5 w-5 text-white/70" />
				<Select.Root
					type="single"
					value={selectedAudioTrack || ''}
					onValueChange={(id) => selectAudioTrack(id)}
				>
					<Select.Trigger
						class="h-8 min-w-25 border-none bg-transparent text-xs font-medium text-white shadow-none hover:bg-white/5 focus:ring-0"
					>
						{selectedAudioLabel}
					</Select.Trigger>
					<Select.Content class="max-h-50 overflow-y-auto">
						{#each audioTracks as track}
							<Select.Item value={track.id} label={track.label}>
								{track.label}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		{/if}

		{#if subtitleTracks.length > 0}
			<div class="flex items-center gap-2">
				{#if selectedSubtitle}
					<Captions class="h-5 w-5" />
				{:else}
					<CaptionsOff class="h-5 w-5" />
				{/if}
				<Select.Root
					type="single"
					value={selectedSubtitle || ''}
					onValueChange={(id) => selectSubtitleTrack(id)}
				>
					<Select.Trigger
						class="h-8 min-w-25 border-none bg-transparent text-xs font-medium text-white shadow-none hover:bg-white/5 focus:ring-0"
					>
						{selectedSubtitleLabel}
					</Select.Trigger>
					<Select.Content class="max-h-50 overflow-y-auto">
						{#each subtitleTracks as track}
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

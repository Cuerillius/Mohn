<script lang="ts">
	import { onMount } from 'svelte';
	import { stream, player } from '$lib/stremio/store/player';
	import { video, videoState } from '$lib/stremio/store/video';
	import { streamingServerUrls } from '$lib/stremio/store/streamingServerUrls';
	import * as Select from '$lib/components/ui/select/index.js';
	let container: HTMLDivElement;

	onMount(() => {
		video.init(container);
	});
</script>

<div class="player-wrapper">
	<div bind:this={container} class="video-holder"></div>

	<div class="controls z-10 font-light">
		{#if $stream}
			<button
				onclick={() => {
					(video.loadStream($stream), player.loadStream($stream));
				}}
			>
				load stream
			</button>
		{/if}
		<button
			onclick={() => {
				(video.play(), player.pauseChanged(false));
			}}
		>
			play
		</button>
		<button
			onclick={() => {
				(video.pause(), player.pauseChanged(true));
			}}
		>
			pause
		</button>
		<button
			onclick={() => {
				(video.volume(100),
					player.videoParamsChanged({
						manifest: null,
						stream: null,
						paused: null,
						time: null,
						duration: null,
						buffering: null,
						buffered: null,
						volume: null,
						muted: null,
						playbackSpeed: null,
						videoParams: null,
						audioTracks: [],
						selectedAudioTrackId: null,
						subtitlesTracks: [],
						selectedSubtitlesTrackId: null,
						subtitlesOffset: null,
						subtitlesSize: null,
						subtitlesTextColor: null,
						subtitlesBackgroundColor: null,
						subtitlesOutlineColor: null,
						extraSubtitlesTracks: [],
						selectedExtraSubtitlesTrackId: null,
						extraSubtitlesSize: null,
						extraSubtitlesDelay: null,
						extraSubtitlesOffset: null,
						extraSubtitlesTextColor: null,
						extraSubtitlesBackgroundColor: null,
						extraSubtitlesOutlineColor: null
					}));
			}}
		>
			volume</button
		>

		<button onclick={() => video.muted(false)}> unmute</button>
		<button onclick={() => video.muted(true)}> mute</button>
		<button
			onclick={() => {
				streamingServerUrls.addServerUrl('http://127.0.0.1:11470');
				streamingServerUrls.selectServerUrl('http://127.0.0.1:11470');
				streamingServerUrls.reloadServer();
			}}
		>
			streaming server</button
		>
		<input
			type="range"
			min="1"
			max="100"
			value="50"
			class="slider"
			onchange={(e) => video.volume(parseInt((e.target as HTMLInputElement).value))}
		/>
		<input
			class="w-full"
			type="range"
			min="0"
			max={$videoState.duration}
			value={$videoState.time}
			onchange={(e) => video.setTime(parseInt((e.target as HTMLInputElement).value))}
		/>
		{#each $videoState.audioTracks as track}
			<button
				onclick={() => video.setAudioTrack(track.id)}
				class:font-bold={$videoState.selectedAudioTrackId === track.id}
			>
				{track.label}
			</button>
		{/each}
		<div class="state-display">
			<pre>{JSON.stringify($videoState, null, 2)}</pre>
		</div>
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import { stream, player } from '$lib/stremio/store/player';
	import { video } from '$lib/stremio/store/video';
	import { streamingServer } from '$lib/stremio/store/streamingServer';
	import { streamingServerUrls } from '$lib/stremio/store/streamingServerUrls';
	let container: HTMLDivElement;
	onMount(() => {
		video.init(container);
	});

	player.subscribe((value) => {
		console.log('player store updated:', value);
	});

	streamingServer.subscribe((value) => {
		console.log('streamingServer store updated:', value);
	});

	streamingServerUrls.subscribe((value) => {
		console.log('streamingServerUrls store updated:', value);
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
	</div>
</div>

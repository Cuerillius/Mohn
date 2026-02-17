import { get, writable } from 'svelte/store';
import { getVideo } from '../video';
import { streamingServer } from './streamingServer';

const videoCore = await getVideo();

let videoContainer: HTMLDivElement;

const initialState = {
	manifest: null,
	stream: null,
	paused: true, // Default to true usually
	time: 0,
	duration: 0,
	buffering: false,
	buffered: 0,
	volume: 100,
	muted: false,
	playbackSpeed: 1,
	videoParams: null,
	audioTracks: [],
	selectedAudioTrackId: null,
	subtitlesTracks: [],
	selectedSubtitlesTrackId: null,
	subtitlesOffset: 0,
	subtitlesSize: 100,
	subtitlesTextColor: null,
	subtitlesBackgroundColor: null,
	subtitlesOutlineColor: null,
	extraSubtitlesTracks: [],
	selectedExtraSubtitlesTrackId: null,
	extraSubtitlesSize: 100,
	extraSubtitlesDelay: 0,
	extraSubtitlesOffset: 0,
	extraSubtitlesTextColor: null,
	extraSubtitlesBackgroundColor: null,
	extraSubtitlesOutlineColor: null,
	hasError: null
};

// 2. Create the Svelte Store
export const videoState = writable(initialState);

const updateState = (name: string, value: any) => {
	console.log('Updating video state:', name, value);
	videoState.update((s) => ({ ...s, [name]: value }));
};

export const video = {
	init: (el: HTMLDivElement) => {
		videoContainer = el;
	},

	loadStream: (stream: Stream) => {
		const currentStreamingServer = get(streamingServer);

		videoCore.dispatch(
			{
				type: 'command',
				commandName: 'load',
				commandArgs: {
					stream,
					autoplay: true,
					time: 0,
					forceTranscoding: true,
					streamingServerURL: currentStreamingServer?.url
				}
			},
			{ containerElement: videoContainer }
		);
	},

	play: () => {
		setProp('paused', false);
	},

	pause: () => {
		setProp('paused', true);
	},
	volume: (amount: number) => {
		setProp('volume', amount);
	},
	muted: (isMuted: boolean) => {
		setProp('muted', isMuted);
	},
	setPlaybackSpeed: (rate: number) => {
		setProp('playbackSpeed', rate);
	},
	setAudioTrack: (id: string) => setProp('selectedAudioTrackId', id),
	setTime: (time: number) => setProp('time', time)
};

videoCore.on('implementationChanged', (manifest: any) => {
	if (manifest && manifest.props) {
		manifest.props.forEach((propName: string) =>
			videoCore.dispatch({ type: 'observeProp', propName })
		);
	}
	videoState.update((s) => ({ ...s, manifest }));
});

videoCore.on('propChanged', updateState);
videoCore.on('propValue', updateState);

function setProp(propName: string, propValue: any) {
	videoCore.dispatch(
		{
			type: 'setProp',
			propName,
			propValue
		},
		{ containerElement: videoContainer }
	);
}

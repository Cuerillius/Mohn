import { get } from 'svelte/store';
import { getVideo } from '../video';
import { streamingServer } from './streamingServer';

const videoCore = await getVideo();

let videoContainer: HTMLDivElement;

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

};

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

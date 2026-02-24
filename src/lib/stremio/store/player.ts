import { createModelStore } from './modelStore';
import { derived, get, writable, type Writable } from 'svelte/store';
import { getStremio } from '../core';
import { streamingServer } from './streamingServer';
import { video } from './video';

const playerStore = createModelStore<any>('player');
const stremio = getStremio();

export const stream: Writable<Stream | null> = writable(null);

export const player = {
	subscribe: derived(playerStore, ($player) => $player).subscribe,

	loadStream: (stream: Stream) => {
		const currentStreamingServer = get(streamingServer);
		video.loadStream(stream);
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'Player',
				args: {
					stream,
					autoplay: true,
					time: 0,
					forceTranscoding: true,
					streamingServerURL: currentStreamingServer?.url
				}
			}
		});
	},
	pause: (paused: boolean) => {
		if (paused) {
			video.play();
		} else {
			video.pause();
		}
		stremio.dispatch({
			action: 'Player',
			args: {
				action: 'PausedChanged',
				args: {
					paused: paused
				}
			}
		});
	},
	videoParamsChanged: (propName: string, propValue: any) => {
		stremio.dispatch({
			action: 'Player',
			args: {
				action: 'VideoParamsChanged',
				args: { propName: propValue }
			}
		});
	}
};

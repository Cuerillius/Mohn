import { createModelStore } from './modelStore';
import { derived, get, writable, type Writable } from 'svelte/store';
import { getStremio } from '../core';
import { streamingServer } from './streamingServer';

const playerStore = createModelStore<any>('player');
const stremio = getStremio();

export const stream: Writable<Stream | null> = writable(null);

export const player = {
	subscribe: derived(playerStore, ($player) => $player).subscribe,

	loadStream: (stream: Stream) => {
		const currentStreamingServer = get(streamingServer);
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
	pauseChanged: (isPaused: boolean) => {
		stremio.dispatch({
			action: 'Player',
			args: {
				action: 'PausedChanged',
				args: {
					paused: isPaused
				}
			}
		});
	},
	videoParamsChanged: (videoParams: VideoParams) => {
		stremio.dispatch({
			action: 'Player',
			args: {
				action: 'VideoParamsChanged',
				args: { videoParams }
			}
		});
	},
	unload: () => {
		streamingServer.unload();
		stremio.dispatch({
			action: 'Unload'
		});
	}
};

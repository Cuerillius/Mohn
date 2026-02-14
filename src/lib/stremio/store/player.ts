import { createModelStore } from './modelStore';
import { derived, writable, type Writable } from 'svelte/store';
import { getStremio } from '../core';

const playerStore = createModelStore<any>('player');
const stremio = getStremio();

export const stream: Writable<Stream | null> = writable(null);

export const player = {
	subscribe: derived(playerStore, ($player) => $player).subscribe,

	loadStream: (stream: Stream) => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'Player',
				args: {
					stream,
					autoplay: true,
					time: 0,
					forceTranscoding: true
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
	}
};

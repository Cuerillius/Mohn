import { derived } from 'svelte/store';
import { createModelStore } from './modelStore';
import { getStremio } from '../core';

const streamingServerStore = createModelStore<StreamingServerStore>('streaming_server');
const stremio = getStremio();
export const streamingServer = {
	subscribe: derived(streamingServerStore, ($streamingServer) => ({
		url: $streamingServer?.selected.transportUrl
	})).subscribe,

	unload: () => {
		stremio.dispatch({
			action: 'Unload'
		});
	}
};

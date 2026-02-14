import { derived } from 'svelte/store';
import { createModelStore } from './modelStore';

const streamingServerStore = createModelStore<StreamingServerStore>('streaming_server');

export const streamingServer = {
	subscribe: derived(streamingServerStore, ($streamingServer) => ({
		url: $streamingServer?.selected.transportUrl
	})).subscribe
};

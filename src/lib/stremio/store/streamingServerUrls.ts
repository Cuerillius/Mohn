import { derived, get } from 'svelte/store';
import { getStremio } from '../core';
import { createModelStore } from './modelStore';
import { auth } from './auth';

const streamingServerUrlsStore = createModelStore<Ctx>('ctx');
const stremio = getStremio();

export const streamingServerUrls = {
	subscribe: derived(streamingServerUrlsStore, ($ctx) => ({
		streamingServerUrls: $ctx?.streamingServerUrls
	})).subscribe,

	addServerUrl: (url: string) => {
		stremio.dispatch({
			action: 'Ctx',
			args: {
				action: 'AddServerUrl',
				args: url
			}
		});
	},
	deleteServerUrl: (url: string) => {
		stremio.dispatch({
			action: 'Ctx',
			args: {
				action: 'DeleteServerUrl',
				args: url
			}
		});
	},
	selectServerUrl: (url: string) => {
		const currentAuth = get(auth);
		if (currentAuth == null || currentAuth.profile == null) {
			console.warn('No authenticated user found');
			return;
		}
		stremio.dispatch({
			action: 'Ctx',
			args: {
				action: 'UpdateSettings',
				args: {
					...currentAuth.profile.settings,
					streamingServerUrl: url
				}
			}
		});
	},
	reloadServer: () => {
		stremio.dispatch({
			action: 'StreamingServer',
			args: {
				action: 'Reload'
			}
		});
	},

};

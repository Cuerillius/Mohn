import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const ctxStore = createModelStore<Ctx>('ctx');
const stremio = getStremio();

export const addon = {
	subscribe: derived(ctxStore, ($ctx) => ({
		addons: $ctx?.profile?.addons
	})).subscribe,

	install: async (url: string) => {
		const manifest = await getManifestFromUrl(url);
		stremio.dispatch({
			action: 'Ctx',
			args: { action: 'InstallAddon', args: { transportUrl: url, manifest } }
		});
	},
	uninstall: (addon: Addon) => {
		stremio.dispatch({
			action: 'Ctx',
			args: { action: 'UninstallAddon', args: { ...addon } }
		});
	},
	configure: (addon: Addon) => {
		window.open(addon.transportUrl.replace('manifest.json', 'configure'), '_blank');
	},

};

async function getManifestFromUrl(url: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch manifest from ${url}: ${response.statusText}`);
	}
	return await response.json();
}

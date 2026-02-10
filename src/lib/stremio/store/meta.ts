import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const metaStore = createModelStore<Meta>('meta_details');
const stremio = getStremio();

export const meta = {
	subscribe: derived(metaStore, ($meta) => ({
		meta: $meta
	})).subscribe,
	loadMeta: (id: string) => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'MetaDetails',
				args: {
					metaPath: {
						resource: 'meta',
						type: 'movie',
						id: id,
						extra: []
					},
					streamPath: {
						resource: 'stream',
						type: 'movie',
						id: id,
						extra: []
					}
				}
			}
		});
	}
};

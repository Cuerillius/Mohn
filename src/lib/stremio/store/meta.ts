import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const metaStore = createModelStore<Meta>('meta_details');
const stremio = getStremio();

export const meta = {
	subscribe: derived(metaStore, ($meta) => ({
		meta: $meta,
		streams: $meta?.streams || [],
		details: $meta?.metaItem
	})).subscribe,
	loadMeta: (id: string, type: string) => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'MetaDetails',
				args: {
					metaPath: {
						resource: 'meta',
						type: type,
						id: id,
						extra: []
					}
				}
			}
		});
	},
	loadStream: (id: string, type: string) => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'MetaDetails',
				args: {
					metaPath: {
						resource: 'meta',
						type: type,
						id: id,
						extra: []
					},
					streamPath: {
						resource: 'stream',
						type: type,
						id: id,
						extra: []
					}
				}
			}
		});
	}
};

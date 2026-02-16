import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const searchStore = createModelStore<Board>('search');
const stremio = getStremio();

export const search = {
	subscribe: derived(searchStore, ($search) => ({
		catalogs: $search?.catalogs
	})).subscribe,
	initialLoad: (query: string) => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'CatalogsWithExtra',
				args: {
					extra: [['search', query]]
				}
			}
		});
	},
	loadRange: (start: number, end: number) => {
		stremio.dispatch({
			action: 'CatalogsWithExtra',
			args: {
				action: 'LoadRange',
				args: {
					start,
					end
				}
			}
		});
	},

};

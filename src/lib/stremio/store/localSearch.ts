import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const localSearchStore = createModelStore<LocalSearch>('local_search');
const stremio = getStremio();

export const localSearch = {
	subscribe: derived(localSearchStore, ($search) => ({
		results: $search?.items
	})).subscribe,

	load: () => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'LocalSearch'
			}
		});
	},
	search: (query: string) => {
		stremio.dispatch({
			action: 'Search',
			args: {
				action: 'Search',
				args: {
					searchQuery: query,
					maxResults: 9
				}
			}
		});
	},
	unload: () => {
		stremio.dispatch({
			action: 'Unload'
		});
	}
};

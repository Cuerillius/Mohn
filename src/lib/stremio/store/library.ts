import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const libraryStore = createModelStore<any>('library');
const stremio = getStremio();

export const library = {
	subscribe: derived(libraryStore, ($library) => ({
		catalog: $library?.catalog
	})).subscribe,

	addToLibrary: (metaItem: DiscoverItem) => {
		stremio.dispatch({
			action: 'Ctx',
			args: { action: 'AddToLibrary', args: metaItem }
		});
	},
	removeFromLibrary: (id: string) => {
		stremio.dispatch({
			action: 'Ctx',
			args: { action: 'RemoveFromLibrary', args: id }
		});
	},
	load: (type: 'movie' | 'series' | null) => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'LibraryWithFilters',
				args: {
					request: {
						type
					}
				}
			}
		});
	}
};

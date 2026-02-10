import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const catalogStore = createModelStore<CatalogStore>('discover');
const stremio = getStremio();

export const discover = {
	subscribe: derived(catalogStore, ($catalog) => ({
		catalogs: $catalog
	})).subscribe,
	test: (catalog: Catalog) => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'CatalogWithFilters',
				request: {
					base: catalog?.addon?.manifest?.id,
					path: {
						resource: 'catalog',
						type: catalog?.type,
						id: catalog?.id
					}
				}
			}
		});
	}
};

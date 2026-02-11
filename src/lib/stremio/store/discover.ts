import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';
import type { CatalogStore } from '$lib/types/catalogStore';

const catalogStore = createModelStore<CatalogStore>('discover');
const stremio = getStremio();

export const discover = {
	subscribe: derived(catalogStore, ($catalog) => ({
		catalogs: $catalog
	})).subscribe,
	load: (catalog: Catalog, transportUrl: string) => {
		console.log('Loading catalog with id:', catalog.id);
		console.log('Catalog details:', catalog);
		stremio.dispatch({
			"action": "Load",
			"args": {
				"model": "CatalogWithFilters",
				"args": {
					"request": {
						"base": "https://v3-cinemeta.strem.io/manifest.json",
						"path": {
							"resource": "catalog",
							"type": "movie",
							"id": "top",
							"extra": []
						}
					}
				}
			}
		});
	}
};

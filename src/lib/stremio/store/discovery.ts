import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const catalogStore = createModelStore<any>('discover');
const stremio = getStremio();

export const discovery = {
    subscribe: derived(catalogStore, ($catalog) => ({
        catalogStore: $catalog
    })).subscribe,
        test: () => {
        stremio.dispatch({
            action: 'CatalogWithFilters',
            args: { action: 'LoadNextPage' }
        });
    }
};
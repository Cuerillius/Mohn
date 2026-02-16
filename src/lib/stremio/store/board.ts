import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const boardStore = createModelStore<Board>('board');
const stremio = getStremio();

export const board = {
	subscribe: derived(boardStore, ($board) => ({
		catalogs: $board?.catalogs
	})).subscribe,

	initialLoad: () => {
		stremio.dispatch({
			action: 'Load',
			args: {
				model: 'CatalogsWithExtra',
				args: {
					extra: []
				}
			}
		});
	},

	loadRange: (start: number, end: number) => {
		stremio.dispatch({
			action: 'CatalogsWithExtra',
			args: {
				action: 'LoadRange',
				args: { start, end }
			}
		});
	},

};

import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const ctxStore = createModelStore<Ctx>('ctx');
const stremio = getStremio();

export const auth = {
	subscribe: derived(ctxStore, ($ctx) => ({
		profile: $ctx?.profile,
		email: $ctx?.profile?.auth?.user?.email,
		isLoggedIn: !!$ctx?.profile?.auth?.key,
		searchHistory: $ctx?.searchHistory
	})).subscribe,

	login: (email: string, password: string) => {
		stremio.dispatch({
			action: 'Ctx',
			args: { action: 'Authenticate', args: { type: 'Login', email, password } }
		});
	},
	register: (email: string, password: string) => {
		stremio.dispatch({
			action: 'Ctx',
			args: { action: 'Authenticate', args: { type: 'Register', email, password } }
		});
	},
	logout: () => {
		stremio.dispatch({
			action: 'Ctx',
			args: { action: 'Logout' }
		});
	},

};

import { createModelStore } from './modelStore';
import { derived } from 'svelte/store';
import { getStremio } from '../core';

const ctxStore = createModelStore<Ctx>('ctx');
const stremio = getStremio();

export const addon = {
    subscribe: derived(ctxStore, ($ctx) => ({
        addons: $ctx?.profile?.addons,
    })).subscribe,

    //TODO manifest is no string error
    install: (manifest: string) => {
        console.log('Installing addon with manifest:', new URL(manifest).toString());
        stremio.dispatch({
            action: 'Ctx',
            args: { action: 'InstallAddon', args: { manifest } }
        });
    },
    //TODO manifest is no string error
    uninstall: (manifest: string) => {
        stremio.dispatch({
            action: 'Ctx',
            args: { action: 'UninstallAddon', args: { manifest } }
        });
    }
};
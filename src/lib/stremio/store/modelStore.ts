import { readable, type Readable } from 'svelte/store';
import { getStremio } from '../core';

export function createModelStore<T>(modelName: string): Readable<T | null> {
    const stremio = getStremio();
    return readable<T | null>(null, (set) => {
        stremio.getState(modelName).then(set);
        
        const onNewState = async (models: string[]) => {
            if (models.includes(modelName)) {
                const newState = await stremio.getState(modelName);
                set(newState);
            }
        };

        stremio.on('NewState', onNewState);

        return () => {
            stremio.off('NewState', onNewState);
        };
    });
}
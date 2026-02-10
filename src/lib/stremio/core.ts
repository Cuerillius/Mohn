import EventEmitter from 'eventemitter3';
import Bridge from '@stremio/stremio-core-web/bridge';

interface StremioServiceBridge {
    isReady: boolean;
    dispatch(action: any, model?: string): Promise<any>;
    getState(model: string): Promise<any>;
    on(event: string, listener: (...args: any[]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
}

class StremioService extends EventEmitter implements StremioServiceBridge {
    private worker: Worker;
    private bridge: any;
    public isReady = false;

    constructor() {
        super();
        this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
            type: "module",
        });
        this.bridge = new Bridge(window, this.worker);

        (window as any).onCoreEvent = (event: { name: string; args: any }) => {
            this.emit(event.name, event.args);
        };

        this.bridge.call(['init'], [{
            appVersion: '1.0.0',
            shellVersion: null
        }])
            .then(() => {
                this.isReady = true;
                this.emit('ready');
            })
            .catch(console.error);
    }

    async dispatch(action: any, model?: string) {
        return this.bridge.call(['dispatch'], [action, model, window.location.hash]);
    }

    async getState(model: string) {
        return this.bridge.call(['getState'], [model]);
    }
}

class NoopStremioService extends EventEmitter implements StremioServiceBridge {
public isReady: boolean;   
    constructor() {
        super();
        this.isReady = false;
    }

    async dispatch() {
        console.warn(`StremioService dispatch called on server.`);
        return Promise.resolve();
    }

    async getState() {
        console.warn(`StremioService getState called on server.`);
        return Promise.resolve(null);
    }
}

let stremioInstance: StremioService | null = null;

export const getStremio: () => StremioServiceBridge = () => {
    if (typeof window === "undefined") {
        return new NoopStremioService()
    }
    if (!stremioInstance) {
        stremioInstance = new StremioService();
    }
    return stremioInstance;
}
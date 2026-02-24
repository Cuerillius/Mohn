// src/lib/stremio/StremioService.ts
import EventEmitter from 'eventemitter3';
import { Bridge } from './bridge';

class StremioService extends EventEmitter implements StremioServiceBridge {
	private worker: Worker;
	private bridge: Bridge;
	public isReady = false;

	constructor() {
		super();

		this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
			type: 'module'
		});

		const mainThreadScope = {
			location: window.location,
			localStorage: window.localStorage,
			onCoreEvent: (event: { name: string; args: any }) => {
				this.emit(event.name, event.args);
			}
		};

		this.bridge = new Bridge(mainThreadScope, this.worker);

		this.bridge
			.call(['init'], [{ appVersion: '1.0.0', shellVersion: null }])
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
	public isReady = false;
	async dispatch() {
		console.warn('Called on server');
		return Promise.resolve();
	}
	async getState() {
		console.warn('Called on server');
		return Promise.resolve(null);
	}
}

let stremioInstance: StremioService | null = null;

export const getStremio = () => {
	if (typeof window === 'undefined') return new NoopStremioService();
	if (!stremioInstance) stremioInstance = new StremioService();
	return stremioInstance;
};

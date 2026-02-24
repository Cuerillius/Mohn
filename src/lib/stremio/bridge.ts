function getId() {
	return Math.random().toString(32).slice(2);
}

export class Bridge {
	constructor(
		private scope: any,
		private handler: Worker | Window | typeof globalThis
	) {
		this.handler.addEventListener('message', async (e: Event) => {
			const { data } = e as MessageEvent;
			if (!data || !data.request) return;

			const { id, path, args } = data.request;
			try {
				const value = path.reduce((val: any, prop: string) => val[prop], this.scope);
				let resultData;
				if (typeof value === 'function') {
					const thisArg = path
						.slice(0, path.length - 1)
						.reduce((val: any, prop: string) => val[prop], this.scope);
					resultData = await value.apply(thisArg, args);
				} else {
					resultData = await value;
				}

				this.handler.postMessage({ response: { id, result: { data: resultData } } });
			} catch (error) {
				this.handler.postMessage({ response: { id, result: { error } } });
			}
		});
	}

	async call(path: string[], args: any[]): Promise<any> {
		const id = getId();
		return new Promise((resolve, reject) => {
			const onMessage = (e: Event) => {
				const { data } = e as MessageEvent;
				if (!data || !data.response || data.response.id !== id) return;

				this.handler.removeEventListener('message', onMessage);
				if ('error' in data.response.result) {
					reject(data.response.result.error);
				} else {
					resolve(data.response.result.data);
				}
			};
			this.handler.addEventListener('message', onMessage);
			this.handler.postMessage({ request: { id, path, args } });
		});
	}
}

interface StremioServiceBridge {
	isReady: boolean;
	dispatch(action: any, model?: string): Promise<any>;
	getState(model: string): Promise<any>;
	on(event: string, listener: (...args: any[]) => void): void;
	off(event: string, listener: (...args: any[]) => void): void;
}

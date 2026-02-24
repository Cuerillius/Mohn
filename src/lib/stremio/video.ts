import EventEmitter from 'eventemitter3';

let videoInstance: StremioServiceBridge | null = null;

class NoopVideo extends EventEmitter implements StremioServiceBridge {
	public isReady = false;

	async dispatch() {
		console.warn(`Video dispatch called on server.`);
		return Promise.resolve();
	}

	async getState() {
		console.warn(`Video getState called on server.`);
		return Promise.resolve(null);
	}
}

export const getVideo: () => Promise<StremioServiceBridge> = async () => {
	if (typeof window === 'undefined') {
		return new NoopVideo();
	}
	if (!videoInstance) {
		const Video = await import('@stremio/stremio-video');
		const VideoConstructor = Video.default || Video;
		videoInstance = new VideoConstructor();
	}
	return videoInstance as StremioServiceBridge;
};

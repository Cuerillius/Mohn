interface StreamingServerStore {
	selected: {
		transportUrl: string;
		statistics: any | null;
	};
	settings: Loadable<StreamingServerSettings>;
	baseUrl: string;
	remoteUrl: string | null;
	playbackDevices: Loadable<any[]>;
	networkInfo: Loadable<{
		availableInterfaces: string[];
	}>;
	deviceInfo: Loadable<{
		availableHardwareAccelerations: any[];
	}>;
	torrent: any | null;
	statistics: any | null;
}

interface StreamingServerSettings {
	appPath: string;
	cacheRoot: string;
	serverVersion: string;
	remoteHttps: string;
	transcodeProfile: string | null;
	cacheSize: number;
	proxyStreamsEnabled: boolean;
	btMaxConnections: number;
	btHandshakeTimeout: number;
	btRequestTimeout: number;
	btDownloadSpeedSoftLimit: number;
	btDownloadSpeedHardLimit: number;
	btMinPeersForStable: number;
}

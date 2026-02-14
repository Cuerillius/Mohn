interface Stream {
	url: string;
	name: string;
	description: string;
	behaviorHints?: {
		bingeGroup?: string;
		filename?: string;
		videoSize?: number;
		notWebReady?: boolean;
		videoHash?: string;
	};
	progress: number | null;
	deepLinks: {
		player: string;
		externalPlayer: {
			download: string | null;
			streaming: string | null;
			playlist: string | null;
			fileName: string | null;
			openPlayer: string | null;
			web: string | null;
			androidTv: string | null;
			tizen: string | null;
			webos: string | null;
		};
	};
	lastUsed: boolean | string | null;
}

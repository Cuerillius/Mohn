interface Meta {
	selected: {
		metaPath: {
			resource: string;
			type: string;
			id: string;
			extra: any[];
		};
		streamPath: {
			resource: string;
			type: string;
			id: string;
			extra: any[];
		};
		guessStream: boolean;
	};
	metaItem: {
		content: Loadable<DiscoverItem>;
	};
	addon: {
		manifest: {
			id: string;
			name: string;
			logo: string | null;
		};
		transportUrl: string;
	};
	libraryItem: {
		_id: string;
		name: string;
		type: string;
		poster: string;
		posterShape: string;
		removed: boolean;
		temp: boolean;
		_ctime: string;
		_mtime: string;
		state: {
			lastWatched: string;
			timeWatched: number;
			timeOffset: number;
			overallTimeWatched: number;
			timesWatched: number;
			flaggedWatched: number;
			duration: number;
			video_id: string | null;
			watched: string | null;
			noNotif: boolean;
		};
		behaviorHints: {
			defaultVideoId: string;
			featuredVideoId: string | null;
			hasScheduledVideos: boolean;
		};
	};
	streams: Array<{
		content: Loadable<Array<Stream>>;
		addon: Addon;
	}>;
	metaExtensions: any[];
	title: string;
	ratingInfo: {
		type: string;
		content: {
			metaId: string;
			status: any | null;
		};
	};
}

interface Video {
	id: string;
	title: string;
	released: string;
}

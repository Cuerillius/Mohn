interface DiscoverItem {
	id: string;
	type: 'movie' | 'series' | 'anime' | 'tv' | 'other';
	name: string;
	poster: string;
	background: string;
	logo: string;
	description: string;
	releaseInfo: string;
	runtime: string;
	released: string;
	posterShape: 'poster' | 'square' | 'landscape';
	links: Array<{
		name: string;
		category: 'imdb' | 'share' | 'Genres' | 'Cast' | 'Writers' | 'Directors' | string;
		url: string;
	}>;
	trailerStreams: Array<{
		ytId: string;
		description: string;
		deepLinks: {
			player: string;
			externalPlayer: ExternalPlayerUrls;
		};
	}>;
	behaviorHints: {
		defaultVideoId: string;
		featuredVideoId: string | null;
		hasScheduledVideos: boolean;
	};
	watched: boolean;
	inLibrary: boolean;
	deepLinks: {
		metaDetailsVideos: string | null;
		metaDetailsStreams: string;
		player: string | null;
	};
}

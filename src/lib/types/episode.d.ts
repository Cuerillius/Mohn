interface Episode {
	episode: number;
	id: string;
	overview: string;
	progress: any;
	released: string;
	scheduled: boolean;
	season: number;
	streams: any;
	thumbnail: string;
	title: string;
	trailerStreams: Array<{
		ytId: string;
		description: string;
		deepLinks: {
			player: string;
			externalPlayer: ExternalPlayerUrls;
		};
	}>;
	upcoming: boolean;
	watched: boolean;
	title: string;
}

export interface SearchResponse {
	success: boolean;
	message: string;
	data: SearchItem[];
}

export interface SearchItem {
	globalID: string;
	id: string;
	title: string;
	titles: string[];
	link: string;
	description: string;
	genres: string[];
	mediaType: 'movie' | 'series';
	rating: number;
	languages: string[];
	contentRating: string;
	actors: string[];
	trailer: Trailer;
	characters: string[];
	image: string;
	isAdult: boolean;
	type: 'movie' | 'series';
	releasedDate: string;
	episodesNumber: number;
	runtime: string;
	releaseYears: number | string;
	titles_full: LocalizedTitle[];
	keywords: string[];
}

export interface LocalizedTitle {
	title: string;
	language: string;
}

export interface Trailer {
	youtube_id: string;
	full_url: string;
	thumbnail: string;
}

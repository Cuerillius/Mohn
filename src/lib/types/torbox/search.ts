import type { ApiResponse } from './api';

export type ResourceType = 'torrent' | 'usenet' | 'webdownload';

export interface Metadata {
	globalID: string;
	id: string;
	imdb_id?: string | null;
	tmdb_id?: number | null;
	tvdb_id?: number | null;
	tvmaze_id?: number | null;
	trakt_id?: number | null;
	mal_id?: number | null;
	anilist_id?: number | null;
	kitsu_id?: number | null;
	simkl_id?: number | null;
	title: string;
	titles: string[];
	titles_full: LocalizedTitle[];
	translated_titles: string[];
	link: string | null;
	description: string;
	genres: string[];
	mediaType: 'movie' | 'series';
	type: 'movie' | 'series';
	rating: number;
	popularity: number;
	languages: string[];
	contentRating: string;
	actors: string[];
	trailer: Trailer | null | Record<string, never>;
	characters: string[];
	image: string;
	backdrop: string;
	isAdult: boolean;
	releasedDate: string;
	seasonsNumber: number;
	episodesNumber: number;
	runtime: string;
	releaseYears: number | string;
	keywords: string[];
}

interface LocalizedTitle {
	title: string;
	language: string;
}

interface Trailer {
	youtube_id?: string;
	full_url?: string;
	thumbnail?: string;
}

export type SearchMetadataListResponse = ApiResponse<Metadata[]>;
export type SearchMetadataSingleResponse = ApiResponse<Metadata>;
export type SearchResponse = ApiResponse<Data>;
export interface SearchOptions {
	metadata?: boolean;
	season?: number;
	episode?: number;
	checkCache?: boolean;
	checkOwned?: boolean;
	checkUserEngines?: boolean;
	cachedOnly?: boolean;
}

interface Data {
	metadata: Metadata;
	torrents?: Resource[];
	nzbs?: Resource[];
	time_taken: number;
	cached: boolean;
	total_torrents?: number;
	total_nzbs?: number;
}

interface Resource {
	hash: string;
	alternative_hashes: string[];
	raw_title: string;
	title: string;
	title_parsed_data: TitleParsedData;
	magnet: string;
	torrent: string;
	last_known_seeders: number;
	last_known_peers: number;
	size: number;
	tracker: string;
	categories: string[];
	files: number;
	type: ResourceType;
	nzb: string;
	age: string;
	user_search: boolean;
}

interface TitleParsedData {
	resolution?: string;
	quality?: string;
	year?: number;
	codec?: string;
	audio?: string;
	hdr?: boolean;
	title: string;
	excess?: string[] | string;
	encoder?: string;
	bitDepth?: number;
	remux?: boolean;
	site?: string;
	filetype?: string;
	remastered?: boolean;
	proper?: boolean;
	language?: string[] | string;
	repack?: boolean;
	fps?: number;
	subtitles?: string[] | string;
	limited?: boolean;
	episodeName?: string;
	size?: string;
	'3d'?: boolean;
	network?: string;
	month?: number;
	day?: number;
	genre?: string[];
	upscaled?: boolean;
	internal?: boolean;
}

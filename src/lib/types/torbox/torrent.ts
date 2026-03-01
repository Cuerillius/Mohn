import type { ApiResponse } from './api';

interface CreatedTorrent {
	hash: string;
	torrent_id: string;
	auth_id: string;
}

export type CreateTorrentResponse = ApiResponse<CreatedTorrent>;
export type TorrentListResponse = ApiResponse<TorrentData[]>;
export type TorrentDataResponse = ApiResponse<TorrentData>;

export interface TorrentFile {
	id: number;
	md5: string | null;
	hash: string;
	name: string;
	size: number;
	zipped: boolean;
	s3_path: string;
	infected: boolean;
	mimetype: string;
	short_name: string;
	absolute_path: string;
	opensubtitles_hash: string;
}

export interface TorrentData {
	id: number;
	auth_id: string;
	server: number;
	hash: string;
	name: string;
	magnet: string | null;
	size: number;
	active: boolean;
	created_at: string;
	updated_at: string;
	download_state:
		| 'downloading'
		| 'uploading'
		| 'stalled (no seeds)'
		| 'paused'
		| 'completed'
		| 'cached'
		| 'metaD'
		| 'checkingResumeData';
	seeds: number;
	peers: number;
	ratio: number;
	progress: number;
	download_speed: number;
	upload_speed: number;
	eta: number;
	torrent_file: boolean;
	expires_at: string | null;
	download_present: boolean;
	files: TorrentFile[];
	download_path: string;
	availability: number;
	download_finished: boolean;
	tracker: string | null;
	total_uploaded: number;
	total_downloaded: number;
	cached: boolean;
	owner: string;
	seed_torrent: boolean;
	allow_zipped: boolean;
	long_term_seeding: boolean;
	tracker_message: string | null;
	cached_at: string | null;
	private: boolean;
	alternative_hashes: string[];
	tags: string[];
}

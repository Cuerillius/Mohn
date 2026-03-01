import type {
	ResourceType,
	SearchMetadataListResponse,
	SearchMetadataSingleResponse,
	SearchOptions,
	SearchResponse
} from '$lib/types/torbox/search';
import type { StreamDataResponse } from '$lib/types/torbox/stream';
import type {
	CreateTorrentResponse,
	TorrentDataResponse,
	TorrentListResponse
} from '$lib/types/torbox/torrent';
import { error } from '@sveltejs/kit';

class TorboxBase {
	protected userId: string;
	protected apiToken: string;
	protected baseUrl: string;

	constructor(userId: string, apiToken: string, baseUrl: string) {
		this.userId = userId;
		this.apiToken = apiToken;
		this.baseUrl = baseUrl;
	}

	protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		if (!this.apiToken) {
			throw error(401, 'Torbox API Token missing.');
		}

		const headers = {
			Authorization: `Bearer ${this.apiToken}`,
			'Content-Type': 'application/json',
			...options.headers
		};

		const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });

		if (!response.ok) {
			const errData = await response.json().catch(() => ({}));
			console.error(`Torbox API Error (${this.baseUrl}):`, errData);
			throw error(response.status, `Provider Error: ${errData.message || response.statusText}`);
		}

		return response.json() as Promise<T>;
	}

	protected async post<T>(endpoint: string, body?: object, options: RequestInit = {}): Promise<T> {
		if (!this.apiToken) {
			throw error(401, 'Torbox API Token missing.');
		}

		const formData = new FormData();
		if (body) {
			for (const [key, value] of Object.entries(body)) {
				formData.append(key, value);
			}
		}
		const headers = {
			Authorization: `Bearer ${this.apiToken}`,
			...options.headers
		};
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'POST',
			headers,
			body: formData,
			...options
		});

		if (!response.ok) {
			const errData = await response.json().catch(() => ({}));
			console.error(`Torbox API Error (${this.baseUrl}):`, errData);
			throw error(
				response.status,
				`Provider Error: ${errData.detail || errData.message || response.statusText}`
			);
		}

		return response.json() as Promise<T>;
	}
}

class StreamService extends TorboxBase {
	constructor(userId: string, apiToken: string) {
		super(userId, apiToken, `https://api.torbox.app/v1`);
	}

	async createStream(
		id: number,
		file_id: number,
		type: ResourceType,
		chosenSubtitleIndex?: number,
		chosenAudioIndex?: number
	) {
		let url = `/api/stream/createstream?id=${id}&file_id=${file_id}&type=${type}`;
		if (chosenSubtitleIndex !== undefined) url += `&chosen_subtitle_index=${chosenSubtitleIndex}`;
		if (chosenAudioIndex !== undefined) url += `&chosen_audio_index=${chosenAudioIndex}`;

		return this.request<StreamDataResponse>(url);
	}

	async getStreamData(
		presignedToken: string,
		chosenSubtitleIndex?: number,
		chosenAudioIndex?: number
	) {
		let url = `/api/stream/getstreamdata?presigned_token=${presignedToken}&token=${this.apiToken}`;
		if (chosenSubtitleIndex !== undefined) url += `&chosen_subtitle_index=${chosenSubtitleIndex}`;
		if (chosenAudioIndex !== undefined) url += `&chosen_audio_index=${chosenAudioIndex}`;

		return this.request<StreamDataResponse>(url);
	}
}

class TorrentService extends TorboxBase {
	constructor(userId: string, apiToken: string) {
		super(userId, apiToken, `https://api.torbox.app/v1`);
	}

	async createTorrent(magnet: string) {
		return this.post<CreateTorrentResponse>(`/api/torrents/createtorrent`, {
			magnet: magnet
		});
	}

	async getTorrentData(torrentId: string) {
		return this.request<TorrentDataResponse>(`/api/torrents/mylist?id=${torrentId}`);
	}

	async getTorrentList({
		bypassCache,
		offset,
		limit
	}: {
		bypassCache?: boolean;
		offset?: number;
		limit?: number;
	}) {
		let url = `/api/torrents/mylist`;
		const params = new URLSearchParams();
		if (bypassCache !== undefined) params.append('bypass_cache', String(bypassCache));
		if (offset !== undefined) params.append('offset', String(offset));
		if (limit !== undefined) params.append('limit', String(limit));
		if (params.toString()) url += `?${params.toString()}`;
		return this.request<TorrentListResponse>(url);
	}
}

class SearchService extends TorboxBase {
	constructor(userId: string, apiToken: string) {
		super(userId, apiToken, 'https://search-api.torbox.app');
	}

	async findMetadataByQuery(query: string): Promise<SearchMetadataListResponse> {
		return this.request<SearchMetadataListResponse>(`/meta/search/${encodeURIComponent(query)}`);
	}

	async findMetadataById(id: string): Promise<SearchMetadataSingleResponse> {
		return this.request<SearchMetadataSingleResponse>(`/meta/${id}`);
	}

	private async findQuery(
		baseUrl: string,
		identifier: string,
		options: SearchOptions = {}
	): Promise<SearchResponse> {
		const params = new URLSearchParams();

		if (options.metadata) params.append('metadata', 'true');
		if (options.checkCache) params.append('check_cache', 'true');
		if (options.checkOwned) params.append('check_owned', 'true');
		if (options.checkUserEngines) params.append('check_user_engines', 'true');
		if (options.cachedOnly) params.append('cached_only', 'true');
		if (options.season !== undefined) params.append('season', String(options.season));
		if (options.episode !== undefined) params.append('episode', String(options.episode));

		const queryString = params.toString();
		const url = `${baseUrl}${encodeURIComponent(identifier)}${queryString ? `?${queryString}` : ''}`;

		return this.request<SearchResponse>(url);
	}

	async findTorrentDataByQuery(query: string, options?: SearchOptions): Promise<SearchResponse> {
		return this.findQuery('/torrents/search/', query, options);
	}

	async findTorrentDataById(id: string, options?: SearchOptions): Promise<SearchResponse> {
		return this.findQuery('/torrents/', id, options);
	}

	async findUsenetDataById(id: string, options?: SearchOptions): Promise<SearchResponse> {
		return this.findQuery('/usenet/', id, options);
	}

	async findUsenetDataByQuery(query: string, options?: SearchOptions): Promise<SearchResponse> {
		return this.findQuery('/usenet/search/', query, options);
	}
}

export class TorboxClient {
	public torrents: TorrentService;
	public stream: StreamService;
	public search: SearchService;
	protected apiToken?: string;

	constructor(userId: string) {
		this.apiToken = '';
		this.stream = new StreamService(userId, this.apiToken);
		this.search = new SearchService(userId, this.apiToken);
	}
}

export const createTorboxClient = (userId: string) => new TorboxClient(userId);

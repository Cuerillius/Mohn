import type { SearchResponse } from '$lib/types/torbox/search';
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
}

class SearchService extends TorboxBase {
	constructor(userId: string, apiToken: string) {
		super(userId, apiToken, 'https://search-api.torbox.app');
	}

	async findQuery(query: string): Promise<SearchResponse> {
		return this.request<SearchResponse>(`/meta/search/${encodeURIComponent(query)}`);
	}
}

export class TorboxClient {
	public search: SearchService;
	protected apiToken?: string;

	constructor(userId: string) {
		this.apiToken = '';
		this.search = new SearchService(userId, this.apiToken);
	}
}

export const createTorboxClient = (userId: string) => new TorboxClient(userId);

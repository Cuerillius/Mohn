import type { TMDBItem, TMDBMovieDetail, TMDBTVDetail, TMDBSeason } from '../types/tmdb';

const BASE = 'https://api.themoviedb.org/3';
const IMG  = 'https://image.tmdb.org/t/p';

function headers(): HeadersInit {
  const key = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  if (!key || key === 'your_tmdb_read_access_token_here') {
    throw new Error('VITE_TMDB_API_KEY is not set. Add your TMDB Read Access Token to .env');
  }
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

export function imgUrl(path: string | null, size = 'w500'): string | null {
  return path ? `${IMG}/${size}${path}` : null;
}

export function itemTitle(item: TMDBItem): string {
  return item.title ?? item.name ?? 'Untitled';
}

export function itemYear(item: TMDBItem): string {
  const d = item.release_date ?? item.first_air_date;
  return d ? d.substring(0, 4) : '';
}

export function formatRuntime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

interface ListResponse { results: TMDBItem[] }

export async function getTrending(): Promise<TMDBItem[]> {
  const data = await get<ListResponse>('/trending/all/week');
  return data.results;
}

export async function getPopularMovies(): Promise<TMDBItem[]> {
  const data = await get<ListResponse>('/movie/popular');
  return data.results.map(m => ({ ...m, media_type: 'movie' as const }));
}

export async function getPopularTV(): Promise<TMDBItem[]> {
  const data = await get<ListResponse>('/tv/popular');
  return data.results.map(m => ({ ...m, media_type: 'tv' as const }));
}

export async function getNowPlaying(): Promise<TMDBItem[]> {
  const data = await get<ListResponse>('/movie/now_playing');
  return data.results.map(m => ({ ...m, media_type: 'movie' as const }));
}

export async function searchMulti(query: string): Promise<TMDBItem[]> {
  const data = await get<ListResponse>(`/search/multi?query=${encodeURIComponent(query)}`);
  return data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
}

export async function getMovie(id: number): Promise<TMDBMovieDetail> {
  return get<TMDBMovieDetail>(`/movie/${id}?append_to_response=credits`);
}

export async function getTV(id: number): Promise<TMDBTVDetail> {
  return get<TMDBTVDetail>(`/tv/${id}?append_to_response=credits`);
}

export async function getTVSeason(id: number, season: number): Promise<TMDBSeason> {
  return get<TMDBSeason>(`/tv/${id}/season/${season}`);
}

export async function getMovieRecs(id: number): Promise<TMDBItem[]> {
  const data = await get<ListResponse>(`/movie/${id}/recommendations`);
  return data.results.map(m => ({ ...m, media_type: 'movie' as const }));
}

export async function getTVRecs(id: number): Promise<TMDBItem[]> {
  const data = await get<ListResponse>(`/tv/${id}/recommendations`);
  return data.results.map(m => ({ ...m, media_type: 'tv' as const }));
}

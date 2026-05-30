import type { TMDBItem, TMDBMovieDetail, TMDBTVDetail, TMDBSeason, TMDBImages, TMDBVideos } from '../types/tmdb';
import { apiGet } from './api';

const IMG = 'https://image.tmdb.org/t/p';

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
  return apiGet<T>(`/api/tmdb${path}`);
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
  return get<TMDBMovieDetail>(`/movie/${id}?append_to_response=credits,images,videos&include_image_language=en,null`);
}

export async function getTV(id: number): Promise<TMDBTVDetail> {
  return get<TMDBTVDetail>(`/tv/${id}?append_to_response=credits,images,videos&include_image_language=en,null`);
}

export function getLogoUrl(images: TMDBImages | undefined): string | null {
  if (!images?.logos?.length) return null;
  const logo = images.logos.find(l => l.iso_639_1 === 'en') ?? images.logos[0];
  return imgUrl(logo.file_path, 'w500');
}

export function getTrailerKey(videos: TMDBVideos | undefined): string | null {
  if (!videos?.results?.length) return null;
  const trailer = videos.results.find(
    v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  ) ?? videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer')
    ?? videos.results.find(v => v.site === 'YouTube');
  return trailer?.key ?? null;
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

export interface TMDBExternalIds {
  imdb_id: string | null;
  tvdb_id?: number | null;
}

export async function getExternalIds(tmdbId: number, type: 'movie' | 'tv'): Promise<TMDBExternalIds> {
  return get<TMDBExternalIds>(`/${type}/${tmdbId}/external_ids`);
}

export async function getRecommendedForYou(genreIds: number[]): Promise<TMDBItem[]> {
  if (!genreIds.length) return [];
  const top = genreIds.slice(0, 2).join('|');
  const [movies, shows] = await Promise.all([
    get<ListResponse>(`/discover/movie?with_genres=${top}&sort_by=popularity.desc`),
    get<ListResponse>(`/discover/tv?with_genres=${top}&sort_by=popularity.desc`),
  ]);
  const seen = new Set<string>();
  const all = [
    ...movies.results.map(m => ({ ...m, media_type: 'movie' as const })),
    ...shows.results.map(m => ({ ...m, media_type: 'tv' as const })),
  ];
  return all.filter(item => {
    const key = `${item.media_type}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

export async function getByGenre(genreId: number): Promise<TMDBItem[]> {
  const [movies, shows] = await Promise.all([
    get<ListResponse>(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`),
    get<ListResponse>(`/discover/tv?with_genres=${genreId}&sort_by=popularity.desc`),
  ]);
  const all = [
    ...movies.results.map(m => ({ ...m, media_type: 'movie' as const })),
    ...shows.results.map(m => ({ ...m, media_type: 'tv' as const })),
  ];
  const seen = new Set<string>();
  return all.filter(item => {
    const key = `${item.media_type}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, 30);
}

export async function getTopRated(): Promise<TMDBItem[]> {
  const [movies, shows] = await Promise.all([
    get<ListResponse>('/movie/top_rated'),
    get<ListResponse>('/tv/top_rated'),
  ]);
  return [
    ...movies.results.map(m => ({ ...m, media_type: 'movie' as const })),
    ...shows.results.map(m => ({ ...m, media_type: 'tv' as const })),
  ].slice(0, 20);
}

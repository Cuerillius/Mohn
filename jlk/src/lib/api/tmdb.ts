import { env } from "$env/dynamic/public";
import type {
  MovieDetails,
  PopularMovies,
  TrendingResults,
  MultiSearchResult,
  Credits,
  Videos,
  TopRatedMovies,
  UpcomingMovies,
  MoviesPlayingNow,
  SimilarMovies,
} from "tmdb-ts";

const TMDB_BASE_URL = `${env.PUBLIC_BACKEND_URL}/api/tmdb`;

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`TMDB API Error: ${res.statusText}`);
  return (await res.json()) as T;
}

// --- HOMEPAGE LISTS ---
export function getPopularMovies(page = 1) {
  return tmdbFetch<PopularMovies>("/movie/popular", { page });
}

export function getTrending(
  mediaType: "all" | "movie" | "tv" | "person" = "all",
  timeWindow: "day" | "week" = "day",
) {
  return tmdbFetch<TrendingResults<"movie" | "tv">>(
    `/trending/${mediaType}/${timeWindow}`,
  );
}

export function getTopRatedMovies(page = 1) {
  return tmdbFetch<TopRatedMovies>("/movie/top_rated", { page });
}

export function getUpcomingMovies(page = 1) {
  return tmdbFetch<UpcomingMovies>("/movie/upcoming", { page });
}

export function getNowPlayingMovies(page = 1) {
  return tmdbFetch<MoviesPlayingNow>("/movie/now_playing", { page });
}

// --- SEARCH ---
export function searchMulti(query: string, page = 1) {
  return tmdbFetch<MultiSearchResult>("/search/multi", { query, page });
}

// --- MOVIE DETAILS ---
export function getMovieDetails(id: number) {
  return tmdbFetch<MovieDetails>(`/movie/${id}`);
}

export function getMovieCredits(id: number) {
  return tmdbFetch<Credits>(`/movie/${id}/credits`);
}

export function getMovieSimilar(id: number) {
  return tmdbFetch<SimilarMovies>(`/movie/${id}/similar`);
}

export function getMovieVideos(id: number) {
  return tmdbFetch<Videos>(`/movie/${id}/videos`);
}

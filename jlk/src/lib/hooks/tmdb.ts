import { createQuery } from "@tanstack/svelte-query";
import * as tmdbApi from "$lib/api/tmdb";

// Types
export type TimeWindow = "day" | "week";
export type TrendingMediaType = "all" | "movie" | "tv" | "person";

// Query Keys Factory
export const tmdbKeys = {
  all: ["tmdb"] as const,

  // Lists
  popularMovies: (page: number) =>
    [...tmdbKeys.all, "popular-movies", page] as const,
  trending: (mediaType: string, timeWindow: string) =>
    [...tmdbKeys.all, "trending", mediaType, timeWindow] as const,
  topRatedMovies: (page: number) =>
    [...tmdbKeys.all, "top-rated-movies", page] as const,
  upcomingMovies: (page: number) =>
    [...tmdbKeys.all, "upcoming-movies", page] as const,
  nowPlayingMovies: (page: number) =>
    [...tmdbKeys.all, "now-playing-movies", page] as const,

  // Search
  search: (query: string, page: number) =>
    [...tmdbKeys.all, "search", query, page] as const,

  // Movie Details
  movie: (id: number) => [...tmdbKeys.all, "movie", id] as const,
  movieDetails: (id: number) => [...tmdbKeys.movie(id), "details"] as const,
  movieCredits: (id: number) => [...tmdbKeys.movie(id), "credits"] as const,
  movieSimilar: (id: number) => [...tmdbKeys.movie(id), "similar"] as const,
  movieVideos: (id: number) => [...tmdbKeys.movie(id), "videos"] as const,
};

// --- HOMEPAGE HOOKS ---

export function usePopularMovies(page: number = 1) {
  return createQuery(() => ({
    queryKey: tmdbKeys.popularMovies(page),
    queryFn: () => tmdbApi.getPopularMovies(page),
  }));
}

export function useTrending(
  mediaType: TrendingMediaType = "all",
  timeWindow: TimeWindow = "day",
) {
  return createQuery(() => ({
    queryKey: tmdbKeys.trending(mediaType, timeWindow),
    queryFn: () => tmdbApi.getTrending(mediaType, timeWindow),
  }));
}

export function useTopRatedMovies(page: number = 1) {
  return createQuery(() => ({
    queryKey: tmdbKeys.topRatedMovies(page),
    queryFn: () => tmdbApi.getTopRatedMovies(page),
  }));
}

export function useUpcomingMovies(page: number = 1) {
  return createQuery(() => ({
    queryKey: tmdbKeys.upcomingMovies(page),
    queryFn: () => tmdbApi.getUpcomingMovies(page),
  }));
}

export function useNowPlayingMovies(page: number = 1) {
  return createQuery(() => ({
    queryKey: tmdbKeys.nowPlayingMovies(page),
    queryFn: () => tmdbApi.getNowPlayingMovies(page),
  }));
}

// --- SEARCH HOOK ---

export function useSearch(query: string, page: number = 1) {
  return createQuery(() => ({
    queryKey: tmdbKeys.search(query, page),
    queryFn: () => tmdbApi.searchMulti(query, page),
    // Only run the search query if there's actually a string to search for
    enabled: !!query && query.trim().length > 0,
  }));
}

// --- MOVIE DETAILS HOOKS ---

export function useMovieDetails(id: number) {
  return createQuery(() => ({
    queryKey: tmdbKeys.movieDetails(id),
    queryFn: () => tmdbApi.getMovieDetails(id),
    enabled: !!id && id > 0,
  }));
}

export function useMovieCredits(id: number) {
  return createQuery(() => ({
    queryKey: tmdbKeys.movieCredits(id),
    queryFn: () => tmdbApi.getMovieCredits(id),
    enabled: !!id && id > 0,
  }));
}

export function useMovieSimilar(id: number) {
  return createQuery(() => ({
    queryKey: tmdbKeys.movieSimilar(id),
    queryFn: () => tmdbApi.getMovieSimilar(id),
    enabled: !!id && id > 0,
  }));
}

export function useMovieVideos(id: number) {
  return createQuery(() => ({
    queryKey: tmdbKeys.movieVideos(id),
    queryFn: () => tmdbApi.getMovieVideos(id),
    enabled: !!id && id > 0,
  }));
}

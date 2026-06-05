export type MediaType = 'movie' | 'tv';

export interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  media_type?: MediaType;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  vote_average: number;
  popularity?: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCastMember {
  name: string;
}

export interface TMDBCrewMember {
  job: string;
  name: string;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBImageEntry {
  file_path: string;
  iso_639_1: string | null;
  aspect_ratio: number;
}

export interface TMDBImages {
  logos: TMDBImageEntry[];
}

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBVideos {
  results: TMDBVideo[];
}

export interface TMDBMovieDetail extends TMDBItem {
  runtime: number;
  tagline?: string;
  status?: string;
  genres: TMDBGenre[];
  credits: TMDBCredits;
  images?: TMDBImages;
  videos?: TMDBVideos;
}

export interface TMDBTVDetail extends TMDBItem {
  number_of_seasons: number;
  number_of_episodes: number;
  tagline?: string;
  status?: string;
  genres: TMDBGenre[];
  created_by: Array<{ name: string }>;
  credits: TMDBCredits;
  seasons?: Array<{ season_number: number; episode_count: number; name: string }>;
  images?: TMDBImages;
  videos?: TMDBVideos;
}

export interface TMDBEpisode {
  episode_number: number;
  name: string;
  still_path: string | null;
  overview: string;
  runtime?: number;
}

export interface TMDBSeason {
  season_number: number;
  name: string;
  episodes: TMDBEpisode[];
}

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

export interface TMDBMovieDetail extends TMDBItem {
  runtime: number;
  genres: TMDBGenre[];
  credits: TMDBCredits;
}

export interface TMDBTVDetail extends TMDBItem {
  number_of_seasons: number;
  number_of_episodes: number;
  genres: TMDBGenre[];
  created_by: Array<{ name: string }>;
  credits: TMDBCredits;
  seasons?: Array<{ season_number: number; episode_count: number; name: string }>;
}

export interface TMDBEpisode {
  episode_number: number;
  name: string;
  still_path: string | null;
  overview: string;
}

export interface TMDBSeason {
  season_number: number;
  name: string;
  episodes: TMDBEpisode[];
}

export const keys = {
  session: () => ["session"] as const,
  settings: () => ["settings"] as const,
  profiles: () => ["profiles"] as const,
  history: (profileId: string) => ["history", profileId] as const,
  watchlist: (profileId: string) => ["watchlist", profileId] as const,
  watchlistDetails: (profileId: string, mediaIds: string[]) =>
    ["watchlistDetails", profileId, mediaIds] as const,
  trending: () => ["trending"] as const,
  popularMovies: () => ["popularMovies"] as const,
  popularTV: () => ["popularTV"] as const,
  topRated: () => ["topRated"] as const,
  movie: (id: number) => ["movie", id] as const,
  tv: (id: number) => ["tv", id] as const,
  tvSeason: (id: number, season: number) => ["tvSeason", id, season] as const,
  movieRecs: (id: number) => ["movieRecs", id] as const,
  tvRecs: (id: number) => ["tvRecs", id] as const,
  recommendedForYou: (profileId: string, itemIds: number[]) =>
    ["recommendedForYou", profileId, itemIds] as const,
  becauseOf: (profileId: string, mediaId: string) =>
    ["becauseOf", profileId, mediaId] as const,
  continueItems: (profileId: string, mediaIds: string[]) =>
    ["continueItems", profileId, mediaIds] as const,
  watchAgainItems: (profileId: string, mediaIds: string[]) =>
    ["watchAgainItems", profileId, mediaIds] as const,
  search: (q: string) => ["search", q] as const,
};

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getMovie,
  getTV,
  getMovieRecs,
  getTVRecs,
  getRecommendedForYou,
  getTopRated,
} from "../services/tmdb";
import { apiGet } from "../services/api";
import { useProfile } from "../context/ProfileContext";
import useWatchHistory, { type ParsedHistoryEntry } from "./useWatchHistory";
import { keys } from "../lib/queryKeys";
import type { TMDBItem, TMDBMovieDetail, TMDBTVDetail } from "../types/tmdb";
import type { ItemExtra } from "../components/ContentRow";

interface WatchlistEntry {
  id: string;
  mediaId: string;
  mediaType: string;
}

export interface ContinueItem {
  tmdbItem: TMDBItem;
  progress: number;
  season?: number;
  episode?: number;
  label?: string;
}

async function resolveContinueItems(
  entries: ParsedHistoryEntry[],
): Promise<ContinueItem[]> {
  const seen = new Set<string>();
  const unique = entries.filter((e) => {
    const key = `${e.mediaType}:${e.tmdbId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = await Promise.allSettled(
    unique.map(async (e): Promise<ContinueItem | null> => {
      if (e.mediaType === "movie" || !e.mediaId.startsWith("tv:")) {
        const m = await getMovie(e.tmdbId);
        return {
          tmdbItem: { ...m, media_type: "movie" as const },
          progress: e.duration > 0 ? e.position / e.duration : 0,
        };
      }
      const show = await getTV(e.tmdbId);
      const progress = e.duration > 0 ? e.position / e.duration : 0;
      const label = e.season != null && e.episode != null
        ? `S${e.season} E${e.episode}`
        : undefined;
      return {
        tmdbItem: { ...show, media_type: "tv" as const },
        progress,
        season: e.season,
        episode: e.episode,
        label,
      };
    }),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ContinueItem | null> =>
        r.status === "fulfilled" && r.value !== null,
    )
    .map((r) => r.value as ContinueItem);
}

async function resolveWatchAgainItems(
  entries: ParsedHistoryEntry[],
): Promise<ContinueItem[]> {
  const seen = new Set<string>();
  const unique = entries
    .filter((e) => {
      const key = `${e.mediaType}:${e.tmdbId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);

  const results = await Promise.allSettled(
    unique.map(async (e): Promise<ContinueItem | null> => {
      if (e.mediaType === "movie" || !e.mediaId.startsWith("tv:")) {
        const m = await getMovie(e.tmdbId);
        return { tmdbItem: { ...m, media_type: "movie" as const }, progress: 0 };
      }
      const show = await getTV(e.tmdbId);
      return { tmdbItem: { ...show, media_type: "tv" as const }, progress: 0 };
    }),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ContinueItem | null> =>
        r.status === "fulfilled" && r.value !== null,
    )
    .map((r) => r.value as ContinueItem);
}

export default function useHomeData() {
  const { profile } = useProfile();
  const profileId = profile?.id ?? "";
  const { inProgress, finished, allHistory, tvContinue } = useWatchHistory();

  // ── Static TMDB data ────────────────────────────────────────────────────

  const { data: trendingData } = useQuery({
    queryKey: keys.trending(),
    queryFn: async () => {
      const items = await getTrending();
      const top5 = items.slice(0, 5);
      const details = await Promise.allSettled(
        top5.map((item) =>
          item.media_type === "movie"
            ? getMovie(item.id).then((m) => ({
                ...m,
                media_type: "movie" as const,
              }))
            : getTV(item.id).then((t) => ({
                ...t,
                media_type: "tv" as const,
              })),
        ),
      );
      const heroItems = details
        .filter((r) => r.status === "fulfilled")
        .map(
          (r) =>
            (r as PromiseFulfilledResult<TMDBMovieDetail | TMDBTVDetail>).value,
        );
      return { trending: items, heroItems };
    },
  });

  const { data: movies = [] } = useQuery({
    queryKey: keys.popularMovies(),
    queryFn: getPopularMovies,
  });

  const { data: tv = [] } = useQuery({
    queryKey: keys.popularTV(),
    queryFn: getPopularTV,
  });

  const { data: topRated = [] } = useQuery({
    queryKey: keys.topRated(),
    queryFn: getTopRated,
  });

  // ── Watchlist → resolved TMDB items ────────────────────────────────────

  const { data: watchlistEntries = [] } = useQuery({
    queryKey: keys.watchlist(profileId),
    queryFn: () =>
      apiGet<WatchlistEntry[]>(`/api/profiles/${profile!.id}/watchlist`),
    enabled: !!profile,
    staleTime: 60 * 1000,
  });

  const watchlistMediaIds = watchlistEntries.map((e) => e.mediaId);

  const { data: myList = [] } = useQuery({
    queryKey: keys.watchlistDetails(profileId, watchlistMediaIds),
    queryFn: () =>
      Promise.all(
        watchlistEntries.map((e) =>
          e.mediaType === "movie"
            ? getMovie(Number(e.mediaId)).then((m) => ({
                ...m,
                media_type: "movie" as const,
              }))
            : getTV(Number(e.mediaId)).then((t) => ({
                ...t,
                media_type: "tv" as const,
              })),
        ),
      ),
    enabled: watchlistEntries.length > 0,
    staleTime: 60 * 1000,
  });

  // ── Continue watching ───────────────────────────────────────────────────
  // Combine in-progress movies with tvContinue (handles both in-progress and
  // next-episode-after-finishing for TV shows).
  const movieInProgress = inProgress.filter((e) => e.mediaType !== "tv");
  const continueEntries = [...movieInProgress, ...tvContinue];
  const continueKeys = continueEntries.map((e) =>
    e.mediaType === "tv"
      ? `tv:${e.tmdbId}:${e.season ?? 1}:${e.episode ?? 1}`
      : e.mediaId,
  );

  const { data: continueItemsRaw = [] } = useQuery({
    queryKey: keys.continueItems(profileId, continueKeys),
    queryFn: () => resolveContinueItems(continueEntries),
    enabled: continueEntries.length > 0,
    staleTime: 60 * 1000,
  });

  // ── Watch again ─────────────────────────────────────────────────────────

  const finishedIds = finished.map((e) => e.mediaId);

  const { data: watchAgainItemsRaw = [] } = useQuery({
    queryKey: keys.watchAgainItems(profileId, finishedIds),
    queryFn: () => resolveWatchAgainItems(finished),
    enabled: finished.length > 0,
    staleTime: 60 * 1000,
  });

  // ── Recommended for you (based on watchlist genres) ─────────────────────

  const myListIds = myList.map((i) => i.id);

  const { data: recommended = [] } = useQuery({
    queryKey: keys.recommendedForYou(profileId, myListIds),
    queryFn: () => {
      const genreCounts = new Map<number, number>();
      myList.forEach((item) => {
        const ids =
          item.genre_ids ??
          (item as unknown as { genres?: { id: number }[] }).genres?.map(
            (g) => g.id,
          ) ??
          [];
        ids.forEach((g: number) =>
          genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1),
        );
      });
      if (!genreCounts.size) return [];
      const topGenres = [...genreCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([id]) => id);
      return getRecommendedForYou(topGenres);
    },
    enabled: myList.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // ── Because you watched ─────────────────────────────────────────────────

  const latestHistory = allHistory[0];

  const { data: becauseOf = null } = useQuery({
    queryKey: keys.becauseOf(profileId, latestHistory?.mediaId ?? ""),
    queryFn: async () => {
      const entry = latestHistory;
      if (!entry) return null;
      const detail =
        entry.mediaType === "movie"
          ? await getMovie(entry.tmdbId)
          : await getTV(entry.tmdbId);
      const name = "title" in detail ? detail.title : detail.name;
      const recs =
        entry.mediaType === "movie"
          ? await getMovieRecs(entry.tmdbId)
          : await getTVRecs(entry.tmdbId);
      return recs.length
        ? { items: recs, title: `Because You Watched ${name}` }
        : null;
    },
    enabled: !!latestHistory,
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived extras map for continue items ───────────────────────────────

  const continueExtras = useMemo(() => {
    const map = new Map<string, ItemExtra>();
    continueItemsRaw.forEach((ci) =>
      map.set(`${ci.tmdbItem.media_type}:${ci.tmdbItem.id}`, {
        progress: ci.progress,
        label: ci.label,
      }),
    );
    return map;
  }, [continueItemsRaw]);

  return {
    heroItems: trendingData?.heroItems ?? [],
    trending: trendingData?.trending ?? [],
    movies,
    tv,
    myList,
    recommended,
    becauseOf,
    topRated,
    continueItems: continueItemsRaw.map((ci) => ci.tmdbItem),
    continueExtras,
    watchAgainItems: watchAgainItemsRaw.map((ci) => ci.tmdbItem),
  };
}

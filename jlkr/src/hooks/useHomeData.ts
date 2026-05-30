import { useState, useEffect, useMemo } from "react";
import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getMovie,
  getTV,
  getTVSeason,
  getMovieRecs,
  getTVRecs,
  getRecommendedForYou,
  getTopRated,
} from "../services/tmdb";
import { apiGet } from "../services/api";
import { useProfile } from "../context/ProfileContext";
import useWatchHistory, { type ParsedHistoryEntry } from "./useWatchHistory";
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

async function resolveNextEpisode(entry: ParsedHistoryEntry): Promise<{ season: number; episode: number }> {
  if (!entry.season || !entry.episode) return { season: 1, episode: 1 };
  try {
    const season = await getTVSeason(entry.tmdbId, entry.season);
    const episodeCount = season.episodes?.length ?? 0;
    if (entry.episode < episodeCount) return { season: entry.season, episode: entry.episode + 1 };
    return { season: entry.season + 1, episode: 1 };
  } catch {
    return { season: entry.season, episode: entry.episode + 1 };
  }
}

async function resolveContinueItems(entries: ParsedHistoryEntry[]): Promise<ContinueItem[]> {
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
        return { tmdbItem: { ...m, media_type: "movie" as const }, progress: e.duration > 0 ? e.position / e.duration : 0 };
      }
      const show = await getTV(e.tmdbId);
      return { tmdbItem: { ...show, media_type: "tv" as const }, progress: e.duration > 0 ? e.position / e.duration : 0, season: e.season, episode: e.episode };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ContinueItem | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value as ContinueItem);
}

async function resolveWatchAgainItems(entries: ParsedHistoryEntry[]): Promise<ContinueItem[]> {
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
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ContinueItem | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value as ContinueItem);
}

export default function useHomeData() {
  const { profile } = useProfile();
  const { inProgress, finished, allHistory } = useWatchHistory();

  const [heroItems, setHeroItems] = useState<Array<TMDBMovieDetail | TMDBTVDetail>>([]);
  const [trending, setTrending] = useState<TMDBItem[]>([]);
  const [movies, setMovies] = useState<TMDBItem[]>([]);
  const [tv, setTv] = useState<TMDBItem[]>([]);
  const [myList, setMyList] = useState<TMDBItem[]>([]);
  const [recommended, setRecommended] = useState<TMDBItem[]>([]);
  const [becauseOf, setBecauseOf] = useState<{ items: TMDBItem[]; title: string } | null>(null);
  const [topRated, setTopRated] = useState<TMDBItem[]>([]);
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);
  const [watchAgainItems, setWatchAgainItems] = useState<ContinueItem[]>([]);

  useEffect(() => {
    getTrending().then(async (items) => {
      setTrending(items);
      const top5 = items.slice(0, 5);
      const details = await Promise.allSettled(
        top5.map((item) =>
          item.media_type === "movie"
            ? getMovie(item.id).then((m) => ({ ...m, media_type: "movie" as const }))
            : getTV(item.id).then((t) => ({ ...t, media_type: "tv" as const }))
        )
      );
      setHeroItems(
        details
          .filter((r): r is PromiseFulfilledResult<TMDBMovieDetail | TMDBTVDetail> => r.status === "fulfilled")
          .map((r) => r.value)
      );
    }).catch(console.error);
    getPopularMovies().then(setMovies).catch(console.error);
    getPopularTV().then(setTv).catch(console.error);
    getTopRated().then(setTopRated).catch(console.error);
  }, []);

  useEffect(() => {
    if (!profile) { setMyList([]); return; }
    let cancelled = false;
    apiGet<WatchlistEntry[]>(`/api/profiles/${profile.id}/watchlist`)
      .then((entries) =>
        Promise.all(
          entries.map((e) =>
            e.mediaType === "movie"
              ? getMovie(Number(e.mediaId)).then((m) => ({ ...m, media_type: "movie" as const }))
              : getTV(Number(e.mediaId)).then((t) => ({ ...t, media_type: "tv" as const }))
          )
        )
      )
      .then((items) => { if (!cancelled) setMyList(items); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [profile]);

  useEffect(() => {
    if (!inProgress.length) { setContinueItems([]); return; }
    let cancelled = false;
    const run = async () => {
      await Promise.allSettled(
        finished.filter((e) => e.mediaId.startsWith("tv:")).map((e) => resolveNextEpisode(e))
      );
      const items = await resolveContinueItems(inProgress);
      if (!cancelled) setContinueItems(items);
    };
    run().catch(() => {});
    return () => { cancelled = true; };
  }, [inProgress, finished]);

  useEffect(() => {
    if (!finished.length) { setWatchAgainItems([]); return; }
    let cancelled = false;
    resolveWatchAgainItems(finished).then((items) => { if (!cancelled) setWatchAgainItems(items); }).catch(() => {});
    return () => { cancelled = true; };
  }, [finished]);

  useEffect(() => {
    const genreCounts = new Map<number, number>();
    myList.forEach((item) => {
      const ids = item.genre_ids ?? (item as any).genres?.map((g: { id: number }) => g.id) ?? [];
      ids.forEach((g: number) => genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1));
    });
    if (!genreCounts.size) { setRecommended([]); return; }
    const topGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
    let cancelled = false;
    getRecommendedForYou(topGenres).then((items) => { if (!cancelled) setRecommended(items); }).catch(() => {});
    return () => { cancelled = true; };
  }, [myList]);

  useEffect(() => {
    if (!allHistory.length) { setBecauseOf(null); return; }
    const latest = allHistory[0];
    let cancelled = false;
    const run = async () => {
      const detail = latest.mediaType === "movie" ? await getMovie(latest.tmdbId) : await getTV(latest.tmdbId);
      const name = "title" in detail ? detail.title : detail.name;
      const recs = latest.mediaType === "movie" ? await getMovieRecs(latest.tmdbId) : await getTVRecs(latest.tmdbId);
      if (!cancelled && recs.length) setBecauseOf({ items: recs, title: `Because You Watched ${name}` });
    };
    run().catch(() => {});
    return () => { cancelled = true; };
  }, [allHistory]);

  const continueExtras = useMemo(() => {
    const map = new Map<string, ItemExtra>();
    continueItems.forEach((ci) => map.set(`${ci.tmdbItem.media_type}:${ci.tmdbItem.id}`, { progress: ci.progress, label: ci.label }));
    return map;
  }, [continueItems]);

  return {
    heroItems,
    trending,
    movies,
    tv,
    myList,
    recommended,
    becauseOf,
    topRated,
    continueItems: continueItems.map((ci) => ci.tmdbItem),
    continueExtras,
    watchAgainItems: watchAgainItems.map((ci) => ci.tmdbItem),
  };
}

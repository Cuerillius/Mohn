import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../services/api";
import { useProfile } from "../context/ProfileContext";
import { keys } from "../lib/queryKeys";

export interface HistoryEntry {
  id: string;
  mediaId: string;
  mediaType: string;
  position: number;
  duration: number;
  watchedAt: string;
}

export interface ParsedHistoryEntry extends HistoryEntry {
  tmdbId: number;
  season?: number;
  episode?: number;
}

export function parseMediaId(mediaId: string): {
  tmdbId: number;
  season?: number;
  episode?: number;
} {
  const parts = mediaId.split(":");
  if (parts[0] === "tv") {
    return {
      tmdbId: Number(parts[1]),
      season: Number(parts[2]),
      episode: Number(parts[3]),
    };
  }
  return { tmdbId: Number(parts[1]) };
}

function parseEntries(entries: HistoryEntry[]) {
  const parsed = entries.map((e) => ({ ...e, ...parseMediaId(e.mediaId) }));

  const inProgress = parsed.filter(
    (e) => e.position > 30 && e.duration > 0 && e.position / e.duration < 0.9,
  );
  const finished = parsed.filter((e) => e.position === 0 && e.duration > 0);

  // For each unique TV show, the most recent episode to "continue".
  // If the latest episode is finished, synthesize a next-episode entry (duration=0).
  const tvSeen = new Set<number>();
  const tvContinue = parsed
    .filter((e) => e.mediaType === "tv")
    .filter((e) => {
      if (tvSeen.has(e.tmdbId)) return false;
      tvSeen.add(e.tmdbId);
      return true;
    })
    .filter((e) => {
      const isInProgress = e.position > 30 && e.duration > 0 && e.position / e.duration < 0.9;
      const isFinished = e.position === 0 && e.duration > 0;
      return isInProgress || isFinished;
    })
    .map((e) => {
      const isFinished = e.position === 0 && e.duration > 0;
      if (isFinished && e.episode != null) {
        return { ...e, episode: e.episode + 1, position: 0, duration: 0 };
      }
      return e;
    });

  return { allHistory: parsed, inProgress, finished, tvContinue };
}

export default function useWatchHistory() {
  const { profile } = useProfile();

  const { data, isLoading } = useQuery({
    queryKey: keys.history(profile?.id ?? ""),
    queryFn: () =>
      apiGet<HistoryEntry[]>(`/api/profiles/${profile!.id}/history`),
    enabled: !!profile,
    select: parseEntries,
    staleTime: 30 * 1000,
  });

  return {
    inProgress: data?.inProgress ?? [],
    finished: data?.finished ?? [],
    allHistory: data?.allHistory ?? [],
    tvContinue: data?.tvContinue ?? [],
    isLoading,
  };
}

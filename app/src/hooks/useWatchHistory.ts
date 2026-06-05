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
  return {
    allHistory: parsed,
    inProgress: parsed.filter(
      (e) => e.position > 30 && e.duration > 0 && e.position / e.duration < 0.9,
    ),
    finished: parsed.filter((e) => e.position === 0 && e.duration > 0),
  };
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
    isLoading,
  };
}

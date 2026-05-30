import { useState, useEffect } from "react";
import { apiGet } from "../services/api";
import { useProfile } from "../context/ProfileContext";

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

export function parseMediaId(mediaId: string): { tmdbId: number; season?: number; episode?: number } {
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

export default function useWatchHistory() {
  const { profile } = useProfile();
  const [inProgress, setInProgress] = useState<ParsedHistoryEntry[]>([]);
  const [finished, setFinished] = useState<ParsedHistoryEntry[]>([]);
  const [allHistory, setAllHistory] = useState<ParsedHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setInProgress([]);
      setFinished([]);
      setAllHistory([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    apiGet<HistoryEntry[]>(`/api/profiles/${profile.id}/history`)
      .then((entries) => {
        if (cancelled) return;
        const parsed = entries.map((e) => ({ ...e, ...parseMediaId(e.mediaId) }));
        setAllHistory(parsed);
        setInProgress(
          parsed.filter(
            (e) => e.position > 30 && e.duration > 0 && e.position / e.duration < 0.9
          )
        );
        setFinished(
          parsed.filter((e) => e.position === 0 && e.duration > 0)
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  return { inProgress, finished, allHistory, isLoading };
}

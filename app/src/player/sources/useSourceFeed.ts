import { useEffect, useState } from "react";
import { getExternalIds } from "../../services/tmdb";
import { fetchAddonSources } from "../addons";
import { checkCached, chooseFile } from "../torbox";
import type { Source } from "../types";

export interface SourceFeed {
  sources: Source[];
  /** True until the IMDB id is resolved, every addon has returned, and the cache check is done. */
  loading: boolean;
  /** Set only when the feed cannot produce anything (no addons, no imdb id). */
  error: string | null;
}

interface Params {
  type: "movie" | "tv" | undefined;
  tmdbId: string | undefined;
  season: string | undefined;
  episode: string | undefined;
  activeAddonUrls: string[];
  /** When false the feed stays idle (e.g. web gating not yet passed). */
  enabled: boolean;
}

/**
 * MVP source resolution: await ALL addons, then run a single TorBox cache check,
 * then surface the full list. Simple and correct ordering — the session only
 * auto-selects once `loading` is false, so a cached source is always preferred
 * over kicking off a slow uncached download.
 */
export function useSourceFeed({
  type,
  tmdbId,
  season,
  episode,
  activeAddonUrls,
  enabled,
}: Params): SourceFeed {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !tmdbId || !type) return;

    let cancelled = false;
    setSources([]);
    setError(null);
    setLoading(true);

    async function run() {
      try {
        const { imdb_id } = await getExternalIds(
          Number(tmdbId),
          type === "tv" ? "tv" : "movie",
        );
        if (cancelled) return;
        if (!imdb_id) throw new Error("Couldn't find an IMDB id for this title.");
        if (activeAddonUrls.length === 0) {
          throw new Error("No active addons. Enable at least one in Settings.");
        }

        const streamId =
          type === "tv" ? `${imdb_id}:${season ?? 1}:${episode ?? 1}` : imdb_id;
        const addonType = type === "tv" ? "series" : "movie";
        const seasonNum = type === "tv" && season ? Number(season) : undefined;
        const episodeNum = type === "tv" && episode ? Number(episode) : undefined;

        // Await every addon, then dedup by infoHash in one pass.
        const results = await Promise.allSettled(
          activeAddonUrls.map((url) => fetchAddonSources(url, addonType, streamId)),
        );
        if (cancelled) return;

        const seen = new Set<string>();
        const list: Source[] = [];
        for (const r of results) {
          if (r.status !== "fulfilled") continue;
          for (const s of r.value) {
            if (seen.has(s.infoHash)) continue;
            seen.add(s.infoHash);
            list.push(s);
          }
        }

        // Single cache check for all hashes; fill cached + per-file size.
        const cache = await checkCached(list.map((s) => s.infoHash)).catch(
          () => ({}) as Awaited<ReturnType<typeof checkCached>>,
        );
        if (cancelled) return;
        for (const s of list) {
          const hit = cache[s.infoHash];
          if (!hit) continue;
          s.cached = true;
          const file = hit.files
            ? chooseFile(hit.files, {
                fileIdx: s.fileIdx,
                filename: s.filename,
                season: seasonNum,
                episode: episodeNum,
              })
            : undefined;
          if (file) s.fileSizeBytes = file.size;
          else if (hit.size) s.fileSizeBytes = hit.size;
        }

        setSources(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, tmdbId, type, season, episode, activeAddonUrls.join(",")]);

  return { sources, loading, error };
}

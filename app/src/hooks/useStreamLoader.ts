import { useState, useEffect, useRef } from "react";
import { getExternalIds } from "../services/tmdb";
import { fetchAllStreams, enrichStream, autoSelectStream, groupByResolution } from "../services/addons";
import { checkCached, createAndResolveLink } from "../services/torbox";
import { isTauri, isMobileBrowser } from "../services/streamPlayer";
import { apiGet } from "../services/api";
import type { EnrichedStream, Resolution } from "../types/torbox";
import type { Platform } from "../lib/streamUtils";

export type LoadState = "loading" | "ready" | "error";

export interface StreamLoaderResult {
  loadState: LoadState;
  loadError: string;
  loadingStep: number;
  streams: EnrichedStream[];
  selected: EnrichedStream | null;
  switchingTo: EnrichedStream | null;
  resolvedUrl: string | null;
  resolvedMimetype: string | undefined;
  resumePosition: number;
  platform: Platform;
  selectedResolutionLabel: string;
  switching: boolean;
  switchError: string;
  selectStream: (stream: EnrichedStream) => Promise<void>;
  selectResolution: (label: string) => void;
  setLoadState: (s: LoadState) => void;
}

interface UseStreamLoaderParams {
  type: string | undefined;
  id: string | undefined;
  season: string | undefined;
  episode: string | undefined;
  activeAddonUrls: string[];
  settingsLoading: boolean;
  profileId: string | undefined;
}

export function useStreamLoader({
  type,
  id,
  season,
  episode,
  activeAddonUrls,
  settingsLoading,
  profileId,
}: UseStreamLoaderParams): StreamLoaderResult {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const [streams, setStreams] = useState<EnrichedStream[]>([]);
  const [selected, setSelected] = useState<EnrichedStream | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedMimetype, setResolvedMimetype] = useState<string | undefined>(undefined);
  const [resumePosition, setResumePosition] = useState(0);
  const [platform, setPlatform] = useState<Platform>("web");
  const [selectedResolutionLabel, setSelectedResolutionLabel] = useState("Unknown");
  const [switching, setSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<EnrichedStream | null>(null);
  const [switchError, setSwitchError] = useState("");

  const progressMediaId =
    type === "tv" ? `tv:${id}:${season ?? 1}:${episode ?? 1}` : `movie:${id}`;
  const progressMediaIdRef = useRef(progressMediaId);
  progressMediaIdRef.current = progressMediaId;

  useEffect(() => {
    if (!id || !type || settingsLoading) return;

    let cancelled = false;

    async function run() {
      try {
        const tauri = isTauri();
        const mobile = isMobileBrowser();
        const detectedPlatform: Platform = tauri ? "tauri" : mobile ? "mobileweb" : "web";
        setPlatform(detectedPlatform);

        const savedPosPromise = profileId
          ? apiGet<{ position: number; duration: number }>(
              `/api/profiles/${profileId}/history/progress?mediaId=${encodeURIComponent(progressMediaIdRef.current)}`,
            ).catch(() => ({ position: 0, duration: 0 }))
          : Promise.resolve({ position: 0, duration: 0 });

        if (activeAddonUrls.length === 0)
          throw new Error("No active addons found. Please enable at least one addon in Settings.");

        setLoadingStep(0);
        const { imdb_id } = await getExternalIds(Number(id), type === "tv" ? "tv" : "movie");
        if (!imdb_id)
          throw new Error("We couldn't locate an IMDB ID for this media in our database.");
        if (cancelled) return;

        setLoadingStep(1);
        const streamId = type === "tv" ? `${imdb_id}:${season ?? 1}:${episode ?? 1}` : imdb_id;
        const raw = await fetchAllStreams(
          activeAddonUrls,
          type === "tv" ? "series" : "movie",
          streamId,
        );
        if (raw.length === 0)
          throw new Error("Your addons didn't return any streams. Make sure they are configured properly.");
        if (cancelled) return;

        setLoadingStep(2);
        const enriched = raw.map(enrichStream);
        const hashes = enriched.map((s) => s.infoHash).filter(Boolean) as string[];
        const cacheResult = await checkCached(hashes);
        if (cancelled) return;

        for (const s of enriched) {
          if (s.infoHash && cacheResult.data?.[s.infoHash]) s.cached = true;
        }

        setLoadingStep(3);
        const best = autoSelectStream(enriched);
        if (!best?.infoHash)
          throw new Error("Streams were found, but none matched your playback criteria or were playable.");

        setLoadingStep(4);
        const magnet = best.magnetLink ?? `magnet:?xt=urn:btih:${best.infoHash}`;
        const { url, mimetype } = await createAndResolveLink(magnet, best.fileIdx);
        if (cancelled) return;

        const { position: savedPos } = await savedPosPromise;

        setStreams(enriched);
        setSelected(best);
        setSelectedResolutionLabel(best.resolution);
        setResolvedUrl(url);
        setResolvedMimetype(mimetype);
        setResumePosition(savedPos ?? 0);
        setLoadState("ready");
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setLoadState("error");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, season, episode, settingsLoading, activeAddonUrls.join(","), profileId]);

  async function selectStream(stream: EnrichedStream) {
    if (stream.infoHash === selected?.infoHash || switching) return;
    const prevSelected = selected;
    setSwitching(true);
    setSwitchingTo(stream);
    setSwitchError("");
    // Optimistically highlight the new stream immediately
    setSelected(stream);
    setSelectedResolutionLabel(stream.resolution);
    try {
      const magnet = stream.magnetLink ?? `magnet:?xt=urn:btih:${stream.infoHash}`;
      const { url, mimetype } = await createAndResolveLink(magnet, stream.fileIdx);
      setResolvedUrl(url);
      setResolvedMimetype(mimetype);
      if (loadState === "error") setLoadState("ready");
    } catch (e) {
      // Revert on failure
      setSelected(prevSelected);
      if (prevSelected) setSelectedResolutionLabel(prevSelected.resolution);
      setSwitchError(e instanceof Error ? e.message : "Failed to switch stream");
    } finally {
      setSwitching(false);
      setSwitchingTo(null);
    }
  }

  function selectResolution(label: string) {
    setSelectedResolutionLabel(label);
    const groups = groupByResolution(streams);
    const group = groups[label as Resolution] ?? [];
    if (group.length > 0 && group[0].infoHash !== selected?.infoHash) {
      selectStream(group[0]);
    }
  }

  return {
    loadState,
    loadError,
    loadingStep,
    streams,
    selected,
    resolvedUrl,
    resolvedMimetype,
    resumePosition,
    platform,
    selectedResolutionLabel,
    switching,
    switchingTo,
    switchError,
    selectStream,
    selectResolution,
    setLoadState,
  };
}

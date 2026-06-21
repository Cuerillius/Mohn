import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import type { Platform } from "../platform";
import {
  resolvePlayback,
  reselectWebStream,
  type EpisodeContext,
} from "./resolvePlayback";
import {
  usePlaybackTelemetry,
  type Telemetry,
  type TelemetryMode,
} from "./usePlaybackTelemetry";
import { MpvBackend } from "./backends/mpvBackend";
import { HlsBackend } from "./backends/hlsBackend";
import type { PlaybackBackend } from "./PlaybackBackend";
import type { ResolvedPlayback, Source } from "../types";
import type { LoadStep } from "@/components/MultiStepLoader";

/** Web-only audio/subtitle/resolution selection (re-requests an HLS stream). */
export interface WebSel {
  audioIndex: number;
  subtitleIndex: number | null;
  resolutionIndex: number | null;
}

export const DEFAULT_WEB_SEL: WebSel = {
  audioIndex: 0,
  subtitleIndex: null,
  resolutionIndex: null,
};

export interface PlaybackController {
  videoRef: RefObject<HTMLVideoElement>;
  telemetry: Telemetry;
  mode: TelemetryMode;
  resolved: ResolvedPlayback | null;
  selected: Source | null;
  switchingTo: Source | null;
  switching: boolean;
  phase: "idle" | "playing";
  webSel: WebSel;
  /** Sub-step for the loading overlay while a source is being prepared/started. */
  loadStep: LoadStep;
  error: string | null;
  setError: (e: string | null) => void;
  /** Clear playback state when navigating to a different title. */
  reset: () => void;
  playSource: (source: Source) => Promise<void>;
  selectWebAudio: (audioIndex: number) => void;
  selectWebSubtitle: (subtitleIndex: number | null) => void;
  selectWebResolution: (resolutionIndex: number | null) => void;
}

/**
 * Owns the playback engine: the active backend (mpv on desktop, hls.js on web),
 * telemetry wiring, and the resolve→load lifecycle for a chosen source. The
 * orchestrating page feeds it sources (via the source feed) and reads back the
 * derived state it needs to render.
 */
export function usePlaybackController(
  platform: Platform,
  episode: EpisodeContext,
): PlaybackController {
  const isTauriPlatform = platform === "tauri";
  const seasonNum = episode.season;
  const episodeNum = episode.episode;

  const videoRef = useRef<HTMLVideoElement>(null);

  const [selected, setSelected] = useState<Source | null>(null);
  const [switchingTo, setSwitchingTo] = useState<Source | null>(null);
  const [switching, setSwitching] = useState(false);
  const [resolved, setResolved] = useState<ResolvedPlayback | null>(null);
  const [webSel, setWebSel] = useState<WebSel>(DEFAULT_WEB_SEL);
  const [phase, setPhase] = useState<"idle" | "playing">("idle");
  const [loadStep, setLoadStep] = useState<LoadStep>("prepare");
  const [error, setError] = useState<string | null>(null);

  const mode: TelemetryMode = useMemo(() => {
    if (!resolved) return null;
    return isTauriPlatform ? "mpv" : "hls";
  }, [resolved, isTauriPlatform]);

  const telemetry = usePlaybackTelemetry(mode, videoRef);

  // ── Refs for stable callbacks ──────────────────────────────────────────────
  const backendRef = useRef<PlaybackBackend | null>(null);
  const hlsErrorRef = useRef<() => void>(() => {});
  const resolvedRef = useRef<ResolvedPlayback | null>(null);
  resolvedRef.current = resolved;
  const switchingRef = useRef(false);
  switchingRef.current = switching;
  const webSelRef = useRef(webSel);
  webSelRef.current = webSel;
  const timeRef = useRef(0);
  timeRef.current = telemetry.timePos;
  const clearError = telemetry.clearError;
  const handleMpvRef = useRef(telemetry.handleMpvProperty);
  handleMpvRef.current = telemetry.handleMpvProperty;

  // ── Backend lifecycle ──────────────────────────────────────────────────────
  const ensureBackend = useCallback((): PlaybackBackend => {
    if (backendRef.current) return backendRef.current;
    const b: PlaybackBackend = isTauriPlatform
      ? new MpvBackend((ev) => handleMpvRef.current(ev))
      : new HlsBackend(
          () => videoRef.current,
          () => hlsErrorRef.current(),
        );
    backendRef.current = b;
    return b;
  }, [isTauriPlatform]);

  useEffect(() => {
    return () => {
      backendRef.current?.destroy();
      backendRef.current = null;
    };
  }, []);

  // On a fatal post-manifest HLS error, surface the error (lean: no auto-advance).
  hlsErrorRef.current = () => {
    setError("Playback stopped. Pick another source.");
  };

  // ── Resolve + load a source ────────────────────────────────────────────────
  const playSource = useCallback(
    async (source: Source): Promise<void> => {
      if (switchingRef.current) return;
      switchingRef.current = true;
      setSwitching(true);
      setSwitchingTo(source);
      setSelected(source);
      try {
        setLoadStep("prepare");
        const r = await resolvePlayback(source, platform, DEFAULT_WEB_SEL, {
          season: seasonNum,
          episode: episodeNum,
        });
        resolvedRef.current = r;
        setResolved(r);
        setWebSel(DEFAULT_WEB_SEL);
        setLoadStep("start");
        await ensureBackend().load(r.url);
        clearError();
        setPhase("playing");
        setError(null);
      } catch (err) {
        console.error(
          "[player] source failed:",
          err instanceof Error ? err.message : err,
        );
        setError(
          "This source couldn't be played. Pick another from the sources list.",
        );
      } finally {
        switchingRef.current = false;
        setSwitching(false);
        setSwitchingTo(null);
      }
    },
    [platform, ensureBackend, clearError, seasonNum, episodeNum],
  );

  // ── Web re-stream for audio/subtitle/resolution changes ─────────────────────
  const applyWebSelection = useCallback(
    async (next: WebSel) => {
      const handle = resolvedRef.current?.handle;
      if (!handle || switchingRef.current) return;
      switchingRef.current = true;
      setSwitching(true);
      const pos = timeRef.current;
      try {
        const r = await reselectWebStream(handle, next);
        resolvedRef.current = r;
        setResolved(r);
        setWebSel(next);
        await backendRef.current?.load(r.url, pos);
        clearError();
      } catch {
        /* keep current stream on failure */
      } finally {
        switchingRef.current = false;
        setSwitching(false);
      }
    },
    [clearError],
  );

  const selectWebAudio = useCallback(
    (audioIndex: number) =>
      void applyWebSelection({ ...webSelRef.current, audioIndex }),
    [applyWebSelection],
  );
  const selectWebSubtitle = useCallback(
    (subtitleIndex: number | null) =>
      void applyWebSelection({ ...webSelRef.current, subtitleIndex }),
    [applyWebSelection],
  );
  const selectWebResolution = useCallback(
    (resolutionIndex: number | null) =>
      void applyWebSelection({ ...webSelRef.current, resolutionIndex }),
    [applyWebSelection],
  );

  const reset = useCallback(() => {
    setSelected(null);
    setResolved(null);
    setPhase("idle");
    setError(null);
    setLoadStep("prepare");
  }, []);

  return {
    videoRef,
    telemetry,
    mode,
    resolved,
    selected,
    switchingTo,
    switching,
    phase,
    webSel,
    loadStep,
    error,
    setError,
    reset,
    playSource,
    selectWebAudio,
    selectWebSubtitle,
    selectWebResolution,
  };
}

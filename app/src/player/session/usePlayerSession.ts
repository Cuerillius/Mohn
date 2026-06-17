import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { command, setProperty } from "tauri-plugin-libmpv-api";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { apiGet } from "@/services/api";
import { useProgressSync } from "@/hooks/useProgressSync";
import { getPlatform, type Platform } from "../platform";
import { useTorboxAccess } from "../gating/useTorboxAccess";
import { useSourceFeed } from "../sources/useSourceFeed";
import {
  autoPick,
  groupByResolution,
  isPlayable,
  preferredResolution,
  sortSources,
} from "../sources/selectSource";
import {
  resolvePlayback,
  reselectWebStream,
  RESOLUTION_INDEX,
} from "../playback/resolvePlayback";
import { usePlaybackTelemetry, type TelemetryMode } from "../playback/usePlaybackTelemetry";
import { MpvBackend } from "../playback/backends/mpvBackend";
import { HlsBackend } from "../playback/backends/hlsBackend";
import { ExternalBackend } from "../playback/backends/externalBackend";
import type { PlaybackBackend } from "../playback/PlaybackBackend";
import {
  RESOLUTION_ORDER,
  type Resolution,
  type ResolvedPlayback,
  type Source,
  type TrackInfo,
} from "../types";

const WEB_QUALITY_OPTIONS = ["Original", "1080p", "720p", "480p", "360p"];
const RESUME_THRESHOLD_SECS = 30;

export type SessionStatus =
  | { kind: "gating" }
  | { kind: "needs-upgrade"; plan: number | undefined }
  | { kind: "loading"; message: string }
  | { kind: "error"; message: string; canBrowse: boolean }
  | { kind: "external" }
  | { kind: "switching" }
  | { kind: "stalled" }
  | { kind: "none" };

export interface PlayerSnapshot {
  status: SessionStatus;
  mode: TelemetryMode;
  showVideo: boolean;
  platform: Platform;
  isFullscreen: boolean;
  resumeToast: string;

  paused: boolean;
  timePos: number;
  duration: number;
  volume: number;
  muted: boolean;
  buffered: number;
  isBuffering: boolean;
  audioTracks: TrackInfo[];
  subtitleTracks: TrackInfo[];
  currentAid: string;
  currentSid: string;

  sources: Source[];
  selected: Source | null;
  switchingTo: Source | null;
  quality: { options: string[]; current: string };

  onPlayPause: () => void;
  onSeekRelative: (delta: number) => void;
  onSeekTo: (t: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onSetAudio: (id: string) => void;
  onSetSubtitle: (id: string) => void;
  onSelectQuality: (label: string) => void;
  onSelectSource: (s: Source) => void;
  onRetry: () => void;
  onSkip: () => void;
  onFullscreen: () => Promise<void>;
}

interface Params {
  type: "movie" | "tv" | undefined;
  tmdbId: string | undefined;
  season: string | undefined;
  episode: string | undefined;
  activeAddonUrls: string[];
  settingsLoading: boolean;
  profileId: string | undefined;
  videoRef: React.RefObject<HTMLVideoElement>;
}

interface WebSel {
  audioIndex: number;
  subtitleIndex: number | null;
  resolutionIndex: number | null;
}
const DEFAULT_WEB_SEL: WebSel = {
  audioIndex: 0,
  subtitleIndex: null,
  resolutionIndex: null,
};

export function usePlayerSession({
  type,
  tmdbId,
  season,
  episode,
  activeAddonUrls,
  settingsLoading,
  profileId,
  videoRef,
}: Params): PlayerSnapshot {
  const platform = getPlatform();
  const access = useTorboxAccess(platform);

  const mediaId =
    type === "tv" ? `tv:${tmdbId}:${season ?? 1}:${episode ?? 1}` : `movie:${tmdbId}`;
  const mediaType = type === "tv" ? "tv" : "movie";

  const seasonNum = type === "tv" && season ? Number(season) : undefined;
  const episodeNum = type === "tv" && episode ? Number(episode) : undefined;

  // The feed only runs once gating passes (web Pro) and settings are loaded.
  const feedEnabled = !settingsLoading && access.resolved && access.allowed;
  const feed = useSourceFeed({
    type,
    tmdbId,
    season,
    episode,
    activeAddonUrls,
    enabled: feedEnabled,
  });

  const [selected, setSelected] = useState<Source | null>(null);
  const [switchingTo, setSwitchingTo] = useState<Source | null>(null);
  const [switching, setSwitching] = useState(false);
  const [resolved, setResolved] = useState<ResolvedPlayback | null>(null);
  const [webSel, setWebSel] = useState<WebSel>(DEFAULT_WEB_SEL);
  const [phase, setPhase] = useState<"idle" | "playing" | "external">("idle");
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resumeToast, setResumeToast] = useState("");

  const mode: TelemetryMode = useMemo(() => {
    if (!resolved) return null;
    if (platform === "tauri") return "mpv";
    if (platform === "web") return "hls";
    return "external";
  }, [resolved, platform]);

  const telemetry = usePlaybackTelemetry(mode, videoRef);

  useProgressSync(mediaId, mediaType, profileId, telemetry.timePos, telemetry.duration);

  // ── Refs for stable callbacks ────────────────────────────────────────────
  const backendRef = useRef<PlaybackBackend | null>(null);
  const hlsErrorRef = useRef<() => void>(() => {});
  const triedRef = useRef<Set<string>>(new Set());
  const resolvedRef = useRef<ResolvedPlayback | null>(null);
  resolvedRef.current = resolved;
  const sourcesRef = useRef<Source[]>(feed.sources);
  sourcesRef.current = feed.sources;
  const selectedRef = useRef<Source | null>(selected);
  selectedRef.current = selected;
  const switchingRef = useRef(false);
  switchingRef.current = switching;
  const webSelRef = useRef(webSel);
  webSelRef.current = webSel;
  const timeRef = useRef(0);
  timeRef.current = telemetry.timePos;
  const clearError = telemetry.clearError;
  const resumeRef = useRef(0);
  const fsRef = useRef(false);
  const handleMpvRef = useRef(telemetry.handleMpvProperty);
  handleMpvRef.current = telemetry.handleMpvProperty;

  // ── Backend lifecycle ────────────────────────────────────────────────────
  const ensureBackend = useCallback((): PlaybackBackend => {
    if (backendRef.current) return backendRef.current;
    let b: PlaybackBackend;
    if (platform === "tauri") {
      b = new MpvBackend((ev) => handleMpvRef.current(ev));
    } else if (platform === "web") {
      b = new HlsBackend(() => videoRef.current, () => hlsErrorRef.current());
    } else {
      b = new ExternalBackend();
    }
    backendRef.current = b;
    return b;
  }, [platform, videoRef]);

  useEffect(() => {
    return () => {
      backendRef.current?.destroy();
      backendRef.current = null;
      if (fsRef.current) {
        if (platform === "tauri") getCurrentWindow().setFullscreen(false).catch(() => {});
        else document.exitFullscreen().catch(() => {});
      }
    };
  }, [platform]);

  // ── Fetch saved resume position once per title ─────────────────────────────
  useEffect(() => {
    resumeRef.current = 0;
    if (!profileId || !tmdbId) return;
    let cancelled = false;
    apiGet<{ position: number }>(
      `/api/profiles/${profileId}/history/progress?mediaId=${encodeURIComponent(mediaId)}`,
    )
      .then((r) => {
        if (!cancelled) resumeRef.current = r.position ?? 0;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileId, tmdbId, mediaId]);

  // ── Resolve + load a source ────────────────────────────────────────────────
  const playSource = useCallback(
    async (source: Source, initial: boolean): Promise<boolean> => {
      if (switchingRef.current) return false;
      switchingRef.current = true;
      setSwitching(true);
      setSwitchingTo(source);
      setSelected(source);
      triedRef.current.add(source.infoHash);
      try {
        const r = await resolvePlayback(source, platform, DEFAULT_WEB_SEL, {
          season: seasonNum,
          episode: episodeNum,
        });
        resolvedRef.current = r;
        setResolved(r);
        if (platform === "web") setWebSel(DEFAULT_WEB_SEL);

        const backend = ensureBackend();
        const resumeAt =
          initial && backend.supportsResume && resumeRef.current > RESUME_THRESHOLD_SECS
            ? resumeRef.current
            : undefined;
        if (resumeAt !== undefined) {
          setResumeToast(`Resumed from ${formatClock(resumeAt)}`);
          window.setTimeout(() => setResumeToast(""), 3000);
        }
        await backend.load(r.url, resumeAt);
        clearError();
        setPhase(platform === "mobileweb" ? "external" : "playing");
        return true;
      } catch (err) {
        console.error('[player] source failed:', err instanceof Error ? err.message : err);
        return false;
      } finally {
        switchingRef.current = false;
        setSwitching(false);
        setSwitchingTo(null);
      }
    },
    [platform, ensureBackend, clearError, seasonNum, episodeNum],
  );

  // Ordered, untried, playable candidates.
  const candidates = useCallback((): Source[] => {
    const playable = sourcesRef.current.filter(
      (s) => !triedRef.current.has(s.infoHash) && isPlayable(s, platform),
    );
    return sortSources(playable, preferredResolution(platform));
  }, [platform]);

  // Try the next candidate until one plays or all are exhausted.
  const advance = useCallback(async (): Promise<void> => {
    if (switchingRef.current) return;
    for (let next = candidates()[0]; next; next = candidates()[0]) {
      const ok = await playSource(next, false);
      if (ok) return;
    }
    setTerminalError("This title couldn't be played from any available source.");
  }, [candidates, playSource]);

  // Keep the HLS fatal-error callback up to date so post-manifest errors
  // (e.g. segments fail to load) trigger the same fallback logic.
  hlsErrorRef.current = () => { void advance(); };

  // ── Autoplay: once the feed finishes (cache known), pick the best source ────
  useEffect(() => {
    if (!feedEnabled || feed.loading || selectedRef.current || switchingRef.current || terminalError)
      return;
    const best = autoPick(feed.sources, platform, triedRef.current);
    if (best) {
      void playSource(best, true);
    } else if (feed.error) {
      setTerminalError(feed.error);
    } else {
      setTerminalError(
        feed.sources.length
          ? "No sources are playable on this device."
          : "Your addons didn't return any streams.",
      );
    }
  }, [feed.loading, feed.sources, feed.error, feedEnabled, platform, terminalError, playSource]);

  // ── Auto-fallback on playback failure / stall ───────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || switchingRef.current) return;
    if (telemetry.playbackError || telemetry.isStalled) {
      void advance();
    }
  }, [telemetry.playbackError, telemetry.isStalled, phase, advance]);

  // Reset everything when the title changes.
  useEffect(() => {
    triedRef.current = new Set();
    setSelected(null);
    setResolved(null);
    setSwitching(false);
    setSwitchingTo(null);
    setWebSel(DEFAULT_WEB_SEL);
    setPhase("idle");
    setTerminalError(null);
  }, [mediaId]);

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

  // ── Control handlers ─────────────────────────────────────────────────────
  const onPlayPause = useCallback(() => {
    if (platform === "tauri") {
      command("cycle", ["pause"]).catch(() => {});
    } else {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }
  }, [platform, videoRef]);

  const onSeekRelative = useCallback(
    (delta: number) => {
      if (platform === "tauri") {
        command("seek", [String(delta), "relative"]).catch(() => {});
      } else {
        const v = videoRef.current;
        if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
      }
    },
    [platform, videoRef],
  );

  const onSeekTo = useCallback(
    (t: number) => {
      if (platform === "tauri") setProperty("time-pos", t).catch(() => {});
      else {
        const v = videoRef.current;
        if (v) v.currentTime = t;
      }
    },
    [platform, videoRef],
  );

  const onVolumeChange = useCallback(
    (v: number) => {
      if (platform === "tauri") setProperty("volume", v).catch(() => {});
      else {
        const el = videoRef.current;
        if (el) el.volume = v / 100;
      }
    },
    [platform, videoRef],
  );

  const onToggleMute = useCallback(() => {
    if (platform === "tauri") setProperty("mute", !telemetry.muted).catch(() => {});
    else {
      const v = videoRef.current;
      if (v) v.muted = !v.muted;
    }
  }, [platform, videoRef, telemetry.muted]);

  const onSetAudio = useCallback(
    (id: string) => {
      if (platform === "tauri") {
        setProperty("aid", id).catch(() => {});
      } else if (platform === "web") {
        void applyWebSelection({ ...webSelRef.current, audioIndex: Number(id) });
      }
    },
    [platform, applyWebSelection],
  );

  const onSetSubtitle = useCallback(
    (id: string) => {
      if (platform === "tauri") {
        setProperty("sid", id).catch(() => {});
      } else if (platform === "web") {
        const subtitleIndex = id === "no" ? null : Number(id);
        void applyWebSelection({ ...webSelRef.current, subtitleIndex });
      }
    },
    [platform, applyWebSelection],
  );

  const onSelectQuality = useCallback(
    (label: string) => {
      if (platform === "web") {
        const resolutionIndex = RESOLUTION_INDEX[label] ?? null;
        void applyWebSelection({ ...webSelRef.current, resolutionIndex });
      } else {
        // Desktop/mobile: pick the best source of that resolution.
        const groups = groupByResolution(sourcesRef.current);
        const group = groups[label as Resolution] ?? [];
        const target = group.find((s) => isPlayable(s, platform));
        if (target && target.infoHash !== selectedRef.current?.infoHash) {
          void playSource(target, false);
        }
      }
    },
    [platform, applyWebSelection, playSource],
  );

  const onSelectSource = useCallback(
    (s: Source) => {
      if (s.infoHash === selectedRef.current?.infoHash) return;
      setTerminalError(null);
      void playSource(s, false);
    },
    [playSource],
  );

  const onRetry = useCallback(() => {
    triedRef.current = new Set();
    setTerminalError(null);
    setSelected(null);
    setResolved(null);
    setPhase("idle");
  }, []);

  const onSkip = useCallback(() => {
    void advance();
  }, [advance]);

  const onFullscreen = useCallback(async () => {
    const next = !fsRef.current;
    fsRef.current = next;
    setIsFullscreen(next);
    if (platform === "tauri") {
      await getCurrentWindow().setFullscreen(next).catch(() => {});
    } else if (next) {
      await document.documentElement.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, [platform]);

  // ── Derived view model ─────────────────────────────────────────────────────
  const isWeb = platform === "web";
  const audioTracks = isWeb ? resolved?.audioTracks ?? [] : telemetry.audioTracks;
  const subtitleTracks = isWeb ? resolved?.subtitleTracks ?? [] : telemetry.subtitleTracks;
  const currentAid = isWeb ? String(webSel.audioIndex) : telemetry.currentAid;
  const currentSid = isWeb
    ? webSel.subtitleIndex == null
      ? "no"
      : String(webSel.subtitleIndex)
    : telemetry.currentSid;

  const quality = useMemo(() => {
    if (isWeb) {
      const current =
        WEB_QUALITY_OPTIONS.find((l) => (RESOLUTION_INDEX[l] ?? null) === webSel.resolutionIndex) ??
        "Original";
      return { options: WEB_QUALITY_OPTIONS, current };
    }
    const groups = groupByResolution(feed.sources);
    const options = RESOLUTION_ORDER.filter((r) => groups[r].length > 0);
    return { options, current: selected?.resolution ?? "Unknown" };
  }, [isWeb, webSel.resolutionIndex, feed.sources, selected]);

  const status = computeStatus({
    access,
    feed,
    selected,
    switching,
    phase,
    platform,
    terminalError,
    isStalled: telemetry.isStalled,
    hasSources: feed.sources.length > 0,
  });

  return {
    status,
    mode,
    showVideo: platform === "web" && !!resolved,
    platform,
    isFullscreen,
    resumeToast,
    paused: telemetry.paused,
    timePos: telemetry.timePos,
    duration: telemetry.duration,
    volume: telemetry.volume,
    muted: telemetry.muted,
    buffered: telemetry.buffered,
    isBuffering: telemetry.isBuffering,
    audioTracks,
    subtitleTracks,
    currentAid,
    currentSid,
    sources: feed.sources,
    selected,
    switchingTo,
    quality,
    onPlayPause,
    onSeekRelative,
    onSeekTo,
    onVolumeChange,
    onToggleMute,
    onSetAudio,
    onSetSubtitle,
    onSelectQuality,
    onSelectSource,
    onRetry,
    onSkip,
    onFullscreen,
  };
}

function computeStatus(args: {
  access: ReturnType<typeof useTorboxAccess>;
  feed: ReturnType<typeof useSourceFeed>;
  selected: Source | null;
  switching: boolean;
  phase: string;
  platform: Platform;
  terminalError: string | null;
  isStalled: boolean;
  hasSources: boolean;
}): SessionStatus {
  const { access, feed, selected, switching, phase, platform, terminalError, isStalled, hasSources } =
    args;

  if (!access.resolved) return { kind: "gating" };
  if (!access.allowed) return { kind: "needs-upgrade", plan: access.plan };
  if (terminalError) return { kind: "error", message: terminalError, canBrowse: hasSources };
  if (!selected) {
    return {
      kind: "loading",
      message: feed.loading ? "Finding sources…" : "Preparing playback…",
    };
  }
  if (phase === "external") return { kind: "external" };
  if (phase !== "playing") return { kind: "loading", message: "Loading stream…" };
  if (switching) return { kind: "switching" };
  if (isStalled) return { kind: "stalled" };
  void platform;
  return { kind: "none" };
}

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

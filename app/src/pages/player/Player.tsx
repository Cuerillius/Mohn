import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, Download, Loader } from "lucide-react";
import { command, setProperty } from "tauri-plugin-libmpv-api";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { keys } from "@/lib/queryKeys";
import { useSettings } from "@/context/SettingsContext";
import { fetchTorboxPlan } from "@/services/torbox";
import { getExternalIds } from "@/services/tmdb";
import { Button } from "@/components/ui/button";

import { getPlatform } from "@/player/platform";
import { fetchAddonSources } from "@/player/addons";
import { checkCached, chooseFile } from "@/player/torbox";
import {
  autoPick,
  groupByResolution,
  isPlayable,
  preferredResolution,
  sortSources,
} from "@/player/sources/selectSource";
import {
  resolvePlayback,
  reselectWebStream,
  RESOLUTION_INDEX,
} from "@/player/playback/resolvePlayback";
import {
  usePlaybackTelemetry,
  type TelemetryMode,
} from "@/player/playback/usePlaybackTelemetry";
import { MpvBackend } from "@/player/playback/backends/mpvBackend";
import { HlsBackend } from "@/player/playback/backends/hlsBackend";
import type { PlaybackBackend } from "@/player/playback/PlaybackBackend";
import {
  RESOLUTION_ORDER,
  type Resolution,
  type ResolvedPlayback,
  type Source,
} from "@/player/types";

import PlayerDesktop from "./PlayerDesktop";
import PlayerWeb from "./PlayerWeb";
import Sidepanel from "./Sidepanel";
import type { PlayerVM, Section } from "./types";
import LoadingSteps, { LoadStep } from "@/components/MultiStepLoader";
import { TorboxUpgrade } from "@/components/TorboxKey";

const PRO_PLAN = 2;
const WEB_QUALITY_OPTIONS = ["Original", "1080p", "720p", "480p", "360p"];

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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed left-8 top-6 z-50 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70 cursor-pointer"
      aria-label="Back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}

export default function Player() {
  const { type, id, season, episode } = useParams<{
    type: string;
    id: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);

  const { activeAddonUrls, loading: settingsLoading } = useSettings();

  const platform = getPlatform();
  const isTauriPlatform = platform === "tauri";
  const requiresPro = !isTauriPlatform;

  const mediaType = type === "tv" ? "tv" : "movie";
  const seasonNum = type === "tv" && season ? Number(season) : undefined;
  const episodeNum = type === "tv" && episode ? Number(episode) : undefined;

  // Transparent full-screen styling while the player is mounted.
  useEffect(() => {
    document.documentElement.classList.add("player-page");
    document.body.classList.add("player-page");
    return () => {
      document.documentElement.classList.remove("player-page");
      document.body.classList.remove("player-page");
    };
  }, []);

  // ── Gating (web only): browser streaming needs TorBox Pro ──────────────────
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: keys.torboxPlan(),
    queryFn: fetchTorboxPlan,
    enabled: requiresPro,
    staleTime: 5 * 60 * 1000,
  });
  const planResolved = !requiresPro || (!planLoading && plan !== undefined);
  const allowed = !requiresPro || plan === PRO_PLAN;

  // ── State ──────────────────────────────────────────────────────────────────
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState<Source | null>(null);
  const [switchingTo, setSwitchingTo] = useState<Source | null>(null);
  const [switching, setSwitching] = useState(false);
  const [resolved, setResolved] = useState<ResolvedPlayback | null>(null);
  const [webSel, setWebSel] = useState<WebSel>(DEFAULT_WEB_SEL);
  const [phase, setPhase] = useState<"idle" | "playing">("idle");
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadStep, setLoadStep] = useState<LoadStep>("lookup");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

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
  const selectedRef = useRef<Source | null>(selected);
  selectedRef.current = selected;
  const switchingRef = useRef(false);
  switchingRef.current = switching;
  const webSelRef = useRef(webSel);
  webSelRef.current = webSel;
  const timeRef = useRef(0);
  timeRef.current = telemetry.timePos;
  const clearError = telemetry.clearError;
  const fsRef = useRef(false);
  const handleMpvRef = useRef(telemetry.handleMpvProperty);
  handleMpvRef.current = telemetry.handleMpvProperty;

  // ── Backend lifecycle ───────────────────────────────────────────────────────
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
      if (fsRef.current) {
        if (isTauriPlatform)
          getCurrentWindow()
            .setFullscreen(false)
            .catch(() => {});
        else document.exitFullscreen().catch(() => {});
      }
    };
  }, [isTauriPlatform]);

  // ── Resolve + load a source ──────────────────────────────────────────────────
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

  // On a fatal post-manifest HLS error, surface the error (lean: no auto-advance).
  hlsErrorRef.current = () => {
    setError("Playback stopped. Pick another source.");
  };

  // ── Load feed: fetch addon sources → cache check → sort → auto-pick → play ────
  useEffect(() => {
    if (settingsLoading || !planResolved || !allowed || !id || !type) return;

    let cancelled = false;
    setFeedLoading(true);
    setLoadStep("lookup");
    setError(null);
    setSources([]);
    setSelected(null);
    setResolved(null);
    setPhase("idle");

    async function run() {
      try {
        const { imdb_id } = await getExternalIds(Number(id), mediaType);
        if (cancelled) return;
        if (!imdb_id)
          throw new Error("Couldn't find an IMDB id for this title.");
        if (activeAddonUrls.length === 0) {
          throw new Error("No active addons. Enable at least one in Settings.");
        }

        setLoadStep("search");

        const streamId =
          type === "tv" ? `${imdb_id}:${season ?? 1}:${episode ?? 1}` : imdb_id;
        const addonType = type === "tv" ? "series" : "movie";

        const results = await Promise.allSettled(
          activeAddonUrls.map((url) =>
            fetchAddonSources(url, addonType, streamId),
          ),
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

        setLoadStep("cache");
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

        const sorted = sortSources(list, preferredResolution(platform));
        setSources(sorted);
        setFeedLoading(false);

        const best = autoPick(sorted, platform, new Set());
        if (best) {
          void playSource(best);
        } else {
          setError(
            sorted.length
              ? "No sources are playable on this device."
              : "Your addons didn't return any streams.",
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setFeedLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settingsLoading,
    planResolved,
    allowed,
    id,
    type,
    season,
    episode,
    activeAddonUrls.join(","),
  ]);

  // ── Web re-stream for audio/subtitle/resolution changes ──────────────────────
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

  // ── Control handlers ─────────────────────────────────────────────────────────
  const onPlayPause = useCallback(() => {
    if (isTauriPlatform) {
      command("cycle", ["pause"]).catch(() => {});
    } else {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }
  }, [isTauriPlatform]);

  const onSeekRelative = useCallback(
    (delta: number) => {
      if (isTauriPlatform) {
        command("seek", [String(delta), "relative"]).catch(() => {});
      } else {
        const v = videoRef.current;
        if (v)
          v.currentTime = Math.max(
            0,
            Math.min(v.duration || 0, v.currentTime + delta),
          );
      }
    },
    [isTauriPlatform],
  );

  const onSeekTo = useCallback(
    (t: number) => {
      if (isTauriPlatform) setProperty("time-pos", t).catch(() => {});
      else {
        const v = videoRef.current;
        if (v) v.currentTime = t;
      }
    },
    [isTauriPlatform],
  );

  const onVolumeChange = useCallback(
    (v: number) => {
      if (isTauriPlatform) setProperty("volume", v).catch(() => {});
      else {
        const el = videoRef.current;
        if (el) el.volume = v / 100;
      }
    },
    [isTauriPlatform],
  );

  const onToggleMute = useCallback(() => {
    if (isTauriPlatform) setProperty("mute", !telemetry.muted).catch(() => {});
    else {
      const v = videoRef.current;
      if (v) v.muted = !v.muted;
    }
  }, [isTauriPlatform, telemetry.muted]);

  const onSetAudio = useCallback(
    (trackId: string) => {
      if (isTauriPlatform) {
        setProperty("aid", trackId).catch(() => {});
      } else {
        void applyWebSelection({
          ...webSelRef.current,
          audioIndex: Number(trackId),
        });
      }
    },
    [isTauriPlatform, applyWebSelection],
  );

  const onSetSubtitle = useCallback(
    (trackId: string) => {
      if (isTauriPlatform) {
        setProperty("sid", trackId).catch(() => {});
      } else {
        const subtitleIndex = trackId === "no" ? null : Number(trackId);
        void applyWebSelection({ ...webSelRef.current, subtitleIndex });
      }
    },
    [isTauriPlatform, applyWebSelection],
  );

  const onSelectQuality = useCallback(
    (label: string) => {
      if (!isTauriPlatform) {
        const resolutionIndex = RESOLUTION_INDEX[label] ?? null;
        void applyWebSelection({ ...webSelRef.current, resolutionIndex });
      } else {
        const groups = groupByResolution(sources);
        const group = groups[label as Resolution] ?? [];
        const target = group.find((s) => isPlayable(s, platform));
        if (target && target.infoHash !== selectedRef.current?.infoHash) {
          void playSource(target);
        }
      }
    },
    [isTauriPlatform, applyWebSelection, sources, platform, playSource],
  );

  const onSelectSource = useCallback(
    (s: Source) => {
      if (s.infoHash === selectedRef.current?.infoHash) return;
      setError(null);
      void playSource(s);
    },
    [playSource],
  );

  const onFullscreen = useCallback(async () => {
    const next = !fsRef.current;
    fsRef.current = next;
    setIsFullscreen(next);
    if (isTauriPlatform) {
      await getCurrentWindow()
        .setFullscreen(next)
        .catch(() => {});
    } else if (next) {
      await document.documentElement.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, [isTauriPlatform]);

  // ── Derived view model ────────────────────────────────────────────────────────
  const isWeb = !isTauriPlatform;
  const audioTracks = isWeb
    ? (resolved?.audioTracks ?? [])
    : telemetry.audioTracks;
  const subtitleTracks = isWeb
    ? (resolved?.subtitleTracks ?? [])
    : telemetry.subtitleTracks;
  const currentAid = isWeb ? String(webSel.audioIndex) : telemetry.currentAid;
  const currentSid = isWeb
    ? webSel.subtitleIndex == null
      ? "no"
      : String(webSel.subtitleIndex)
    : telemetry.currentSid;

  const quality = useMemo(() => {
    if (isWeb) {
      const current =
        WEB_QUALITY_OPTIONS.find(
          (l) => (RESOLUTION_INDEX[l] ?? null) === webSel.resolutionIndex,
        ) ?? "Original";
      return { options: WEB_QUALITY_OPTIONS, current };
    }
    const groups = groupByResolution(sources);
    const options = RESOLUTION_ORDER.filter((r) => groups[r].length > 0);
    return { options, current: selected?.resolution ?? "Unknown" };
  }, [isWeb, webSel.resolutionIndex, sources, selected]);

  // ── Sidepanel + controls UI state ─────────────────────────────────────────────
  const [sidepanelOpen, setSidepanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("Source");
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(telemetry.paused);
  pausedRef.current = telemetry.paused;

  const onSectionToggle = useCallback(
    (section: Section) => {
      if (sidepanelOpen && activeSection === section) {
        setSidepanelOpen(false);
      } else {
        setSidepanelOpen(true);
        setActiveSection(section);
      }
    },
    [sidepanelOpen, activeSection],
  );

  const resetTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!pausedRef.current) setShowControls(false);
    }, 3000);
  }, []);

  const hide = useCallback(() => {
    if (!pausedRef.current) setShowControls(false);
  }, []);

  const isPlaying = phase === "playing";

  // Keyboard shortcuts (only while a real player is active).
  useEffect(() => {
    if (!isPlaying) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) ||
        t.isContentEditable
      )
        return;
      let handled = true;
      switch (e.key) {
        case " ":
          onPlayPause();
          break;
        case "ArrowRight":
          onSeekRelative(10);
          break;
        case "ArrowLeft":
          onSeekRelative(-10);
          break;
        case "f":
        case "F":
          void onFullscreen();
          break;
        case "m":
        case "M":
          onToggleMute();
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, onPlayPause, onSeekRelative, onFullscreen, onToggleMute]);

  const controlsVisible =
    isPlaying &&
    !switching &&
    (showControls || telemetry.paused || telemetry.isBuffering);

  const vm: PlayerVM = {
    platform,
    paused: telemetry.paused,
    timePos: telemetry.timePos,
    duration: telemetry.duration,
    volume: telemetry.volume,
    muted: telemetry.muted,
    buffered: telemetry.buffered,
    isBuffering: telemetry.isBuffering,
    isFullscreen,
    switching,
    audioTracks,
    subtitleTracks,
    currentAid,
    currentSid,
    sources,
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
    onFullscreen,
    sidepanelOpen,
    activeSection,
    onSectionToggle,
    onCloseSidepanel: () => setSidepanelOpen(false),
  };

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!type || !id) {
    navigate(-1);
    return null;
  }

  // Gating: still resolving the plan.
  if (requiresPro && !planResolved) {
    return <div className="min-h-screen bg-background" />;
  }

  // Gating: web, not Pro.
  if (requiresPro && !allowed) {
    return <TorboxUpgrade goBack={goBack} />;
  }

  const showLoading = !error && (feedLoading || (!isPlaying && !!selected));
  const showBack = !!error || !isPlaying || controlsVisible;

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${
        isTauriPlatform ? "bg-transparent" : "bg-black"
      }`}
      onMouseMove={resetTimer}
      onMouseLeave={hide}
    >
      {isTauriPlatform ? (
        <PlayerDesktop vm={vm} controlsVisible={controlsVisible} />
      ) : (
        <PlayerWeb
          vm={vm}
          controlsVisible={controlsVisible}
          videoRef={videoRef}
        />
      )}

      {/* Switching overlay */}
      {switching && isPlaying && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader className="size-7 animate-spin text-white/80" />
            <p className="text-sm text-white/80">Loading source…</p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {showLoading && <LoadingSteps current={loadStep} />}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col gap-7 rounded-2xl border border-border bg-background p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                Can't play this title
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {error}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {sources.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setActiveSection("Source");
                    setSidepanelOpen(true);
                  }}
                  className="w-full"
                >
                  Browse sources
                </Button>
              )}
              <Button variant="ghost" onClick={goBack} className="w-full">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sidepanel vm={vm} />

      {showBack && <BackButton onClick={goBack} />}
    </div>
  );
}

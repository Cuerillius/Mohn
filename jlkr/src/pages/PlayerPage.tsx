import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  init,
  observeProperties,
  destroy,
  command,
  setProperty,
} from "tauri-plugin-libmpv-api";
import type { MpvObservableProperty, MpvConfig } from "tauri-plugin-libmpv-api";
import { getExternalIds } from "../services/tmdb";
import {
  fetchAllStreams,
  enrichStream,
  autoSelectStream,
  groupByResolution,
} from "../services/addons";
import {
  checkCached,
  createAndResolveLink,
  fetchTorboxPlan,
  requestHlsLink,
} from "../services/torbox";
import {
  isTauri,
  isMobileBrowser,
  isBrowserPlayable,
  MpvStreamPlayer,
  ExternalStreamPlayer,
  BrowserVideoPlayer,
  HlsStreamPlayer,
  DesktopPromptPlayer,
  type StreamPlayerService,
} from "../services/streamPlayer";
import { useSettings } from "../context/SettingsContext";
import { useProfile } from "../context/ProfileContext";
import { apiGet, apiPatch } from "../services/api";
import type { EnrichedStream, Resolution } from "../types/torbox";
import PlayerControls, {
  formatTime,
  type MpvTrack,
  type Section,
} from "../components/PlayerControls";
import MultiStepLoader from "@/components/MultiStepLoader";
import StreamPicker, { planFromNumber, type Plan, type Platform } from "@/components/StreamPicker";
import { OctagonAlert, ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const OBSERVED_PROPERTIES = [
  ["pause", "flag"],
  ["time-pos", "double", "none"],
  ["duration", "double", "none"],
  ["track-list", "node", "none"],
  ["aid", "string", "none"],
  ["sid", "string", "none"],
  ["volume", "double", "none"],
  ["mute", "flag"],
  ["paused-for-cache", "flag"],
  ["core-idle", "flag"],
  ["demuxer-cache-duration", "double", "none"],
] as const satisfies MpvObservableProperty[];

const LOADING_STEPS = [
  { title: "Fetching media details", description: "Retrieving metadata from TMDB" },
  { title: "Getting torrents", description: "Scraping all available providers" },
  { title: "Checking media cache", description: "Verifying Debrid cache" },
  { title: "Selecting stream", description: "Choosing the optimal stream for you" },
  { title: "Requesting media", description: "Getting the stream from the Debrid service" },
];

type PlayerMode = "mpv" | "browser-video" | "hls" | "external" | "desktop-prompt" | null;

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 left-8 z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors cursor-pointer"
      aria-label="Back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}

export default function PlayerPage() {
  const { type, id, season, episode } = useParams<{
    type: string;
    id: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();
  const {
    addonUrls,
    activeAddonUrls,
    loading: settingsLoading,
  } = useSettings();
  const { profile } = useProfile();

  const progressMediaId =
    type === "tv" ? `tv:${id}:${season ?? 1}:${episode ?? 1}` : `movie:${id}`;
  const progressMediaType = type === "tv" ? "tv" : "movie";

  // Load state
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // Player mode
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);
  const playerModeRef = useRef<PlayerMode>(null);

  // Streams
  const [streams, setStreams] = useState<EnrichedStream[]>([]);
  const [selected, setSelected] = useState<EnrichedStream | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");

  // StreamPicker overlay
  const [showStreamPicker, setShowStreamPicker] = useState(false);
  const [torboxPlan, setTorboxPlan] = useState<Plan>("free");
  const [pickerPlatform, setPickerPlatform] = useState<Platform>("web");

  // mpv / video playback state
  const [paused, setPaused] = useState(true);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [muted, setMuted] = useState(false);
  const [audioTracks, setAudioTracks] = useState<MpvTrack[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<MpvTrack[]>([]);
  const [currentAid, setCurrentAid] = useState<string>("auto");
  const [currentSid, setCurrentSid] = useState<string>("no");
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("Subtitles");
  const [selectedResolutionLabel, setSelectedResolutionLabel] = useState<string>("Unknown");
  const [resumeToast, setResumeToast] = useState("");

  // Refs
  const streamPlayerRef = useRef<StreamPlayerService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(true);
  const mutedRef = useRef(false);
  const timePosRef = useRef(0);
  const durationRef = useRef(0);
  const lastSavedPosRef = useRef(0);

  const profileRef = useRef(profile);
  profileRef.current = profile;
  const progressMediaIdRef = useRef(progressMediaId);
  progressMediaIdRef.current = progressMediaId;
  const progressMediaTypeRef = useRef(progressMediaType);
  progressMediaTypeRef.current = progressMediaType;

  // ── Control visibility ──────────────────────────────────────────────────

  const resetUiTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      if (!pausedRef.current) setShowControls(false);
    }, 3000);
  }, []);

  // ── HTML5 video event listeners (for browser-video / hls) ───────────────

  useEffect(() => {
    if (playerMode !== "browser-video" && playerMode !== "hls") return;
    const video = videoRef.current;
    if (!video) return;

    function saveProgress(pos: number, dur: number) {
      const p = profileRef.current;
      if (!p || pos < 30) return;
      const savedPos = dur > 0 && pos / dur >= 0.9 ? 0 : Math.floor(pos);
      apiPatch(`/api/profiles/${p.id}/history/progress`, {
        mediaId: progressMediaIdRef.current,
        mediaType: progressMediaTypeRef.current,
        position: savedPos,
        duration: Math.floor(dur),
      }).catch(() => {});
    }

    const onPlay = () => {
      setPaused(false);
      pausedRef.current = false;
    };
    const onPause = () => {
      setPaused(true);
      pausedRef.current = true;
      setShowControls(true);
    };
    const onTimeUpdate = () => {
      const t = video.currentTime;
      setTimePos(t);
      timePosRef.current = t;
      if (t - lastSavedPosRef.current >= 10) {
        lastSavedPosRef.current = t;
        saveProgress(t, video.duration || 0);
      }
    };
    const onDurationChange = () => {
      const d = video.duration || 0;
      setDuration(d);
      durationRef.current = d;
    };
    const onVolumeChange = () => {
      setVolumeState(Math.round(video.volume * 100));
      const m = video.muted;
      setMuted(m);
      mutedRef.current = m;
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onProgress = () => {
      const buf = video.buffered;
      if (buf.length > 0) setBuffered(buf.end(buf.length - 1));
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
    };
  }, [playerMode]);

  // ── Player control callbacks (work for all player types) ────────────────

  const handlePlayPause = useCallback(() => {
    if (playerModeRef.current === "mpv") {
      command("cycle", ["pause"]).catch(() => {});
    } else {
      const v = videoRef.current;
      if (!v) return;
      v.paused ? v.play().catch(() => {}) : v.pause();
    }
  }, []);

  const handleSeekRelative = useCallback((delta: number) => {
    if (playerModeRef.current === "mpv") {
      command("seek", [String(delta), "relative"]).catch(() => {});
    } else {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    }
  }, []);

  const handleSeekTo = useCallback((t: number) => {
    if (playerModeRef.current === "mpv") {
      setProperty("time-pos", t).catch(() => {});
    } else {
      const v = videoRef.current;
      if (v) v.currentTime = t;
    }
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    if (playerModeRef.current === "mpv") {
      setProperty("volume", v).catch(() => {});
    } else {
      const el = videoRef.current;
      if (el) el.volume = v / 100;
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    if (playerModeRef.current === "mpv") {
      setProperty("mute", !mutedRef.current).catch(() => {});
    } else {
      const v = videoRef.current;
      if (v) v.muted = !v.muted;
    }
  }, []);

  const handleSetSid = useCallback((id: string) => {
    setProperty("sid", id).catch(() => {});
  }, []);

  const handleSetAid = useCallback((id: string) => {
    setProperty("aid", id).catch(() => {});
  }, []);

  // ── Load: fetch metadata + streams + resolve link ───────────────────────

  useEffect(() => {
    if (!id || !type || settingsLoading) return;

    document.documentElement.classList.add("player-page");
    document.body.classList.add("player-page");

    let cancelled = false;

    function saveProgress(pos: number, dur: number) {
      const p = profileRef.current;
      if (!p || pos < 30) return;
      const savedPos = dur > 0 && pos / dur >= 0.9 ? 0 : Math.floor(pos);
      apiPatch(`/api/profiles/${p.id}/history/progress`, {
        mediaId: progressMediaIdRef.current,
        mediaType: progressMediaTypeRef.current,
        position: savedPos,
        duration: Math.floor(dur),
      }).catch(() => {});
    }

    function handleProperty({ name, data }: { name: string; data: unknown }) {
      if (name === "pause") {
        const p = !!data;
        setPaused(p);
        pausedRef.current = p;
        if (p) setShowControls(true);
      } else if (name === "time-pos") {
        const t = (data as number) || 0;
        setTimePos(t);
        timePosRef.current = t;
        if (t - lastSavedPosRef.current >= 10) {
          lastSavedPosRef.current = t;
          saveProgress(t, durationRef.current);
        }
      } else if (name === "duration") {
        const d = (data as number) || 0;
        setDuration(d);
        durationRef.current = d;
      } else if (name === "aid") {
        setCurrentAid((data ?? "auto").toString());
      } else if (name === "sid") {
        setCurrentSid((data ?? "no").toString());
      } else if (name === "volume") {
        setVolumeState((data as number) || 0);
      } else if (name === "mute") {
        const m = !!data;
        setMuted(m);
        mutedRef.current = m;
      } else if (name === "paused-for-cache") {
        if (!!data) setIsBuffering(true);
      } else if (name === "demuxer-cache-duration") {
        setBuffered(timePosRef.current + ((data as number) || 0));
      } else if (name === "track-list") {
        const tracks = (data as MpvTrack[]) || [];
        setAudioTracks(tracks.filter((t) => t.type === "audio"));
        setSubtitleTracks(tracks.filter((t) => t.type === "sub"));
      } else if (name === "core-idle") {
        setIsBuffering(!!data);
      }
    }

    async function run() {
      try {
        const tauri = isTauri();
        const mobile = isMobileBrowser();

        // Determine platform for StreamPicker
        const platform: Platform = tauri ? "tauri" : mobile ? "mobileweb" : "web";
        setPickerPlatform(platform);

        const mpvConfig: MpvConfig = {
          initialOptions: {
            vo: "gpu-next",
            hwdec: "auto-safe",
            "keep-open": "yes",
            "force-window": "yes",
          },
          observedProperties: OBSERVED_PROPERTIES,
        };

        // Phase 1: Init mpv early for Tauri (runs in parallel with stream fetch)
        const mpvPromise: Promise<void> = tauri
          ? init(mpvConfig).then(async () => {
              if (cancelled) return;
              unlistenRef.current = await observeProperties(
                OBSERVED_PROPERTIES,
                handleProperty,
              );
            })
          : Promise.resolve();

        const p = profileRef.current;
        const savedPosPromise = p
          ? apiGet<{ position: number; duration: number }>(
              `/api/profiles/${p.id}/history/progress?mediaId=${encodeURIComponent(progressMediaIdRef.current)}`,
            ).catch(() => ({ position: 0, duration: 0 }))
          : Promise.resolve({ position: 0, duration: 0 });

        if (activeAddonUrls.length === 0)
          throw new Error(
            "No active addons found. Please enable at least one addon in Settings.",
          );

        // Step 0: TMDB / IMDB fetch
        setCurrentStep(0);
        const { imdb_id } = await getExternalIds(
          Number(id),
          type === "tv" ? "tv" : "movie",
        );
        if (!imdb_id)
          throw new Error(
            "We couldn't locate an IMDB ID for this media in our database.",
          );
        if (cancelled) return;

        // Step 1: Getting torrents
        setCurrentStep(1);
        const streamId =
          type === "tv" ? `${imdb_id}:${season ?? 1}:${episode ?? 1}` : imdb_id;
        const raw = await fetchAllStreams(
          activeAddonUrls,
          type === "tv" ? "series" : "movie",
          streamId,
        );
        if (raw.length === 0)
          throw new Error(
            "Your addons didn't return any streams. Make sure they are configured properly.",
          );
        if (cancelled) return;

        // Step 2: Checking cache
        setCurrentStep(2);
        const enriched = raw.map(enrichStream);
        const hashes = enriched.map((s) => s.infoHash).filter(Boolean) as string[];
        const cacheResult = await checkCached(hashes);
        if (cancelled) return;

        for (const s of enriched) {
          if (s.infoHash && cacheResult.data?.[s.infoHash]) s.cached = true;
        }

        // Step 3: Auto-select best stream
        setCurrentStep(3);
        const best = autoSelectStream(enriched);
        if (!best?.infoHash)
          throw new Error(
            "Streams were found, but none matched your playback criteria or were playable.",
          );

        // Step 4: Resolve URL for auto-selected stream
        setCurrentStep(4);
        const magnet = best.magnetLink ?? `magnet:?xt=urn:btih:${best.infoHash}`;
        const {
          torrentId,
          fileId,
          url: resolvedUrl,
          mimetype,
        } = await createAndResolveLink(magnet, best.fileIdx);
        if (cancelled) return;

        // Phase 2: Determine player based on flowchart
        let finalUrl = resolvedUrl;
        let streamPlayer: StreamPlayerService;
        let playStream = best;

        if (tauri) {
          streamPlayer = new MpvStreamPlayer();
          setPlayerMode("mpv");
          playerModeRef.current = "mpv";
        } else if (isBrowserPlayable(mimetype)) {
          streamPlayer = new BrowserVideoPlayer(() => videoRef.current);
          setPlayerMode("browser-video");
          playerModeRef.current = "browser-video";
        } else {
          // Check TorBox Pro
          let planNumber = 0;
          try {
            planNumber = await fetchTorboxPlan();
          } catch {
            planNumber = 0;
          }
          if (cancelled) return;

          const plan = planFromNumber(planNumber);
          setTorboxPlan(plan);
          const hasPro = planNumber >= 2;

          if (hasPro) {
            const FIVE_GB = 5 * 1024 ** 3;
            const under5gb = enriched.filter(
              (s) => !s.sizeBytes || s.sizeBytes < FIVE_GB,
            );
            const hlsStream = autoSelectStream(under5gb);

            if (hlsStream) {
              const hlsMagnet =
                hlsStream.magnetLink ?? `magnet:?xt=urn:btih:${hlsStream.infoHash}`;

              let hlsTorrentId = torrentId;
              let hlsFileId = fileId;
              if (hlsStream.infoHash !== best.infoHash) {
                const res = await createAndResolveLink(hlsMagnet, hlsStream.fileIdx);
                hlsTorrentId = res.torrentId;
                hlsFileId = res.fileId;
              }
              if (cancelled) return;

              finalUrl = await requestHlsLink(hlsTorrentId, hlsFileId);
              streamPlayer = new HlsStreamPlayer(() => videoRef.current);
              setPlayerMode("hls");
              playerModeRef.current = "hls";
              playStream = hlsStream;
            } else {
              streamPlayer = getFallbackPlayer(mobile);
            }
          } else {
            streamPlayer = getFallbackPlayer(mobile);
          }
        }

        streamPlayerRef.current = streamPlayer;

        setStreams(enriched);
        setSelected(playStream);
        setSelectedResolutionLabel(playStream.resolution);
        setLoadState("ready");
        if (
          streamPlayer.type !== "desktop-prompt" &&
          streamPlayer.type !== "external"
        ) {
          setIsBuffering(true);
        }
        resetUiTimer();

        if (tauri) {
          await mpvPromise;
          if (cancelled) return;
        }

        const { position: savedPos } = await savedPosPromise;
        const resumeAt =
          streamPlayer.supportsResume && savedPos > 30 ? savedPos : undefined;
        if (resumeAt !== undefined) {
          setResumeToast(`Resumed from ${formatTime(resumeAt)}`);
          setTimeout(() => setResumeToast(""), 3000);
        }

        if (streamPlayer.type !== "desktop-prompt") {
          await streamPlayer.loadFile(finalUrl, resumeAt);
          if (streamPlayer.type !== "external") {
            setPaused(false);
            pausedRef.current = false;
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setLoadState("error");
        }
      }
    }

    function getFallbackPlayer(mobile: boolean): StreamPlayerService {
      if (mobile) {
        setPlayerMode("external");
        playerModeRef.current = "external";
        return new ExternalStreamPlayer();
      } else {
        setPlayerMode("desktop-prompt");
        playerModeRef.current = "desktop-prompt";
        return new DesktopPromptPlayer();
      }
    }

    run();

    return () => {
      cancelled = true;
      clearTimeout(uiTimeoutRef.current);
      unlistenRef.current?.();
      saveProgress(timePosRef.current, durationRef.current);

      const sp = streamPlayerRef.current;
      if (sp?.type === "embedded") {
        destroy().catch(() => {});
      } else if (sp?.destroy) {
        sp.destroy();
      }

      if (isFullscreenRef.current) {
        isFullscreenRef.current = false;
        if (isTauri()) {
          getCurrentWindow().setFullscreen(false).catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
      document.documentElement.classList.remove("player-page");
      document.body.classList.remove("player-page");
    };
  }, [id, type, season, episode, settingsLoading, addonUrls, resetUiTimer]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      )
        return;

      let handled = true;
      switch (e.key) {
        case "Escape":
          if (showStreamPicker) {
            setShowStreamPicker(false);
          } else if (isFullscreenRef.current) {
            handleFullscreen();
          }
          break;
        case " ":
          handlePlayPause();
          break;
        case "ArrowRight":
          handleSeekRelative(10);
          break;
        case "ArrowLeft":
          handleSeekRelative(-10);
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
        case "m":
        case "M":
          handleToggleMute();
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        resetUiTimer();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showStreamPicker, handlePlayPause, handleSeekRelative, handleToggleMute, resetUiTimer]);

  // ── Control handlers ────────────────────────────────────────────────────

  async function handleFullscreen() {
    const next = !isFullscreenRef.current;
    isFullscreenRef.current = next;
    setIsFullscreen(next);
    if (isTauri()) {
      await getCurrentWindow().setFullscreen(next).catch(() => {});
    } else if (next) {
      await document.documentElement.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }

  async function handleSelectStream(stream: EnrichedStream) {
    if (stream.infoHash === selected?.infoHash || switching) return;
    setSwitching(true);
    setSwitchError("");
    try {
      const magnet =
        stream.magnetLink ?? `magnet:?xt=urn:btih:${stream.infoHash}`;
      const { url, torrentId, fileId } = await createAndResolveLink(
        magnet,
        stream.fileIdx,
      );

      let finalUrl = url;
      if (playerModeRef.current === "hls") {
        finalUrl = await requestHlsLink(torrentId, fileId);
      }

      setSelected(stream);
      setSelectedResolutionLabel(stream.resolution);
      const sp = streamPlayerRef.current;
      if (sp) {
        await sp.loadFile(
          finalUrl,
          sp.supportsResume ? timePosRef.current : undefined,
        );
      }
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : "Failed to switch stream");
    } finally {
      setSwitching(false);
    }
  }

  async function handleOpenExternal(stream: EnrichedStream) {
    if (switching) return;
    setSwitching(true);
    setSwitchError("");
    try {
      const magnet = stream.magnetLink ?? `magnet:?xt=urn:btih:${stream.infoHash}`;
      const { url } = await createAndResolveLink(magnet, stream.fileIdx);
      await new ExternalStreamPlayer().loadFile(url);
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : "Failed to open in external player");
    } finally {
      setSwitching(false);
    }
  }

  function selectResolution(label: string) {
    setSelectedResolutionLabel(label);
    const groups = groupByResolution(streams);
    const group = groups[label as Resolution] ?? [];
    if (group.length > 0 && group[0].infoHash !== selected?.infoHash) {
      handleSelectStream(group[0]);
    }
  }

  function sectionChange(section: Section) {
    if (!isSettingsOpen) {
      setIsSettingsOpen(true);
    } else if (activeSection === section) {
      setIsSettingsOpen(false);
    }
    setActiveSection(section);
  }

  // ── Loading screen ──────────────────────────────────────────────────────

  if (loadState === "loading") {
    return (
      <>
        <video ref={videoRef} className="hidden" playsInline />
        <div className="relative w-full h-screen flex flex-col items-center justify-center gap-3 bg-background">
          <BackButton onClick={() => navigate(-1)} />
          <MultiStepLoader currentStep={currentStep} steps={LOADING_STEPS} />
        </div>
      </>
    );
  }

  // ── Error screen ────────────────────────────────────────────────────────

  if (loadState === "error") {
    return (
      <>
        <video ref={videoRef} className="hidden" playsInline />
        <div className="relative w-full h-screen flex flex-col items-center justify-center gap-4 px-8 text-center bg-background">
          <BackButton onClick={() => navigate(-1)} />
          <div className="flex flex-col items-center max-w-sm gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mb-2">
              <OctagonAlert className="text-destructive h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-100">Ooops!</h2>
            <p className="text-sm text-zinc-400 mb-2">{loadError}</p>
            <Button variant="secondary" className="p-3" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
        </div>
      </>
    );
  }

  // ── Desktop-prompt screen ───────────────────────────────────────────────

  if (loadState === "ready" && playerMode === "desktop-prompt") {
    return (
      <>
        <video ref={videoRef} className="hidden" playsInline />
        <div className="relative w-full h-screen flex flex-col items-center justify-center gap-4 px-8 text-center bg-background">
          <BackButton onClick={() => navigate(-1)} />
          <div className="flex flex-col items-center max-w-sm gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <Layers className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Use the desktop app</h2>
            <p className="text-sm text-zinc-400 mb-2">
              This stream can't be played in a desktop browser. Download the app for the best experience.
            </p>
            <Button variant="secondary" onClick={() => setShowStreamPicker(true)}>
              Browse other streams
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
          {showStreamPicker && (
            <StreamPicker
              streams={streams}
              selected={selected}
              switching={switching}
              switchError={switchError}
              platform={pickerPlatform}
              plan={torboxPlan}
              onSelectStream={handleSelectStream}
              onOpenExternal={handleOpenExternal}
              onClose={() => setShowStreamPicker(false)}
              isOverlay
            />
          )}
        </div>
      </>
    );
  }

  // ── External player (VLC opened, show status) ───────────────────────────

  if (loadState === "ready" && playerMode === "external") {
    return (
      <>
        <video ref={videoRef} className="hidden" playsInline />
        <div className="relative w-full h-screen flex flex-col items-center justify-center gap-4 px-8 text-center bg-background">
          <BackButton onClick={() => navigate(-1)} />
          <div className="flex flex-col items-center max-w-sm gap-4">
            <p className="text-sm text-zinc-400">Opened in VLC.</p>
            <Button variant="secondary" onClick={() => setShowStreamPicker(true)}>
              Browse other streams
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
          {showStreamPicker && (
            <StreamPicker
              streams={streams}
              selected={selected}
              switching={switching}
              switchError={switchError}
              platform={pickerPlatform}
              plan={torboxPlan}
              onSelectStream={handleSelectStream}
              onOpenExternal={handleOpenExternal}
              onClose={() => setShowStreamPicker(false)}
              isOverlay
            />
          )}
        </div>
      </>
    );
  }

  // ── Player UI ───────────────────────────────────────────────────────────

  const controlsVisible = showControls || paused || isBuffering;
  const showVideo = playerMode === "browser-video" || playerMode === "hls";

  return (
    <div
      className="relative w-full h-screen bg-transparent overflow-hidden"
      onMouseMove={resetUiTimer}
      onMouseLeave={() => {
        if (!pausedRef.current) setShowControls(false);
      }}
    >
      {/* HTML5 video element (hidden for mpv — mpv renders natively) */}
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          playsInline
        />
      )}

      {/* Invisible video ref for mpv-less paths that still need the element */}
      {!showVideo && (
        <video ref={videoRef} className="hidden" />
      )}

      {resumeToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white/80 text-[12px] px-4 py-2 rounded-full pointer-events-none">
          {resumeToast}
        </div>
      )}

      <BackButton onClick={() => navigate(-1)} />

      {/* Sources button — always visible */}
      <button
        onClick={() => setShowStreamPicker(true)}
        className="absolute top-4 right-4 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-background/60 text-foreground/80 hover:bg-background/80 transition-colors cursor-pointer"
        aria-label="Browse streams"
      >
        <Layers size={16} />
      </button>

      <PlayerControls
        paused={paused}
        isBuffering={isBuffering}
        timePos={timePos}
        duration={duration}
        buffered={buffered}
        volume={volume}
        muted={muted}
        audioTracks={audioTracks}
        subtitleTracks={subtitleTracks}
        currentAid={currentAid}
        currentSid={currentSid}
        isSettingsOpen={isSettingsOpen}
        activeSection={activeSection}
        selectedResolutionLabel={selectedResolutionLabel}
        streams={streams}
        selected={selected}
        switching={switching}
        switchError={switchError}
        controlsVisible={controlsVisible}
        isFullscreen={isFullscreen}
        onSectionChange={sectionChange}
        onSetActiveSection={setActiveSection}
        onCloseSettings={() => setIsSettingsOpen(false)}
        onSelectStream={handleSelectStream}
        onSelectResolution={selectResolution}
        onFullscreen={handleFullscreen}
        onPlayPause={handlePlayPause}
        onSeekRelative={handleSeekRelative}
        onSeekTo={handleSeekTo}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onSetSid={handleSetSid}
        onSetAid={handleSetAid}
      />

      {/* StreamPicker overlay */}
      {showStreamPicker && (
        <StreamPicker
          streams={streams}
          selected={selected}
          switching={switching}
          switchError={switchError}
          platform={pickerPlatform}
          plan={torboxPlan}
          onSelectStream={handleSelectStream}
          onClose={() => setShowStreamPicker(false)}
          isOverlay
        />
      )}
    </div>
  );
}

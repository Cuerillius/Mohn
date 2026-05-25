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
import { checkCached, createAndResolveLink } from "../services/torbox";
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
import { OctagonAlert } from "lucide-react";
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
  {
    title: "Fetching media details",
    description: "Retrieving metadata from TMDB",
  },
  {
    title: "Getting torrents",
    description: "Scraping all available providers",
  },
  { title: "Checking media cache", description: "Verifying Debrid cache" },
  {
    title: "Selecting stream",
    description: "Choosing the optimal stream for you",
  },
  {
    title: "Requesting media",
    description: "Getting the stream from the Debrid service",
  },
];

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 left-4 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 transition-colors cursor-pointer"
      aria-label="Back"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
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
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // Streams
  const [streams, setStreams] = useState<EnrichedStream[]>([]);
  const [selected, setSelected] = useState<EnrichedStream | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");

  // mpv playback state
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
  const [selectedResolutionLabel, setSelectedResolutionLabel] =
    useState<string>("Unknown");
  const [resumeToast, setResumeToast] = useState("");

  const unlistenRef = useRef<(() => void) | null>(null);
  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(true);
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
        setMuted(!!data);
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
        const mpvConfig: MpvConfig = {
          initialOptions: {
            vo: "gpu-next",
            hwdec: "auto-safe",
            "keep-open": "yes",
            "force-window": "yes",
          },
          observedProperties: OBSERVED_PROPERTIES,
        };

        const p = profileRef.current;
        const savedPosPromise = p
          ? apiGet<{ position: number; duration: number }>(
              `/api/profiles/${p.id}/history/progress?mediaId=${encodeURIComponent(progressMediaIdRef.current)}`,
            ).catch(() => ({ position: 0, duration: 0 }))
          : Promise.resolve({ position: 0, duration: 0 });

        const mpvPromise = init(mpvConfig).then(async () => {
          if (cancelled) return;
          unlistenRef.current = await observeProperties(
            OBSERVED_PROPERTIES,
            handleProperty,
          );
        });

        if (activeAddonUrls.length === 0)
          throw new Error(
            "No active addons found. Please enable at least one addon in Settings.",
          );

        // Step 0: TMDB / IMDB Fetch
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

        // Step 1: Getting Torrents (Addons)
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

        // Step 2: Checking Media Cache
        setCurrentStep(2);
        const enriched = raw.map(enrichStream);
        const hashes = enriched
          .map((s) => s.infoHash)
          .filter(Boolean) as string[];
        const cacheResult = await checkCached(hashes);
        if (cancelled) return;

        for (const s of enriched) {
          if (s.infoHash && cacheResult.data?.[s.infoHash]) s.cached = true;
        }

        // Step 3: Selecting Stream
        setCurrentStep(3);
        const best = autoSelectStream(enriched);
        if (!best?.infoHash)
          throw new Error(
            "Streams were found, but none matched your playback criteria or were playable.",
          );

        // Step 4: Requesting Media
        setCurrentStep(4);
        const magnet =
          best.magnetLink ?? `magnet:?xt=urn:btih:${best.infoHash}`;
        const { url } = await createAndResolveLink(magnet, best.fileIdx);
        if (cancelled) return;

        setStreams(enriched);
        setSelected(best);
        setSelectedResolutionLabel(best.resolution);
        setLoadState("ready");
        setIsBuffering(true);
        resetUiTimer();

        await mpvPromise;
        if (cancelled) return;

        const { position: savedPos } = await savedPosPromise;
        if (savedPos > 30) {
          await setProperty("options/start", String(Math.floor(savedPos)));
          setResumeToast(`Resumed from ${formatTime(savedPos)}`);
          setTimeout(() => setResumeToast(""), 3000);
        }
        await command("loadfile", [url]);
        setPaused(false);
        pausedRef.current = false;
        await setProperty("options/start", "none");
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
      clearTimeout(uiTimeoutRef.current);
      unlistenRef.current?.();
      saveProgress(timePosRef.current, durationRef.current);
      destroy().catch(() => {});
      if (isFullscreenRef.current) {
        isFullscreenRef.current = false;
        getCurrentWindow()
          .setFullscreen(false)
          .catch(() => {});
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
          if (isFullscreenRef.current) handleFullscreen();
          break;
        case " ":
          command("cycle", ["pause"]).catch(() => {});
          break;
        case "ArrowRight":
          setProperty(
            "time-pos",
            Math.min(durationRef.current, timePosRef.current + 10),
          ).catch(() => {});
          break;
        case "ArrowLeft":
          setProperty("time-pos", Math.max(0, timePosRef.current - 10)).catch(
            () => {},
          );
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
        case "m":
        case "M":
          setProperty("mute", !muted).catch(() => {});
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
  }, [muted, resetUiTimer]);

  // ── Control handlers ────────────────────────────────────────────────────

  async function handleFullscreen() {
    const next = !isFullscreenRef.current;
    isFullscreenRef.current = next;
    setIsFullscreen(next);
    await getCurrentWindow()
      .setFullscreen(next)
      .catch(() => {});
  }

  async function handleSelectStream(stream: EnrichedStream) {
    if (stream.infoHash === selected?.infoHash || switching) return;
    setSwitching(true);
    setSwitchError("");
    try {
      const magnet =
        stream.magnetLink ?? `magnet:?xt=urn:btih:${stream.infoHash}`;
      const { url } = await createAndResolveLink(magnet, stream.fileIdx);
      setSelected(stream);
      setSelectedResolutionLabel(stream.resolution);
      await setProperty(
        "options/start",
        String(Math.floor(timePosRef.current)),
      );
      await command("loadfile", [url]);
      await setProperty("options/start", "none");
    } catch (e) {
      setSwitchError(
        e instanceof Error ? e.message : "Failed to switch stream",
      );
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
      <div className="relative w-full h-screen flex flex-col items-center justify-center gap-3">
        <BackButton onClick={() => navigate(-1)} />
        <MultiStepLoader currentStep={currentStep} steps={LOADING_STEPS} />
      </div>
    );
  }

  // ── Error screen ────────────────────────────────────────────────────────

  if (loadState === "error") {
    return (
      <div className="relative w-full h-screen flex flex-col items-center justify-center gap-4 px-8 text-center">
        <BackButton onClick={() => navigate(-1)} />
        <div className="flex flex-col items-center max-w-sm gap-4">
          <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mb-2">
            <OctagonAlert className="text-destructive h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">Ooops!</h2>
          <p className="text-sm text-zinc-400 mb-2">{loadError}</p>
          <Button
            variant="secondary"
            className="p-3"
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  // ── Player UI ───────────────────────────────────────────────────────────

  const controlsVisible = showControls || paused;

  return (
    <div
      className="relative w-full h-screen bg-transparent overflow-hidden"
      onMouseMove={resetUiTimer}
      onMouseLeave={() => {
        if (!pausedRef.current) setShowControls(false);
      }}
    >
      {resumeToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white/80 text-[12px] px-4 py-2 rounded-full pointer-events-none">
          {resumeToast}
        </div>
      )}

      <BackButton onClick={() => navigate(-1)} />

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
      />
    </div>
  );
}

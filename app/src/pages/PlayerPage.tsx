import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useProfile } from "../context/ProfileContext";
import { useStreamLoader } from "../hooks/useStreamLoader";
import { usePlayerBackend } from "../hooks/usePlayerBackend";
import { usePlaybackState, type MpvPropertyHandler } from "../hooks/usePlaybackState";
import { useProgressSync } from "../hooks/useProgressSync";
import { usePlayerControls } from "../hooks/usePlayerControls";
import { useControlsVisibility } from "../hooks/useControlsVisibility";
import PlayerControls, { type Section } from "../components/PlayerControls";
import MultiStepLoader from "@/components/MultiStepLoader";
import { OctagonAlert, ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOADING_STEPS = [
  { title: "Fetching media details", description: "Retrieving metadata from TMDB" },
  { title: "Getting torrents", description: "Scraping all available providers" },
  { title: "Checking media cache", description: "Verifying Debrid cache" },
  { title: "Selecting stream", description: "Choosing the optimal stream for you" },
  { title: "Requesting media", description: "Getting the stream from the Debrid service" },
];

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
  const { activeAddonUrls, loading: settingsLoading } = useSettings();
  const { profile } = useProfile();

  const progressMediaId =
    type === "tv" ? `tv:${id}:${season ?? 1}:${episode ?? 1}` : `movie:${id}`;
  const progressMediaType = type === "tv" ? "tv" : "movie";

  const videoRef = useRef<HTMLVideoElement>(null);
  // Stable indirection so usePlayerBackend can register observeProperties once,
  // while usePlaybackState keeps the actual handler fresh on every render
  const mpvHandlerRef = useRef<MpvPropertyHandler>(() => {});

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("Subtitles");
  const [resumeToast, setResumeToast] = useState("");
  const [externalSwitching, setExternalSwitching] = useState(false);

  // Apply player-page class for full-screen CSS
  useEffect(() => {
    document.documentElement.classList.add("player-page");
    document.body.classList.add("player-page");
    return () => {
      document.documentElement.classList.remove("player-page");
      document.body.classList.remove("player-page");
    };
  }, []);

  // ── Hooks ──────────────────────────────────────────────────────────────

  const streamLoader = useStreamLoader({
    type,
    id,
    season,
    episode,
    activeAddonUrls,
    settingsLoading,
    profileId: profile?.id,
  });

  const backend = usePlayerBackend(
    streamLoader.loadState,
    streamLoader.resolvedUrl,
    streamLoader.resolvedMimetype,
    streamLoader.resumePosition,
    streamLoader.platform,
    videoRef,
    mpvHandlerRef,
    (msg) => {
      setResumeToast(msg);
      setTimeout(() => setResumeToast(""), 3000);
    },
  );

  // usePlaybackState is called after backend so playerMode is available.
  // It also writes mpvHandlerRef.current synchronously each render so the
  // indirection in usePlayerBackend always calls the latest handler.
  const ps = usePlaybackState(backend.playerMode, videoRef, mpvHandlerRef);

  useProgressSync(progressMediaId, progressMediaType, profile?.id, ps.timePos, ps.duration);

  const controls = usePlayerControls({
    playerMode: backend.playerMode,
    videoRef,
    muted: ps.muted,
    isSettingsOpen,
    handleFullscreen: backend.handleFullscreen,
    onOpenExternalSwitching: setExternalSwitching,
  });

  const { showControls, resetUiTimer, hideControls } = useControlsVisibility(ps.paused);

  // ── Helpers ────────────────────────────────────────────────────────────

  function sectionChange(section: Section) {
    if (!isSettingsOpen) {
      setIsSettingsOpen(true);
    } else if (activeSection === section) {
      setIsSettingsOpen(false);
    }
    setActiveSection(section);
  }

  // Shared props threaded into PlayerControls across all render paths
  const sharedControls = {
    paused: ps.paused,
    isBuffering: ps.isBuffering,
    timePos: ps.timePos,
    duration: ps.duration,
    buffered: ps.buffered,
    volume: ps.volume,
    muted: ps.muted,
    audioTracks: ps.audioTracks,
    subtitleTracks: ps.subtitleTracks,
    currentAid: ps.currentAid,
    currentSid: ps.currentSid,
    isSettingsOpen,
    activeSection,
    selectedResolutionLabel: streamLoader.selectedResolutionLabel,
    streams: streamLoader.streams,
    selected: streamLoader.selected,
    switchingTo: streamLoader.switchingTo,
    switching: streamLoader.switching || externalSwitching,
    switchError: streamLoader.switchError,
    isFullscreen: backend.isFullscreen,
    platform: streamLoader.platform,
    onSectionChange: sectionChange,
    onSetActiveSection: setActiveSection,
    onCloseSettings: () => setIsSettingsOpen(false),
    onSelectStream: streamLoader.selectStream,
    onOpenExternal: controls.handleOpenExternal,
    onSelectResolution: streamLoader.selectResolution,
    onFullscreen: backend.handleFullscreen,
    onPlayPause: controls.handlePlayPause,
    onSeekRelative: controls.handleSeekRelative,
    onSeekTo: controls.handleSeekTo,
    onVolumeChange: controls.handleVolumeChange,
    onToggleMute: controls.handleToggleMute,
    onSetSid: controls.handleSetSid,
    onSetAid: controls.handleSetAid,
  } as const;

  // ── Loading ──────────────────────────────────────────────────────────────

  if (streamLoader.loadState === "loading") {
    return (
      <>
        <video ref={videoRef} className="hidden" playsInline />
        <div className="relative w-full h-screen flex flex-col items-center justify-center gap-3 bg-background">
          <BackButton onClick={() => navigate(-1)} />
          <MultiStepLoader currentStep={streamLoader.loadingStep} steps={LOADING_STEPS} />
        </div>
      </>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (streamLoader.loadState === "error") {
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
            <p className="text-sm text-zinc-400 mb-2">{streamLoader.loadError}</p>
            {streamLoader.streams.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => { setIsSettingsOpen(true); setActiveSection("Source"); }}
              >
                Try another stream
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate(-1)}>Go back</Button>
          </div>
          {streamLoader.streams.length > 0 && (
            <PlayerControls {...sharedControls} controlsVisible={false} />
          )}
        </div>
      </>
    );
  }

  // ── Desktop prompt ───────────────────────────────────────────────────────

  if (backend.playerMode === "desktop-prompt") {
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
            <Button
              variant="secondary"
              onClick={() => { setIsSettingsOpen(true); setActiveSection("Source"); }}
            >
              Browse other streams
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>Go back</Button>
          </div>
          <PlayerControls {...sharedControls} controlsVisible={false} />
        </div>
      </>
    );
  }

  // ── External (VLC) ───────────────────────────────────────────────────────

  if (backend.playerMode === "external") {
    return (
      <>
        <video ref={videoRef} className="hidden" playsInline />
        <div className="relative w-full h-screen flex flex-col items-center justify-center gap-4 px-8 text-center bg-background">
          <BackButton onClick={() => navigate(-1)} />
          <div className="flex flex-col items-center max-w-sm gap-4">
            <p className="text-sm text-zinc-400">Opened in VLC.</p>
            <Button
              variant="secondary"
              onClick={() => { setIsSettingsOpen(true); setActiveSection("Source"); }}
            >
              Browse other streams
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>Go back</Button>
          </div>
          <PlayerControls {...sharedControls} controlsVisible={false} />
        </div>
      </>
    );
  }

  // ── Player ───────────────────────────────────────────────────────────────

  const controlsVisible = showControls || ps.paused || ps.isBuffering;
  const showVideo = backend.playerMode === "browser-video" || backend.playerMode === "hls";

  return (
    <div
      className="relative w-full h-screen bg-transparent overflow-hidden"
      onMouseMove={resetUiTimer}
      onMouseLeave={hideControls}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          playsInline
        />
      ) : (
        <video ref={videoRef} className="hidden" />
      )}

      {resumeToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white/80 text-[12px] px-4 py-2 rounded-full pointer-events-none">
          {resumeToast}
        </div>
      )}

      {controlsVisible && <BackButton onClick={() => navigate(-1)} />}

      <PlayerControls {...sharedControls} controlsVisible={controlsVisible} />
    </div>
  );
}

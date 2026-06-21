import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { keys } from "@/lib/queryKeys";
import { useSettings } from "@/context/SettingsContext";
import { fetchTorboxPlan } from "@/services/torbox";

import { getPlatform } from "@/player/platform";
import { useSourceFeed } from "@/player/sources/useSourceFeed";
import {
  autoPick,
  groupByResolution,
  preferredResolution,
  sortSources,
} from "@/player/sources/selectSource";
import { RESOLUTION_INDEX } from "@/player/playback/resolvePlayback";
import { usePlaybackController } from "@/player/playback/usePlaybackController";
import { RESOLUTION_ORDER } from "@/player/types";

import PlayerDesktop from "./PlayerDesktop";
import PlayerWeb from "./PlayerWeb";
import Sidepanel from "./Sidepanel";
import PlayerOverlays from "./PlayerOverlays";
import type { PlayerVM, Section } from "./types";
import { usePlayerControls } from "./hooks/usePlayerControls";
import { useControlsVisibility } from "./hooks/useControlsVisibility";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useFullscreen } from "./hooks/useFullscreen";
import { TorboxUpgrade } from "@/components/TorboxKey";

const PRO_PLAN = 2;
const WEB_QUALITY_OPTIONS = ["Original", "1080p", "720p", "480p", "360p"];

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
  const isWeb = !isTauriPlatform;
  const requiresPro = !isTauriPlatform;

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
  const gatePassed = !settingsLoading && planResolved && allowed;

  // ── Source feed → sorted list ──────────────────────────────────────────────
  const feed = useSourceFeed({
    type: type === "tv" ? "tv" : type === "movie" ? "movie" : undefined,
    tmdbId: id,
    season,
    episode,
    activeAddonUrls,
    enabled: gatePassed,
  });
  const sources = useMemo(
    () => sortSources(feed.sources, preferredResolution(platform)),
    [feed.sources, platform],
  );

  // ── Playback engine ────────────────────────────────────────────────────────
  const controller = usePlaybackController(platform, {
    season: seasonNum,
    episode: episodeNum,
  });
  const { telemetry, videoRef, resolved, selected, webSel } = controller;

  // Reset playback state when navigating to a different title.
  useEffect(() => {
    controller.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, season, episode]);

  // Auto-pick the best playable source once the feed settles.
  useEffect(() => {
    if (!gatePassed || feed.loading || feed.error) return;
    const best = autoPick(sources, platform, new Set());
    if (best) {
      void controller.playSource(best);
    } else {
      controller.setError(
        sources.length
          ? "No sources are playable on this device."
          : "Your addons didn't return any streams.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatePassed, feed.loading, feed.error, sources, platform]);

  // ── Control handlers + chrome ──────────────────────────────────────────────
  const { isFullscreen, toggle: onFullscreen } = useFullscreen(platform);

  const controls = usePlayerControls({
    platform,
    videoRef,
    muted: telemetry.muted,
    sources,
    selected,
    playSource: controller.playSource,
    selectWebAudio: controller.selectWebAudio,
    selectWebSubtitle: controller.selectWebSubtitle,
    selectWebResolution: controller.selectWebResolution,
    setError: controller.setError,
  });

  const { showControls, resetTimer, hide } = useControlsVisibility(
    telemetry.paused,
  );

  const isPlaying = controller.phase === "playing";

  useKeyboardShortcuts({
    enabled: isPlaying,
    onPlayPause: controls.onPlayPause,
    onSeekRelative: controls.onSeekRelative,
    onFullscreen,
    onToggleMute: controls.onToggleMute,
  });

  // ── Derived view model ─────────────────────────────────────────────────────
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

  // ── Sidepanel UI state ─────────────────────────────────────────────────────
  const [sidepanelOpen, setSidepanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("Source");

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

  const controlsVisible =
    isPlaying &&
    !controller.switching &&
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
    switching: controller.switching,
    audioTracks,
    subtitleTracks,
    currentAid,
    currentSid,
    sources,
    selected,
    switchingTo: controller.switchingTo,
    quality,
    onPlayPause: controls.onPlayPause,
    onSeekRelative: controls.onSeekRelative,
    onSeekTo: controls.onSeekTo,
    onVolumeChange: controls.onVolumeChange,
    onToggleMute: controls.onToggleMute,
    onSetAudio: controls.onSetAudio,
    onSetSubtitle: controls.onSetSubtitle,
    onSelectQuality: controls.onSelectQuality,
    onSelectSource: controls.onSelectSource,
    onFullscreen,
    sidepanelOpen,
    activeSection,
    onSectionToggle,
    onCloseSidepanel: () => setSidepanelOpen(false),
  };

  // ── Guards ──────────────────────────────────────────────────────────────────
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

  const error = controller.error ?? feed.error;
  const loadStep = feed.loading ? feed.step : controller.loadStep;
  const showLoading = !error && (feed.loading || (!isPlaying && !!selected));
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

      <PlayerOverlays
        switching={controller.switching}
        isPlaying={isPlaying}
        showLoading={showLoading}
        loadStep={loadStep}
        error={error}
        hasSources={sources.length > 0}
        onBrowseSources={() => {
          controller.setError(null);
          setActiveSection("Source");
          setSidepanelOpen(true);
        }}
        goBack={goBack}
      />

      <Sidepanel vm={vm} />

      {showBack && <BackButton onClick={goBack} />}
    </div>
  );
}

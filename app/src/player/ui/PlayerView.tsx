import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Controls, { type Section } from "./Controls";
import Overlay from "./Overlay";
import type { PlayerSnapshot } from "../session/usePlayerSession";

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

interface PlayerViewProps {
  s: PlayerSnapshot;
  videoRef: React.RefObject<HTMLVideoElement>;
  onBack: () => void;
}

export default function PlayerView({ s, videoRef, onBack }: PlayerViewProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("Source");
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(s.paused);
  pausedRef.current = s.paused;

  const isPlaying = s.status.kind === "none" || s.status.kind === "stalled";
  const blocking =
    s.status.kind === "gating" ||
    s.status.kind === "loading" ||
    s.status.kind === "error" ||
    s.status.kind === "needs-upgrade" ||
    s.status.kind === "external";

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

  // Keyboard shortcuts (only meaningful while a real player is active).
  useEffect(() => {
    if (!isPlaying) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable) return;
      let handled = true;
      switch (e.key) {
        case " ":
          s.onPlayPause();
          break;
        case "ArrowRight":
          s.onSeekRelative(10);
          break;
        case "ArrowLeft":
          s.onSeekRelative(-10);
          break;
        case "f":
        case "F":
          s.onFullscreen();
          break;
        case "m":
        case "M":
          s.onToggleMute();
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, s]);

  const onSectionButton = useCallback(
    (section: Section) => {
      if (!isSettingsOpen) setIsSettingsOpen(true);
      else if (activeSection === section) setIsSettingsOpen(false);
      setActiveSection(section);
    },
    [isSettingsOpen, activeSection],
  );

  const controlsVisible =
    isPlaying &&
    s.status.kind !== "switching" &&
    (showControls || s.paused || s.isBuffering);

  const showBack = blocking || controlsVisible;

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${s.platform === "tauri" ? "bg-transparent" : "bg-black"}`}
      onMouseMove={resetTimer}
      onMouseLeave={hide}
    >
      <video
        ref={videoRef}
        className={s.showVideo ? "absolute inset-0 size-full bg-black object-contain" : "hidden"}
        playsInline
      />

      <Overlay
        status={s.status}
        onRetry={s.onRetry}
        onSkip={s.onSkip}
        onBrowseSources={() => {
          setIsSettingsOpen(true);
          setActiveSection("Source");
        }}
        onBack={onBack}
      />

      {s.resumeToast && s.status.kind === "none" && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-[12px] text-white/80">
          {s.resumeToast}
        </div>
      )}

      {showBack && <BackButton onClick={onBack} />}

      {isPlaying && (
        <Controls
          s={s}
          controlsVisible={controlsVisible}
          isSettingsOpen={isSettingsOpen}
          activeSection={activeSection}
          onSectionButton={onSectionButton}
          onCloseSettings={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

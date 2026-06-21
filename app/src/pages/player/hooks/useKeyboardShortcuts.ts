import { useEffect } from "react";

interface Params {
  /** Only bind while a real player is active. */
  enabled: boolean;
  onPlayPause: () => void;
  onSeekRelative: (delta: number) => void;
  onFullscreen: () => void | Promise<void>;
  onToggleMute: () => void;
}

/** Global keyboard shortcuts for the player (space/seek/fullscreen/mute). */
export function useKeyboardShortcuts({
  enabled,
  onPlayPause,
  onSeekRelative,
  onFullscreen,
  onToggleMute,
}: Params) {
  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled, onPlayPause, onSeekRelative, onFullscreen, onToggleMute]);
}

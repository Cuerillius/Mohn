import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Platform } from "@/player/platform";

/**
 * Fullscreen toggle that works on both the Tauri window (desktop) and the
 * browser Fullscreen API (web), and always exits fullscreen on unmount.
 */
export function useFullscreen(platform: Platform) {
  const isTauriPlatform = platform === "tauri";
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fsRef = useRef(false);

  const toggle = useCallback(async () => {
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

  useEffect(() => {
    return () => {
      if (!fsRef.current) return;
      if (isTauriPlatform)
        getCurrentWindow()
          .setFullscreen(false)
          .catch(() => {});
      else document.exitFullscreen().catch(() => {});
    };
  }, [isTauriPlatform]);

  return { isFullscreen, toggle };
}

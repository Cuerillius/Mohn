import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-hiding player chrome: controls show on mouse activity and hide after a
 * short idle period, but never while paused.
 */
export function useControlsVisibility(paused: boolean) {
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

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

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return { showControls, resetTimer, hide };
}

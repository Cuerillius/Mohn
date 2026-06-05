import { useState, useRef, useCallback } from "react";

export function useControlsVisibility(paused: boolean) {
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const resetUiTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!pausedRef.current) setShowControls(false);
    }, 3000);
  }, []);

  const hideControls = useCallback(() => {
    if (!pausedRef.current) setShowControls(false);
  }, []);

  return { showControls, resetUiTimer, hideControls };
}

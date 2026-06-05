import { useEffect, useCallback, useRef, type RefObject } from "react";
import { command, setProperty } from "tauri-plugin-libmpv-api";
import { ExternalStreamPlayer } from "../services/streamPlayer";
import { createAndResolveLink } from "../services/torbox";
import type { EnrichedStream } from "../types/torbox";
import type { PlayerMode } from "./usePlaybackState";

interface UsePlayerControlsParams {
  playerMode: PlayerMode;
  videoRef: RefObject<HTMLVideoElement>;
  muted: boolean;
  isSettingsOpen: boolean;
  handleFullscreen: () => Promise<void>;
  onOpenExternalSwitching: (v: boolean) => void;
}

export interface PlayerControlHandlers {
  handlePlayPause: () => void;
  handleSeekRelative: (delta: number) => void;
  handleSeekTo: (t: number) => void;
  handleVolumeChange: (v: number) => void;
  handleToggleMute: () => void;
  handleSetSid: (id: string) => void;
  handleSetAid: (id: string) => void;
  handleOpenExternal: (stream: EnrichedStream) => Promise<void>;
}

export function usePlayerControls({
  playerMode,
  videoRef,
  muted,
  isSettingsOpen,
  handleFullscreen,
  onOpenExternalSwitching,
}: UsePlayerControlsParams): PlayerControlHandlers {
  // Stable refs for use in keyboard handler without re-registering
  const playerModeRef = useRef(playerMode);
  playerModeRef.current = playerMode;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const isSettingsOpenRef = useRef(isSettingsOpen);
  isSettingsOpenRef.current = isSettingsOpen;

  const handlePlayPause = useCallback(() => {
    if (playerModeRef.current === "mpv") {
      command("cycle", ["pause"]).catch(() => {});
    } else {
      const v = videoRef.current;
      if (!v) return;
      v.paused ? v.play().catch(() => {}) : v.pause();
    }
  }, [videoRef]);

  const handleSeekRelative = useCallback((delta: number) => {
    if (playerModeRef.current === "mpv") {
      command("seek", [String(delta), "relative"]).catch(() => {});
    } else {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    }
  }, [videoRef]);

  const handleSeekTo = useCallback((t: number) => {
    if (playerModeRef.current === "mpv") {
      setProperty("time-pos", t).catch(() => {});
    } else {
      const v = videoRef.current;
      if (v) v.currentTime = t;
    }
  }, [videoRef]);

  const handleVolumeChange = useCallback((v: number) => {
    if (playerModeRef.current === "mpv") {
      setProperty("volume", v).catch(() => {});
    } else {
      const el = videoRef.current;
      if (el) el.volume = v / 100;
    }
  }, [videoRef]);

  const handleToggleMute = useCallback(() => {
    if (playerModeRef.current === "mpv") {
      setProperty("mute", !mutedRef.current).catch(() => {});
    } else {
      const v = videoRef.current;
      if (v) v.muted = !v.muted;
    }
  }, [videoRef]);

  const handleSetSid = useCallback((id: string) => {
    if (playerModeRef.current === "mpv") {
      setProperty("sid", id).catch(() => {});
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = String(i + 1) === id ? "showing" : "disabled";
    }
  }, [videoRef]);

  const handleSetAid = useCallback((id: string) => {
    if (playerModeRef.current === "mpv") {
      setProperty("aid", id).catch(() => {});
      return;
    }
    const video = videoRef.current;
    type V = HTMLVideoElement & { audioTracks?: { length: number; [i: number]: { enabled: boolean } } };
    const at = (video as V).audioTracks;
    if (!at) return;
    for (let i = 0; i < at.length; i++) {
      at[i].enabled = String(i + 1) === id;
    }
  }, [videoRef]);

  const handleOpenExternal = useCallback(async (stream: EnrichedStream) => {
    onOpenExternalSwitching(true);
    try {
      const magnet = stream.magnetLink ?? `magnet:?xt=urn:btih:${stream.infoHash}`;
      const { url } = await createAndResolveLink(magnet, stream.fileIdx);
      await new ExternalStreamPlayer().loadFile(url);
    } finally {
      onOpenExternalSwitching(false);
    }
  }, [onOpenExternalSwitching]);

  // Keyboard shortcuts
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
      if (handled) e.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePlayPause, handleSeekRelative, handleToggleMute, handleFullscreen]);

  return {
    handlePlayPause,
    handleSeekRelative,
    handleSeekTo,
    handleVolumeChange,
    handleToggleMute,
    handleSetSid,
    handleSetAid,
    handleOpenExternal,
  };
}

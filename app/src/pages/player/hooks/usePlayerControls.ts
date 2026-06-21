import { useCallback, type RefObject } from "react";
import { command, setProperty } from "tauri-plugin-libmpv-api";

import type { Platform } from "@/player/platform";
import { groupByResolution, isPlayable } from "@/player/sources/selectSource";
import { RESOLUTION_INDEX } from "@/player/playback/resolvePlayback";
import type { Resolution, Source } from "@/player/types";

interface Params {
  platform: Platform;
  videoRef: RefObject<HTMLVideoElement>;
  muted: boolean;
  sources: Source[];
  selected: Source | null;
  playSource: (s: Source) => void;
  selectWebAudio: (index: number) => void;
  selectWebSubtitle: (index: number | null) => void;
  selectWebResolution: (index: number | null) => void;
  setError: (e: string | null) => void;
}

export interface PlayerControls {
  onPlayPause: () => void;
  onSeekRelative: (delta: number) => void;
  onSeekTo: (t: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onSetAudio: (id: string) => void;
  onSetSubtitle: (id: string) => void;
  onSelectQuality: (label: string) => void;
  onSelectSource: (s: Source) => void;
}

/**
 * Platform-conditional playback control handlers. Desktop drives mpv via the
 * libmpv plugin; web drives the <video> element directly (and re-requests the
 * HLS stream for track/quality changes through the playback controller).
 */
export function usePlayerControls({
  platform,
  videoRef,
  muted,
  sources,
  selected,
  playSource,
  selectWebAudio,
  selectWebSubtitle,
  selectWebResolution,
  setError,
}: Params): PlayerControls {
  const isTauriPlatform = platform === "tauri";

  const onPlayPause = useCallback(() => {
    if (isTauriPlatform) {
      command("cycle", ["pause"]).catch(() => {});
    } else {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }
  }, [isTauriPlatform, videoRef]);

  const onSeekRelative = useCallback(
    (delta: number) => {
      if (isTauriPlatform) {
        command("seek", [String(delta), "relative"]).catch(() => {});
      } else {
        const v = videoRef.current;
        if (v)
          v.currentTime = Math.max(
            0,
            Math.min(v.duration || 0, v.currentTime + delta),
          );
      }
    },
    [isTauriPlatform, videoRef],
  );

  const onSeekTo = useCallback(
    (t: number) => {
      if (isTauriPlatform) setProperty("time-pos", t).catch(() => {});
      else {
        const v = videoRef.current;
        if (v) v.currentTime = t;
      }
    },
    [isTauriPlatform, videoRef],
  );

  const onVolumeChange = useCallback(
    (v: number) => {
      if (isTauriPlatform) setProperty("volume", v).catch(() => {});
      else {
        const el = videoRef.current;
        if (el) el.volume = v / 100;
      }
    },
    [isTauriPlatform, videoRef],
  );

  const onToggleMute = useCallback(() => {
    if (isTauriPlatform) setProperty("mute", !muted).catch(() => {});
    else {
      const v = videoRef.current;
      if (v) v.muted = !v.muted;
    }
  }, [isTauriPlatform, videoRef, muted]);

  const onSetAudio = useCallback(
    (trackId: string) => {
      if (isTauriPlatform) setProperty("aid", trackId).catch(() => {});
      else selectWebAudio(Number(trackId));
    },
    [isTauriPlatform, selectWebAudio],
  );

  const onSetSubtitle = useCallback(
    (trackId: string) => {
      if (isTauriPlatform) setProperty("sid", trackId).catch(() => {});
      else selectWebSubtitle(trackId === "no" ? null : Number(trackId));
    },
    [isTauriPlatform, selectWebSubtitle],
  );

  const onSelectQuality = useCallback(
    (label: string) => {
      if (!isTauriPlatform) {
        selectWebResolution(RESOLUTION_INDEX[label] ?? null);
        return;
      }
      const groups = groupByResolution(sources);
      const group = groups[label as Resolution] ?? [];
      const target = group.find((s) => isPlayable(s, platform));
      if (target && target.infoHash !== selected?.infoHash) {
        playSource(target);
      }
    },
    [isTauriPlatform, selectWebResolution, sources, selected, platform, playSource],
  );

  const onSelectSource = useCallback(
    (s: Source) => {
      if (s.infoHash === selected?.infoHash) return;
      setError(null);
      playSource(s);
    },
    [selected, setError, playSource],
  );

  return {
    onPlayPause,
    onSeekRelative,
    onSeekTo,
    onVolumeChange,
    onToggleMute,
    onSetAudio,
    onSetSubtitle,
    onSelectQuality,
    onSelectSource,
  };
}

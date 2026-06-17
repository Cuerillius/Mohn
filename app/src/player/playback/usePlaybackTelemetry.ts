import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { PlaybackState, TrackInfo } from "../types";
import type { MpvPropertyEvent } from "./backends/mpvBackend";

export type TelemetryMode = "mpv" | "hls" | "external" | null;

const STALL_TIMEOUT_MS = 20_000;

function mediaErrorMessage(err: MediaError | null): string {
  if (!err) return "Playback error";
  switch (err.code) {
    case err.MEDIA_ERR_ABORTED:
      return "Playback aborted";
    case err.MEDIA_ERR_NETWORK:
      return "Network error while streaming";
    case err.MEDIA_ERR_DECODE:
      return "This file couldn't be decoded";
    case err.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "This stream isn't supported";
    default:
      return "Playback error";
  }
}

interface MpvTrackNode {
  id: number;
  type: "video" | "audio" | "sub";
  title?: string;
  lang?: string;
  codec?: string;
}

export interface Telemetry extends PlaybackState {
  /** Pass to the MpvBackend constructor; stable across renders. */
  handleMpvProperty: (ev: MpvPropertyEvent) => void;
  /** Clear a surfaced error (e.g. when switching source). */
  clearError: () => void;
  setBuffering: (v: boolean) => void;
}

/**
 * Unified playback telemetry across mpv and HTML5/HLS. The mpv path is driven by
 * `handleMpvProperty` (fed by the backend); the HLS path attaches listeners to
 * the <video> element. Includes a stall watchdog.
 */
export function usePlaybackTelemetry(
  mode: TelemetryMode,
  videoRef: RefObject<HTMLVideoElement>,
): Telemetry {
  const [paused, setPaused] = useState(true);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<TrackInfo[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<TrackInfo[]>([]);
  const [currentAid, setCurrentAid] = useState("auto");
  const [currentSid, setCurrentSid] = useState("no");

  const timePosRef = useRef(0);
  const lastAdvanceRef = useRef(Date.now());
  const pausedRef = useRef(true);
  const bufferingRef = useRef(false);

  const clearError = useCallback(() => setPlaybackError(null), []);

  // ── mpv property handler (stable) ──────────────────────────────────────────
  const handleMpvProperty = useCallback(
    ({ name, data }: MpvPropertyEvent) => {
      switch (name) {
        case "pause": {
          const p = !!data;
          setPaused(p);
          pausedRef.current = p;
          if (p) {
            setIsBuffering(false);
            bufferingRef.current = false;
          }
          break;
        }
        case "time-pos": {
          const t = (data as number) || 0;
          setTimePos(t);
          if (t !== timePosRef.current) {
            timePosRef.current = t;
            lastAdvanceRef.current = Date.now();
            setIsStalled(false);
          }
          break;
        }
        case "duration":
          setDuration((data as number) || 0);
          break;
        case "aid":
          setCurrentAid((data ?? "auto").toString());
          break;
        case "sid":
          setCurrentSid((data ?? "no").toString());
          break;
        case "volume":
          setVolume((data as number) || 0);
          break;
        case "mute":
          setMuted(!!data);
          break;
        case "paused-for-cache":
          setIsBuffering(!!data);
          bufferingRef.current = !!data;
          break;
        case "core-idle":
          setIsBuffering(!!data);
          bufferingRef.current = !!data;
          break;
        case "demuxer-cache-duration":
          setBuffered(timePosRef.current + ((data as number) || 0));
          break;
        case "track-list": {
          const tracks = (data as MpvTrackNode[]) || [];
          setAudioTracks(
            tracks
              .filter((t) => t.type === "audio")
              .map((t) => ({
                id: String(t.id),
                label: t.title || t.lang || `Audio ${t.id}`,
                lang: t.lang,
                codec: t.codec,
              })),
          );
          setSubtitleTracks(
            tracks
              .filter((t) => t.type === "sub")
              .map((t) => ({
                id: String(t.id),
                label: t.title || t.lang || `Subtitle ${t.id}`,
                lang: t.lang,
              })),
          );
          break;
        }
      }
    },
    [],
  );

  // ── HTML5 / HLS listeners ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "hls") return;
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setPaused(false);
      pausedRef.current = false;
    };
    const onPause = () => {
      setPaused(true);
      pausedRef.current = true;
    };
    const onTimeUpdate = () => {
      setTimePos(video.currentTime);
      timePosRef.current = video.currentTime;
      lastAdvanceRef.current = Date.now();
      setIsStalled(false);
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onVolumeChange = () => {
      setVolume(Math.round(video.volume * 100));
      setMuted(video.muted);
    };
    const onWaiting = () => {
      setIsBuffering(true);
      bufferingRef.current = true;
    };
    const onPlaying = () => {
      setIsBuffering(false);
      bufferingRef.current = false;
    };
    const onCanPlay = () => {
      setIsBuffering(false);
      bufferingRef.current = false;
    };
    const onProgress = () => {
      const buf = video.buffered;
      if (buf.length > 0) setBuffered(buf.end(buf.length - 1));
    };
    const onError = () => setPlaybackError(mediaErrorMessage(video.error));

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("progress", onProgress);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("error", onError);
    };
  }, [mode, videoRef]);

  // ── Stall watchdog ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode == null || mode === "external") return;
    const interval = setInterval(() => {
      if (
        !pausedRef.current &&
        bufferingRef.current &&
        Date.now() - lastAdvanceRef.current > STALL_TIMEOUT_MS
      ) {
        setIsStalled(true);
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [mode]);

  const setBuffering = useCallback((v: boolean) => {
    setIsBuffering(v);
    bufferingRef.current = v;
  }, []);

  return {
    paused,
    timePos,
    duration,
    volume,
    muted,
    buffered,
    isBuffering,
    isStalled,
    playbackError,
    audioTracks,
    subtitleTracks,
    currentAid,
    currentSid,
    handleMpvProperty,
    clearError,
    setBuffering,
  };
}

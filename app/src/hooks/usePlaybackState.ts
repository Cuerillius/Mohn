import { useState, useEffect, useCallback, useRef, type MutableRefObject, type RefObject } from "react";
import type { MpvTrack } from "../components/PlayerControls";

interface AudioTrack { id: string; label: string; language: string; enabled: boolean; }
interface AudioTrackList extends EventTarget { readonly length: number; [index: number]: AudioTrack; }
type VideoWithAudioTracks = HTMLVideoElement & { audioTracks?: AudioTrackList };

export type PlayerMode = "mpv" | "browser-video" | "hls" | "external" | "desktop-prompt" | null;

export interface PlaybackState {
  paused: boolean;
  timePos: number;
  duration: number;
  volume: number;
  muted: boolean;
  audioTracks: MpvTrack[];
  subtitleTracks: MpvTrack[];
  currentAid: string;
  currentSid: string;
  buffered: number;
  isBuffering: boolean;
  setIsBuffering: (v: boolean) => void;
}

export type MpvPropertyHandler = (ev: { name: string; data: unknown }) => void;

export function usePlaybackState(
  playerMode: PlayerMode,
  videoRef: RefObject<HTMLVideoElement>,
  mpvHandlerRef: MutableRefObject<MpvPropertyHandler>,
): PlaybackState {
  const [paused, setPaused] = useState(true);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [audioTracks, setAudioTracks] = useState<MpvTrack[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<MpvTrack[]>([]);
  const [currentAid, setCurrentAid] = useState("auto");
  const [currentSid, setCurrentSid] = useState("no");
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Ref for tracking timePos inside the mpv handler (avoids stale closure)
  const timePosRef = useRef(0);

  // Keep mpvHandlerRef.current up-to-date so usePlayerBackend can use it via indirection
  const handleMpvProperty: MpvPropertyHandler = useCallback(
    ({ name, data }) => {
      if (name === "pause") {
        const p = !!data;
        setPaused(p);
        if (p) setIsBuffering(false);
      } else if (name === "time-pos") {
        const t = (data as number) || 0;
        setTimePos(t);
        timePosRef.current = t;
      } else if (name === "duration") {
        setDuration((data as number) || 0);
      } else if (name === "aid") {
        setCurrentAid((data ?? "auto").toString());
      } else if (name === "sid") {
        setCurrentSid((data ?? "no").toString());
      } else if (name === "volume") {
        setVolume((data as number) || 0);
      } else if (name === "mute") {
        setMuted(!!data);
      } else if (name === "paused-for-cache") {
        if (!!data) setIsBuffering(true);
      } else if (name === "demuxer-cache-duration") {
        setBuffered(timePosRef.current + ((data as number) || 0));
      } else if (name === "track-list") {
        const tracks = (data as MpvTrack[]) || [];
        setAudioTracks(tracks.filter((t) => t.type === "audio"));
        setSubtitleTracks(tracks.filter((t) => t.type === "sub"));
      } else if (name === "core-idle") {
        setIsBuffering(!!data);
      }
    },
    [],
  );

  // Always keep the ref current so usePlayerBackend can register it once
  mpvHandlerRef.current = handleMpvProperty;

  // Attach HTML5 event listeners for browser-video / hls
  useEffect(() => {
    if (playerMode !== "browser-video" && playerMode !== "hls") return;
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => { setPaused(false); };
    const onPause = () => { setPaused(true); };
    const onTimeUpdate = () => { setTimePos(video.currentTime); };
    const onDurationChange = () => { setDuration(video.duration || 0); };
    const onVolumeChange = () => {
      setVolume(Math.round(video.volume * 100));
      setMuted(video.muted);
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onProgress = () => {
      const buf = video.buffered;
      if (buf.length > 0) setBuffered(buf.end(buf.length - 1));
    };

    // Sync audio tracks from the HTML5 AudioTrackList (Chrome/Safari only)
    const syncAudioTracks = () => {
      const at = (video as VideoWithAudioTracks).audioTracks;
      if (!at) return;
      const tracks: MpvTrack[] = [];
      for (let i = 0; i < at.length; i++) {
        const t = at[i];
        tracks.push({ id: i + 1, type: "audio", title: t.label || undefined, lang: t.language || undefined });
        if (t.enabled) setCurrentAid(String(i + 1));
      }
      setAudioTracks(tracks);
    };

    // Sync subtitle/caption text tracks from the HTML5 TextTrackList
    const syncTextTracks = () => {
      const tt = video.textTracks;
      const tracks: MpvTrack[] = [];
      for (let i = 0; i < tt.length; i++) {
        const t = tt[i];
        if (t.kind === "subtitles" || t.kind === "captions") {
          tracks.push({ id: i + 1, type: "sub", title: t.label || undefined, lang: t.language || undefined });
          if (t.mode === "showing") setCurrentSid(String(i + 1));
        }
      }
      setSubtitleTracks(tracks);
    };

    const onLoadedMetadata = () => {
      syncAudioTracks();
      syncTextTracks();
    };

    const at = (video as VideoWithAudioTracks).audioTracks;
    const onAudioTrackChange = () => syncAudioTracks();
    const onTextTrackChange = () => syncTextTracks();

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("progress", onProgress);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    at?.addEventListener("change", onAudioTrackChange);
    video.textTracks.addEventListener("change", onTextTrackChange);
    video.textTracks.addEventListener("addtrack", onTextTrackChange);

    // Sync immediately in case tracks are already loaded
    syncAudioTracks();
    syncTextTracks();

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      at?.removeEventListener("change", onAudioTrackChange);
      video.textTracks.removeEventListener("change", onTextTrackChange);
      video.textTracks.removeEventListener("addtrack", onTextTrackChange);
    };
  }, [playerMode, videoRef]);

  return {
    paused,
    timePos,
    duration,
    volume,
    muted,
    audioTracks,
    subtitleTracks,
    currentAid,
    currentSid,
    buffered,
    isBuffering,
    setIsBuffering,
  };
}

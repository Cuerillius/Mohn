// Domain types for the player module.

export type Resolution =
  | "4K"
  | "1440p"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "240p"
  | "Unknown";

export const RESOLUTION_ORDER: Resolution[] = [
  "4K",
  "1440p",
  "1080p",
  "720p",
  "480p",
  "360p",
  "240p",
  "Unknown",
];

/**
 * A playable source: one torrent file surfaced by an addon, enriched with parsed
 * metadata and (progressively) TorBox cache status.
 */
export interface Source {
  /** Normalised lowercase btih hash — the stable identity used for dedup/tried-set. */
  infoHash: string;
  magnetLink?: string;
  /** File index hint from the addon (Stremio `fileIdx`). */
  fileIdx?: number;
  /** Exact file name within the torrent (Stremio `behaviorHints.filename`) — the
   *  most reliable way to pick the right file out of a pack. */
  filename?: string;
  addonUrl?: string;
  /** Best-effort release name (first line of the addon's title/description). */
  rawName: string;
  parsedTitle: string;
  resolution: Resolution;
  seeders?: number;
  /** Size parsed from the addon listing (often the torrent total). */
  torrentSizeBytes?: number;
  /**
   * Size of the actual video file we'd play, once known from the TorBox cache
   * check (or `behaviorHints.videoSize`). This is what the web ≤5 GB gate uses —
   * never the torrent total.
   */
  fileSizeBytes?: number;
  cached: boolean;
}

/** A selectable audio/subtitle track, unified across mpv and web HLS. */
export interface TrackInfo {
  /** mpv: numeric track id as string; web: relative index as string ("none" for no subs). */
  id: string;
  label: string;
  lang?: string;
  codec?: string;
}

export type PlaybackKind = "file" | "hls";

/**
 * Opaque handle for re-requesting a web HLS stream with different
 * audio/subtitle/resolution selections without recreating the torrent.
 */
export interface WebStreamHandle {
  torrentId: number;
  fileId: number;
  presignedToken: string;
  userToken: string;
}

/** Result of turning a Source into something a backend can load. */
export interface ResolvedPlayback {
  url: string;
  kind: PlaybackKind;
  mimetype?: string;
  /** web HLS only */
  handle?: WebStreamHandle;
  /** web HLS only — tracks come from createStream metadata, not the media element. */
  audioTracks?: TrackInfo[];
  subtitleTracks?: TrackInfo[];
  /** web HLS only — relative index of the audio/subtitle that produced this url. */
  audioIndex?: number;
  subtitleIndex?: number | null;
  resolutionIndex?: number | null;
}

/** Live playback telemetry, unified across mpv and HTML5/HLS. */
export interface PlaybackState {
  paused: boolean;
  timePos: number;
  duration: number;
  volume: number;
  muted: boolean;
  buffered: number;
  isBuffering: boolean;
  isStalled: boolean;
  playbackError: string | null;
  /** mpv-native tracks (web tracks live on the session, sourced from ResolvedPlayback). */
  audioTracks: TrackInfo[];
  subtitleTracks: TrackInfo[];
  currentAid: string;
  currentSid: string;
}

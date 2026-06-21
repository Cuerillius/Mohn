// TorBox client for the player module. All calls go through the gatekeeper
// proxy at /api/torbox, which injects the user's API key (Bearer header).

import { parseTorrentTitle } from "@viren070/parse-torrent-title";

const BASE = `${import.meta.env.VITE_GATEKEEPER_URL}/api/torbox`;

export class SlotsFullError extends Error {
  constructor() {
    super("ACTIVE_LIMIT");
    this.name = "SlotsFullError";
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`TorBox ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function postForm<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`TorBox ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Plan ────────────────────────────────────────────────────────────────────

interface UserResponse {
  success: boolean;
  data?: { plan: number };
}

/** TorBox plan code: 0=Free, 1=Essential, 2=Pro, 3=Standard. */
export async function fetchPlan(): Promise<number> {
  const res = await get<UserResponse>("/user/me");
  return res.data?.plan ?? 0;
}

// ── Cache check ───────────────────────────────────────────────────────────────

export interface CachedFile {
  id: number;
  name: string;
  size: number;
}
interface CachedItem {
  name: string;
  size: number;
  hash: string;
  files?: CachedFile[];
}
interface CacheCheckResponse {
  success: boolean;
  data?: Record<string, CachedItem | undefined>;
}

/** Returns the subset of `hashes` that TorBox has cached, with per-file sizes. */
export async function checkCached(
  hashes: string[],
): Promise<Record<string, CachedItem | undefined>> {
  if (hashes.length === 0) return {};
  const res = await fetch(`${BASE}/torrents/checkcached?format=object`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hashes }),
  });
  if (!res.ok) return {};
  const json = (await res.json()) as CacheCheckResponse;
  return json.data ?? {};
}

// ── Torrent + file resolution (shared by desktop direct + web HLS) ─────────────

interface CreateTorrentResponse {
  success: boolean;
  detail?: string;
  error?: string;
  data: { torrent_id: number } | null;
}

interface TorrentFile {
  id: number;
  name: string;
  size: number;
  mimetype?: string;
}
interface ListResponse {
  success: boolean;
  data:
    | { files?: TorrentFile[]; download_state?: string }
    | Array<{ files?: TorrentFile[] }>
    | null;
}

async function createTorrent(magnet: string): Promise<number> {
  const fd = new FormData();
  fd.append("magnet", magnet);
  const res = await postForm<CreateTorrentResponse>(
    "/torrents/createtorrent",
    fd,
  );
  if (
    !res.success &&
    (res.detail === "ACTIVE_LIMIT" || res.error === "ACTIVE_LIMIT")
  ) {
    throw new SlotsFullError();
  }
  if (!res.success || !res.data) {
    throw new Error(res.error ?? res.detail ?? "Failed to create torrent");
  }
  return res.data.torrent_id;
}

async function getTorrentFiles(
  torrentId: number,
): Promise<TorrentFile[] | undefined> {
  const res = await get<ListResponse>(
    `/torrents/mylist?id=${torrentId}&bypass_cache=true`,
  );
  const item = Array.isArray(res.data) ? res.data[0] : res.data;
  return item?.files;
}

export interface ResolvedFile {
  torrentId: number;
  fileId: number;
  name: string;
  size: number;
  mimetype?: string;
}

export interface FileHint {
  /** Stremio `behaviorHints.filename` — exact file name within the torrent. */
  filename?: string;
  /** Stremio `fileIdx` — the file's index in the torrent. */
  fileIdx?: number;
  /** Requested season/episode (TV) — the strongest selection signal for packs. */
  season?: number;
  episode?: number;
}

interface FileLike {
  id: number;
  name: string;
  size: number;
  mimetype?: string;
}

const VIDEO_EXT =
  /\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|m2ts|3gp|ogv)$/i;

function basename(p: string): string {
  return (p.split(/[\\/]/).pop() ?? p).trim().toLowerCase();
}

function isVideo(name: string, mimetype?: string): boolean {
  if (mimetype?.startsWith("video/")) return true;
  return VIDEO_EXT.test(name);
}

/**
 * Pick the right file out of a (possibly multi-file) torrent using a scoring
 * system. Stremio's `fileIdx` is unreliable on packs (TorBox omits/reorders
 * files), so we parse each filename and score by what actually matters:
 *   • requested season+episode, single-episode file ...... +1000
 *   • requested season+episode, multi-episode file ....... +500
 *   • episode matches, season doesn't ................... +200
 *   • exact filename match (behaviorHints.filename) ...... +100
 *   • TorBox file id == fileIdx .......................... +25
 *   • + file size as a tiebreaker (capped, never wins alone)
 * Samples and non-video files are excluded up front.
 */
export function chooseFile<T extends FileLike>(
  files: T[],
  hint: FileHint,
): T | undefined {
  if (files.length === 0) return undefined;

  let pool = files.filter(
    (f) => isVideo(f.name, f.mimetype) && !/sample/i.test(f.name),
  );
  if (pool.length === 0) pool = files;
  if (pool.length === 1) return pool[0];

  const targetName = hint.filename ? basename(hint.filename) : undefined;
  const wantS = hint.season;
  const wantE = hint.episode;

  let best: T | undefined;
  let bestScore = -Infinity;
  for (const f of pool) {
    const parsed = parseTorrentTitle(f.name);
    const seasons = parsed.seasons ?? [];
    const episodes = parsed.episodes ?? [];
    let score = 0;

    if (wantS != null && wantE != null) {
      const seasonOk = seasons.length === 0 || seasons.includes(wantS);
      const episodeOk = episodes.includes(wantE);
      if (seasonOk && episodeOk) score += episodes.length === 1 ? 1000 : 500;
      else if (episodeOk) score += 200;
    }
    if (targetName && basename(f.name) === targetName) score += 100;
    if (hint.fileIdx !== undefined && f.id === hint.fileIdx) score += 25;
    // Size tiebreaker, capped at 10 so it never outranks a real match.
    score += Math.min(f.size / (10 * 1024 ** 3), 10);

    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best;
}

/**
 * Create the torrent on TorBox (if needed), wait for its file list, and pick the
 * file to play (see {@link chooseFile}).
 */
export async function ensureTorrentFile(
  magnet: string,
  hint: FileHint,
): Promise<ResolvedFile> {
  const torrentId = await createTorrent(magnet);

  let files: TorrentFile[] | undefined;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    files = await getTorrentFiles(torrentId).catch(() => undefined);
    if (files && files.length > 0) break;
  }
  if (!files || files.length === 0) {
    throw new Error("Torrent not ready, try again");
  }

  const file = chooseFile(files, hint);
  if (!file) throw new Error("No playable file found in torrent");

  return {
    torrentId,
    fileId: file.id,
    name: file.name,
    size: file.size,
    mimetype: file.mimetype,
  };
}

// ── Desktop: direct download link ──────────────────────────────────────────────

interface RequestDlResponse {
  data: string;
}

export async function requestDirectLink(
  torrentId: number,
  fileId: number,
): Promise<string> {
  const params = new URLSearchParams({
    torrent_id: String(torrentId),
    file_id: String(fileId),
  });
  const res = await get<RequestDlResponse>(`/torrents/requestdl?${params}`);
  return res.data;
}

// ── Web: HLS stream (Pro-only) ─────────────────────────────────────────────────

interface StreamTrackMeta {
  index: number;
  codec?: string;
  language?: string;
  language_full?: string;
  title?: string;
  default?: boolean;
}
interface CreateStreamResponse {
  success: boolean;
  error?: string | null;
  detail?: string;
  data?: {
    hls_url: string;
    presigned_token: string;
    user_token: string;
    mimetype?: string;
    is_transcoding?: boolean;
    needs_transcoding?: boolean;
    metadata?: {
      audios?: StreamTrackMeta[];
      subtitles?: StreamTrackMeta[];
    };
  };
}

export interface StreamSelection {
  /** Relative audio index (0-based). Cannot be null — defaults to 0. */
  audioIndex?: number;
  /** Relative subtitle index (0-based), or null for none. */
  subtitleIndex?: number | null;
  /** TorBox resolution index (0=144p … 7=2160p), or null for original (no upscale). */
  resolutionIndex?: number | null;
}

export interface StreamResult {
  hlsUrl: string;
  presignedToken: string;
  userToken: string;
  mimetype?: string;
  needsTranscoding: boolean;
  isTranscoding: boolean;
  audios: StreamTrackMeta[];
  subtitles: StreamTrackMeta[];
}

/** Maps a resolution label to TorBox's chosen_resolution_index (null = original). */
export const RESOLUTION_INDEX: Record<string, number | null> = {
  Original: null,
  "2160p": 7,
  "4K": 7,
  "1440p": 6,
  "1080p": 5,
  "720p": 4,
  "480p": 3,
  "360p": 2,
  "240p": 1,
  "144p": 0,
};

/**
 * Create (or re-create with new selections) a web HLS stream for a torrent file.
 * Re-call with different indexes to switch audio/subtitle/resolution.
 */
export async function createStream(
  torrentId: number,
  fileId: number,
  sel: StreamSelection = {},
): Promise<StreamResult> {
  const params = new URLSearchParams({
    id: String(torrentId),
    file_id: String(fileId),
    type: "torrent",
    chosen_audio_index: String(sel.audioIndex ?? 0),
  });
  // Omit the param entirely when null/unset (don't send empty string — some
  // TorBox backends 500 when they try to parse "" as an integer).
  if (sel.subtitleIndex != null) {
    params.set("chosen_subtitle_index", String(sel.subtitleIndex));
  }
  if (sel.resolutionIndex != null) {
    params.set("chosen_resolution_index", String(sel.resolutionIndex));
  }
  console.log(
    "Requesting stream with params",
    `/stream/createstream?${params}`,
  );
  const res = await get<CreateStreamResponse>(`/stream/createstream?${params}`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? res.detail ?? "Failed to create stream");
  }
  const d = res.data;
  return {
    hlsUrl: d.hls_url,
    presignedToken: d.presigned_token,
    userToken: d.user_token,
    mimetype: d.mimetype,
    needsTranscoding: !!d.needs_transcoding,
    isTranscoding: !!d.is_transcoding,
    audios: d.metadata?.audios ?? [],
    subtitles: d.metadata?.subtitles ?? [],
  };
}

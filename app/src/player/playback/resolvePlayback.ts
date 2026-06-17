import type { Platform } from "../platform";
import {
  ensureTorrentFile,
  requestDirectLink,
  createStream,
  RESOLUTION_INDEX,
  type StreamSelection,
  type StreamResult,
} from "../torbox";
import type { ResolvedPlayback, Source, TrackInfo } from "../types";

function magnetOf(source: Source): string {
  return source.magnetLink ?? `magnet:?xt=urn:btih:${source.infoHash}`;
}

function audioTracksOf(r: StreamResult): TrackInfo[] {
  return r.audios.map((a, i) => ({
    id: String(i),
    label: a.title || a.language_full || a.language || `Audio ${i + 1}`,
    lang: a.language,
    codec: a.codec,
  }));
}

function subtitleTracksOf(r: StreamResult): TrackInfo[] {
  return r.subtitles.map((s, i) => ({
    id: String(i),
    label: s.title || s.language_full || s.language || `Subtitle ${i + 1}`,
    lang: s.language,
  }));
}

/**
 * Turn a Source into something a backend can load:
 * - desktop ⇒ TorBox direct file URL (played by mpv).
 * - web ⇒ TorBox HLS stream (played by hls.js), with track metadata.
 */
export interface EpisodeContext {
  season?: number;
  episode?: number;
}

export async function resolvePlayback(
  source: Source,
  platform: Platform,
  sel: StreamSelection = {},
  ctx: EpisodeContext = {},
): Promise<ResolvedPlayback> {
  const file = await ensureTorrentFile(magnetOf(source), {
    fileIdx: source.fileIdx,
    filename: source.filename,
    season: ctx.season,
    episode: ctx.episode,
  });

  if (platform === "web") {
    const stream = await createStream(file.torrentId, file.fileId, {
      audioIndex: sel.audioIndex ?? 0,
      subtitleIndex: sel.subtitleIndex ?? null,
      resolutionIndex: sel.resolutionIndex ?? null,
    });
    return {
      url: stream.hlsUrl,
      kind: "hls",
      mimetype: stream.mimetype,
      handle: {
        torrentId: file.torrentId,
        fileId: file.fileId,
        presignedToken: stream.presignedToken,
        userToken: stream.userToken,
      },
      audioTracks: audioTracksOf(stream),
      subtitleTracks: subtitleTracksOf(stream),
      audioIndex: sel.audioIndex ?? 0,
      subtitleIndex: sel.subtitleIndex ?? null,
      resolutionIndex: sel.resolutionIndex ?? null,
    };
  }

  // desktop (tauri) + mobile external both use a direct link.
  const url = await requestDirectLink(file.torrentId, file.fileId);
  return { url, kind: "file", mimetype: file.mimetype };
}

/**
 * Re-request a web HLS stream for the same file with new audio/subtitle/resolution
 * selections. Returns the new url + refreshed track metadata.
 */
export async function reselectWebStream(
  handle: { torrentId: number; fileId: number },
  sel: StreamSelection,
): Promise<ResolvedPlayback> {
  const stream = await createStream(handle.torrentId, handle.fileId, sel);
  return {
    url: stream.hlsUrl,
    kind: "hls",
    mimetype: stream.mimetype,
    handle: {
      torrentId: handle.torrentId,
      fileId: handle.fileId,
      presignedToken: stream.presignedToken,
      userToken: stream.userToken,
    },
    audioTracks: audioTracksOf(stream),
    subtitleTracks: subtitleTracksOf(stream),
    audioIndex: sel.audioIndex ?? 0,
    subtitleIndex: sel.subtitleIndex ?? null,
    resolutionIndex: sel.resolutionIndex ?? null,
  };
}

export { RESOLUTION_INDEX };

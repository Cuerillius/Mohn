import type { Platform } from "../platform";
import { RESOLUTION_ORDER, type Resolution, type Source } from "../types";

// Web only offers files the browser can stream via TorBox HLS. The constraint is
// the FILE size (not the torrent total) — season packs are judged on the file.
const MAX_FILE_BYTES_WEB = 5 * 1024 ** 3;

/** Best-known size of the file we'd actually play. */
export function fileSize(source: Source): number | undefined {
  return source.fileSizeBytes ?? source.torrentSizeBytes;
}

/**
 * Whether a source is offerable on this platform.
 * - desktop/mobile: always (mpv / external handle any codec).
 * - web: only when the chosen file is ≤ 5 GB. Codec/audio are irrelevant —
 *   TorBox transcodes server-side. If the file size is unknown we keep it
 *   (it becomes known after the cache check / torrent resolution).
 */
export function isPlayable(source: Source, platform: Platform): boolean {
  if (platform !== "web") return true;
  // TorBox HLS streaming only works for content already cached on their servers.
  if (!source.cached) return false;
  const size = fileSize(source);
  if (size === undefined) return true;
  return size <= MAX_FILE_BYTES_WEB;
}

const resRank = (r: Resolution) => RESOLUTION_ORDER.indexOf(r);

/**
 * Order sources for auto-selection and the picker: cached first, then by
 * resolution preference, then by seeders.
 */
export function sortSources(
  sources: Source[],
  preferred: Resolution,
): Source[] {
  const order = [preferred, ...RESOLUTION_ORDER.filter((r) => r !== preferred)];
  const rankOf = (r: Resolution) => {
    const i = order.indexOf(r);
    return i === -1 ? order.length : i;
  };
  return [...sources].sort((a, b) => {
    if (a.cached !== b.cached) return a.cached ? -1 : 1;
    const ra = rankOf(a.resolution);
    const rb = rankOf(b.resolution);
    if (ra !== rb) return ra - rb;
    return (b.seeders ?? -1) - (a.seeders ?? -1);
  });
}

export function preferredResolution(platform: Platform): Resolution {
  return platform === "tauri" ? "4K" : "1080p";
}

/**
 * Pick the best playable source, excluding any already tried. Returns null when
 * nothing is (yet) eligible.
 */
export function autoPick(
  sources: Source[],
  platform: Platform,
  tried: Set<string>,
): Source | null {
  const eligible = sources.filter(
    (s) => !tried.has(s.infoHash) && isPlayable(s, platform),
  );
  if (eligible.length === 0) return null;
  return sortSources(eligible, preferredResolution(platform))[0];
}

export function groupByResolution(
  sources: Source[],
): Record<Resolution, Source[]> {
  const groups = Object.fromEntries(
    RESOLUTION_ORDER.map((r) => [r, [] as Source[]]),
  ) as Record<Resolution, Source[]>;
  for (const s of sources) groups[s.resolution].push(s);
  for (const r of RESOLUTION_ORDER) {
    groups[r].sort((a, b) => {
      if (a.cached !== b.cached) return a.cached ? -1 : 1;
      return (b.seeders ?? -1) - (a.seeders ?? -1);
    });
  }
  return groups;
}

export { resRank };

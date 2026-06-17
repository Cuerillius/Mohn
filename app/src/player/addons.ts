import { parseTorrentTitle } from "@viren070/parse-torrent-title";
import type { Resolution, Source } from "./types";

// ── Raw Stremio addon stream shape ─────────────────────────────────────────────

interface AddonStream {
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  magnetLink?: string;
  behaviorHints?: { filename?: string; videoSize?: number };
}
interface AddonStreamResponse {
  streams?: AddonStream[];
}

/** Fetch one addon's streams for a media id. Never throws — returns [] on failure. */
async function fetchOne(
  baseUrl: string,
  type: string,
  streamId: string,
): Promise<AddonStream[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/stream/${type}/${streamId}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as AddonStreamResponse;
    return data.streams ?? [];
  } catch {
    return [];
  }
}

function extractHash(s: AddonStream): string | undefined {
  if (s.infoHash) return s.infoHash.toLowerCase();
  if (s.magnetLink) {
    const m = s.magnetLink.match(/urn:btih:([a-fA-F0-9]{40})/i);
    return m?.[1]?.toLowerCase();
  }
  return undefined;
}

function mapResolution(raw: string | undefined): Resolution {
  if (!raw) return "Unknown";
  const r = raw.toLowerCase();
  if (r === "2160p" || r === "4k" || r === "uhd") return "4K";
  if (r === "1440p" || r === "2k") return "1440p";
  if (r === "1080p" || r === "1080i") return "1080p";
  if (r === "720p" || r === "720i") return "720p";
  if (r === "480p" || r === "480i" || r === "576p") return "480p";
  if (r === "360p") return "360p";
  if (r === "240p") return "240p";
  return "Unknown";
}

function primaryText(s: AddonStream): string {
  return s.title?.trim() || s.description?.trim() || s.name?.trim() || "";
}

function parseSeeders(s: AddonStream): number | undefined {
  const text = primaryText(s);
  const m = text.match(/👤\s*(\d+)|Seeds?:?\s*(\d+)/i);
  return m ? parseInt(m[1] ?? m[2], 10) : undefined;
}

function parseSize(s: AddonStream): number | undefined {
  if (s.behaviorHints?.videoSize) return s.behaviorHints.videoSize;
  const m = primaryText(s).match(/([\d.]+)\s*(GB|MB)/i);
  if (!m) return undefined;
  const num = parseFloat(m[1]);
  return m[2].toUpperCase() === "GB" ? num * 1024 ** 3 : num * 1024 ** 2;
}

function rawNameOf(s: AddonStream): string {
  const first = primaryText(s).split("\n")[0]?.trim() ?? "";
  if (first.length > 5 && !first.startsWith("👤") && !first.startsWith("💾")) {
    return first;
  }
  return s.behaviorHints?.filename ?? "Unknown";
}

function enrich(s: AddonStream, baseUrl: string): Source | null {
  const infoHash = extractHash(s);
  if (!infoHash) return null;
  const rawName = rawNameOf(s);
  const parsed = parseTorrentTitle(rawName);
  // behaviorHints.videoSize is per-file; addon text size is usually the torrent total.
  const perFile = s.behaviorHints?.videoSize;
  const total = parseSize(s);
  return {
    infoHash,
    magnetLink: s.magnetLink,
    fileIdx: s.fileIdx,
    filename: s.behaviorHints?.filename,
    addonUrl: baseUrl,
    rawName,
    parsedTitle: parsed.title ?? rawName,
    resolution: mapResolution(parsed.resolution),
    seeders: parseSeeders(s),
    torrentSizeBytes: total,
    fileSizeBytes: perFile,
    cached: false,
  };
}

/**
 * Fetch + enrich one addon's sources. Caller aggregates across addons
 * incrementally (see useSourceFeed) — this resolves independently per addon.
 */
export async function fetchAddonSources(
  baseUrl: string,
  type: "movie" | "series",
  streamId: string,
): Promise<Source[]> {
  const raw = await fetchOne(baseUrl, type, streamId);
  const out: Source[] = [];
  for (const s of raw) {
    const enriched = enrich(s, baseUrl);
    if (enriched) out.push(enriched);
  }
  return out;
}

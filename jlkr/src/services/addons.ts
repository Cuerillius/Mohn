import { parse as parseTorrentTitle } from 'parse-torrent-title';
import type { AddonStream, AddonStreamResponse, EnrichedStream, Resolution } from '../types/torbox';

async function fetchAddonStreams(baseUrl: string, type: string, streamId: string): Promise<AddonStream[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/stream/${type}/${streamId}.json`;
  console.log('[addons] fetching', url);
  try {
    const res = await fetch(url);
    console.log('[addons] response', res.status, 'from', baseUrl);
    if (!res.ok) return [];
    const data = await res.json() as AddonStreamResponse;
    console.log('[addons] got', data.streams?.length ?? 0, 'streams from', baseUrl);
    return data.streams ?? [];
  } catch (err) {
    console.error('[addons] error fetching', baseUrl, err);
    return [];
  }
}

function extractHash(stream: AddonStream): string | undefined {
  if (stream.infoHash) return stream.infoHash.toLowerCase();
  if (stream.magnetLink) {
    const match = stream.magnetLink.match(/urn:btih:([a-fA-F0-9]{40})/i);
    return match?.[1]?.toLowerCase();
  }
  return undefined;
}

export async function fetchAllStreams(
  addonUrls: string[],
  type: string,
  streamId: string,
): Promise<AddonStream[]> {
  const results = await Promise.allSettled(
    addonUrls.map((url) => fetchAddonStreams(url, type, streamId)),
  );
  const streams = results
    .filter((r): r is PromiseFulfilledResult<AddonStream[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  console.log('[addons] total raw streams before dedup:', streams.length);
  const seen = new Set<string>();
  const deduped: AddonStream[] = [];
  for (const s of streams) {
    const hash = extractHash(s);
    if (!hash) continue;
    if (seen.has(hash)) continue;
    seen.add(hash);
    deduped.push({ ...s, infoHash: hash });
  }
  console.log('[addons] deduped streams:', deduped.length);
  return deduped;
}

function mapResolution(raw: string | undefined): Resolution {
  if (!raw) return 'Unknown';
  const r = raw.toLowerCase();
  if (r === '2160p' || r === '4k' || r === 'uhd') return '4K';
  if (r === '1080p' || r === '1080i') return '1080p';
  if (r === '720p') return '720p';
  if (r === '480p' || r === '576p' || r === '480i') return 'SD';
  return 'Unknown';
}

function parseSeeders(titleField: string | undefined): number | undefined {
  if (!titleField) return undefined;
  const match = titleField.match(/👤\s*(\d+)|Seeds?:?\s*(\d+)/i);
  if (!match) return undefined;
  return parseInt(match[1] ?? match[2], 10);
}

function parseSize(stream: AddonStream): number | undefined {
  if (stream.behaviorHints?.videoSize) return stream.behaviorHints.videoSize;
  const t = stream.title;
  if (!t) return undefined;
  const match = t.match(/([\d.]+)\s*(GB|MB)/i);
  if (!match) return undefined;
  const num = parseFloat(match[1]);
  return match[2].toUpperCase() === 'GB' ? num * 1024 * 1024 * 1024 : num * 1024 * 1024;
}

export function enrichStream(stream: AddonStream): EnrichedStream {
  const parsed = parseTorrentTitle(stream.name ?? '');
  return {
    ...stream,
    parsedTitle: (parsed as { title?: string }).title ?? stream.name ?? 'Unknown',
    resolution: mapResolution((parsed as { resolution?: string }).resolution),
    sizeBytes: parseSize(stream),
    seeders: parseSeeders(stream.title),
    cached: false,
  };
}

const RESOLUTION_ORDER: Resolution[] = ['4K', '1080p', '720p', 'SD', 'Unknown'];

export function groupByResolution(streams: EnrichedStream[]): Record<Resolution, EnrichedStream[]> {
  const groups = Object.fromEntries(RESOLUTION_ORDER.map((r) => [r, [] as EnrichedStream[]])) as Record<Resolution, EnrichedStream[]>;
  for (const s of streams) {
    groups[s.resolution].push(s);
  }
  for (const r of RESOLUTION_ORDER) {
    groups[r].sort((a, b) => {
      if (a.cached !== b.cached) return a.cached ? -1 : 1;
      const sa = a.seeders ?? -1;
      const sb = b.seeders ?? -1;
      return sb - sa;
    });
  }
  return groups;
}

export function autoSelectStream(streams: EnrichedStream[]): EnrichedStream | null {
  for (const r of RESOLUTION_ORDER) {
    const group = streams.filter((s) => s.resolution === r);
    const cached = group.find((s) => s.cached);
    if (cached) return cached;
  }
  for (const r of RESOLUTION_ORDER) {
    const group = streams.filter((s) => s.resolution === r);
    if (group.length > 0) return group[0];
  }
  return null;
}

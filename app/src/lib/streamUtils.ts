import type { EnrichedStream } from "@/types/torbox";

export type Platform = "tauri" | "web" | "mobileweb";

// Video codec detected from release name
export type VideoCodec = "h264" | "h265" | "av1" | "vp9" | "unknown";

// Why a stream isn't browser-playable
export type BlockReason = "codec_unsupported" | "too_large" | null;

export type ProcessedStream = {
  stream: EnrichedStream;
  codec: VideoCodec;
  blockReason: BlockReason;
  available: boolean;
  sizeGB: number;
  explain: string | null;
};

function detectCodec(name: string): VideoCodec {
  const n = name.toLowerCase();
  // Order matters: check HEVC before H.264 since "x265" can appear alongside "264"
  if (/hevc|h\.?265|x265/.test(n)) return "h265";
  if (/\bav1\b/.test(n)) return "av1";
  if (/\bvp9\b/.test(n)) return "vp9";
  if (/avc|h\.?264|x264/.test(n)) return "h264";
  return "unknown";
}

// H.265/HEVC is not supported in most browsers (Chrome requires OS/HW support, Firefox never)
// Everything else (H.264, AV1, VP9, unknown) is treated as browser-playable
function isCodecBrowserPlayable(codec: VideoCodec): boolean {
  return codec !== "h265";
}

// Size limits for progressive browser streaming
const MAX_GB_WEB = 20;
const MAX_GB_MOBILEWEB = 8;

export function processStream(stream: EnrichedStream, platform: Platform): ProcessedStream {
  const name = `${stream.rawName ?? ""} ${stream.parsedTitle ?? ""}`;
  const codec = detectCodec(name);
  const sizeGB = stream.sizeBytes ? stream.sizeBytes / 1024 ** 3 : 0;

  let blockReason: BlockReason = null;

  if (platform !== "tauri") {
    if (!isCodecBrowserPlayable(codec)) {
      blockReason = "codec_unsupported";
    } else {
      const maxGB = platform === "mobileweb" ? MAX_GB_MOBILEWEB : MAX_GB_WEB;
      if (sizeGB > 0 && sizeGB > maxGB) blockReason = "too_large";
    }
  }

  const available = blockReason === null;

  let explain: string | null = null;
  if (blockReason === "codec_unsupported") {
    explain = "H.265/HEVC can't play in the browser. Use the desktop app or an external player.";
  } else if (blockReason === "too_large") {
    explain =
      platform === "mobileweb"
        ? `At ${sizeGB.toFixed(1)} GB this file is too large for mobile streaming.`
        : `At ${sizeGB.toFixed(1)} GB this file exceeds the browser streaming limit.`;
  }

  return { stream, codec, blockReason, available, sizeGB, explain };
}

export function formatSize(gb: number): string {
  if (!gb) return "";
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
  return `${gb.toFixed(2)} GB`;
}

export function addonHostname(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Sort: playable cached → playable uncached → not playable
export function sortStreams(processed: ProcessedStream[]): ProcessedStream[] {
  return [...processed].sort((a, b) => {
    const scoreA = a.available ? (a.stream.cached ? 0 : 1) : 2;
    const scoreB = b.available ? (b.stream.cached ? 0 : 1) : 2;
    return scoreA - scoreB;
  });
}

import type { EnrichedStream } from "@/types/torbox";

export type Platform = "tauri" | "web" | "mobileweb";

// Video codec mapped from parse-torrent-title's codec field
export type VideoCodec = "h264" | "h265" | "av1" | "vp9" | "unknown";

// Why a stream isn't browser-playable
export type BlockReason =
  | "codec_unsupported"
  | "audio_unsupported"
  | "format_unknown"
  | "too_large"
  | null;

export type ProcessedStream = {
  stream: EnrichedStream;
  codec: VideoCodec;
  blockReason: BlockReason;
  available: boolean;
  sizeGB: number;
  explain: string | null;
  // Non-null when the stream is available but audio format couldn't be determined
  audioWarning: string | null;
};

function mapCodec(parsed: string | undefined): VideoCodec {
  if (!parsed) return "unknown";
  const c = parsed.toLowerCase();
  if (/hevc|h\.?265|x265/.test(c)) return "h265";
  if (/\bav1\b/.test(c)) return "av1";
  if (/\bvp9\b/.test(c)) return "vp9";
  if (/avc|h\.?264|x264/.test(c)) return "h264";
  return "unknown";
}

// Browsers can't decode AC3 / DTS / TrueHD natively.
// AAC, MP3, Opus, Vorbis, FLAC are safe.
function isAudioKnownUnsafe(audio: string): boolean {
  const a = audio.toLowerCase();
  if (/\bac3\b|dolby.digital|\bdd\b|\beac3\b|dd\+/.test(a)) return true;
  if (/\bdts\b/.test(a)) return true;
  if (/truehd|atmos/.test(a)) return true;
  return false;
}

function isAudioKnownSafe(audio: string): boolean {
  const a = audio.toLowerCase();
  return /\baac\b|\bmp3\b|\bopus\b|\bvorbis\b|\bflac\b/.test(a);
}

// WEB-DL / WEBRip sources almost always carry AAC audio.
// BluRay / REMUX / BDRip without an explicit safe audio tag almost always carry AC3 or DTS.
function inferAudioSafetyFromQuality(
  quality: string | undefined,
): "safe" | "unsafe" | "unknown" {
  if (!quality) return "unknown";
  const q = quality.toLowerCase();
  if (/web.?dl|webrip|web.?rip/.test(q)) return "safe";
  if (/blu.?ray|bdremux|bd.?rip|remux|bdrip/.test(q)) return "unsafe";
  return "unknown";
}

// Size limits for progressive browser streaming
const MAX_GB_WEB = 20;
const MAX_GB_MOBILEWEB = 8;

export function processStream(
  stream: EnrichedStream,
  platform: Platform,
): ProcessedStream {
  const codec = mapCodec(stream.parsedCodec);
  const sizeGB = stream.sizeBytes ? stream.sizeBytes / 1024 ** 3 : 0;

  // Determine audio safety: explicit tag > quality-based inference > unknown
  const audio = stream.parsedAudio;
  let audioSafe: boolean | null = null; // null = truly unknown
  if (audio) {
    if (isAudioKnownUnsafe(audio)) audioSafe = false;
    else if (isAudioKnownSafe(audio)) audioSafe = true;
    // else: parsed but unrecognised tag — treat as unknown
  }
  if (audioSafe === null) {
    const inferred = inferAudioSafetyFromQuality(stream.parsedQuality);
    if (inferred === "safe") audioSafe = true;
    else if (inferred === "unsafe") audioSafe = false;
    // else: still unknown — audioSafe stays null
  }

  let blockReason: BlockReason = null;

  if (platform !== "tauri") {
    if (codec === "h265") {
      blockReason = "codec_unsupported";
    } else if (codec === "unknown") {
      blockReason = "format_unknown";
    } else if (audioSafe === false) {
      blockReason = "audio_unsupported";
    } else {
      const maxGB = platform === "mobileweb" ? MAX_GB_MOBILEWEB : MAX_GB_WEB;
      if (sizeGB > 0 && sizeGB > maxGB) blockReason = "too_large";
    }
  }

  const available = blockReason === null;

  let explain: string | null = null;
  if (blockReason === "codec_unsupported") {
    explain =
      "H.265/HEVC can't play in the browser. Use the desktop app or an external player.";
  } else if (blockReason === "audio_unsupported") {
    const fmt = audio ?? "This audio format";
    explain = `${fmt} audio can't play in the browser. Use the desktop app or an external player.`;
  } else if (blockReason === "format_unknown") {
    explain =
      "Video codec unknown — can't confirm browser playback. Use the desktop app.";
  } else if (blockReason === "too_large") {
    explain =
      platform === "mobileweb"
        ? `At ${sizeGB.toFixed(1)} GB this file is too large for mobile streaming.`
        : `At ${sizeGB.toFixed(1)} GB this file exceeds the browser streaming limit.`;
  }

  // Warn when audio couldn't be determined at all (not inferred from quality either)
  const audioWarning = available && audioSafe === null ? "Audio unknown" : null;

  return {
    stream,
    codec,
    blockReason,
    available,
    sizeGB,
    explain,
    audioWarning,
  };
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

import { useState, useMemo } from "react";
import {
  X,
  Play,
  Clock,
  Search,
  ExternalLink,
  CircleOff,
  Dot,
  TriangleAlert,
  AppWindow,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EnrichedStream, Resolution } from "@/types/torbox";
import { Card } from "./ui/card";

// ── Types ──────────────────────────────────────────────────────────────────

export type Plan = "free" | "essential" | "standard" | "pro";
export type Platform = "tauri" | "web" | "mobileweb";
type StreamTag = "hdr" | "surround";
type BlockReason = "needs_hdr" | "needs_surround" | "too_large" | null;
type StatusTab =
  | "All"
  | "Ready to play"
  | "Uncached"
  | "External only"
  | "Unknown";

type Capabilities = {
  canPlayHDR: boolean;
  canPlaySurround: boolean;
  maxStreamGB: number;
  hasNativePlayer: boolean;
};

function getCapabilities(platform: Platform, plan: Plan): Capabilities {
  const isPro = plan === "pro";
  const isTauri = platform === "tauri";
  return {
    canPlayHDR: isTauri ? true : isPro,
    canPlaySurround: isTauri ? true : isPro,
    maxStreamGB: isTauri ? Infinity : platform === "mobileweb" ? 8 : 20,
    hasNativePlayer: isTauri,
  };
}

export function planFromNumber(n: number): Plan {
  if (n >= 3) return "standard";
  if (n >= 2) return "pro";
  if (n >= 1) return "essential";
  return "free";
}

// ── Parsing helpers ────────────────────────────────────────────────────────

function parseCodec(name: string): string | null {
  const n = name.toLowerCase();
  if (/\bav1\b/.test(n)) return "AV1";
  if (/hevc|h\.?265|x265/.test(n)) return "H.265";
  if (/avc|h\.?264|x264/.test(n)) return "H.264";
  if (/\bvp9\b/.test(n)) return "VP9";
  return null;
}

function parseSource(name: string): string | null {
  const n = name.toLowerCase();
  if (/\bremux\b/.test(n)) return "Remux";
  if (/blu.?ray|bluray/.test(n)) return "BluRay";
  if (/web.?dl|webdl/.test(n)) return "WEB-DL";
  if (/web.?rip|webrip/.test(n)) return "WEBRip";
  if (/\bhdtv\b/.test(n)) return "HDTV";
  if (/\bdvd\b/.test(n)) return "DVD";
  return null;
}

function streamLabel(stream: EnrichedStream): string {
  const name = `${stream.rawName ?? ""} ${stream.parsedTitle ?? ""}`;
  const codec = parseCodec(name);
  const source = parseSource(name);
  const parts = [codec, source].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  return stream.parsedTitle || stream.rawName || "Unknown source";
}

// ── Stream processing ──────────────────────────────────────────────────────

function detectTags(stream: EnrichedStream): StreamTag[] {
  const name =
    `${stream.rawName ?? ""} ${stream.parsedTitle ?? ""}`.toLowerCase();
  const tags: StreamTag[] = [];
  if (/hdr|hdr10|dolby.?vision|\bdv\b/.test(name)) tags.push("hdr");
  if (/atmos|truehd|dts.?hd|dts.?x|7\.1/.test(name)) tags.push("surround");
  return tags;
}

type ProcessedStream = {
  stream: EnrichedStream;
  tags: StreamTag[];
  blockReason: BlockReason;
  available: boolean;
  sizeGB: number;
  explain: string | null;
  actions: ("upgrade" | "desktop" | "external" | "play")[];
};

function processStream(
  stream: EnrichedStream,
  caps: Capabilities,
  platform: Platform,
): ProcessedStream {
  const tags = detectTags(stream);
  const sizeGB = stream.sizeBytes ? stream.sizeBytes / 1024 ** 3 : 0;

  let blockReason: BlockReason = null;
  if (tags.includes("hdr") && !caps.canPlayHDR) blockReason = "needs_hdr";
  else if (tags.includes("surround") && !caps.canPlaySurround)
    blockReason = "needs_surround";
  else if (sizeGB > 0 && sizeGB > caps.maxStreamGB) blockReason = "too_large";

  const available = blockReason === null;

  let explain: string | null = null;
  const actions: ("upgrade" | "desktop" | "external" | "play")[] = [];

  if (blockReason === "needs_hdr") {
    explain =
      "This version includes HDR video that requires TorBox Pro to transcode. Play it using an external player instead.";
    actions.push("upgrade");
    if (caps.hasNativePlayer) actions.push("desktop");
    actions.push("external");
  } else if (blockReason === "needs_surround") {
    explain =
      "This version has surround-sound audio that requires transcoding. Upgrade or use an external player.";
    actions.push("upgrade");
    if (caps.hasNativePlayer) actions.push("desktop");
    actions.push("external");
  } else if (blockReason === "too_large") {
    explain =
      platform === "mobileweb"
        ? `At ${sizeGB.toFixed(1)} GB this file is too large for mobile streaming. Open it in an external player.`
        : `At ${sizeGB.toFixed(1)} GB this file exceeds the browser limit. Use the desktop app or an external player.`;
    actions.push("external");
    if (caps.hasNativePlayer) actions.push("desktop");
  } else if (stream.cached === false) {
    explain =
      "This version isn't cached yet — it may take time to buffer or could be broken.";
    actions.push("play", "external");
  } else {
    actions.push("play");
  }

  return { stream, tags, blockReason, available, sizeGB, explain, actions };
}

// ── Component ──────────────────────────────────────────────────────────────

const STATUS_TABS: StatusTab[] = [
  "All",
  "Ready to play",
  "Uncached",
  "External only",
  "Unknown",
];

const RES_ORDER: Record<string, number> = {
  "4K": 1,
  "2160p": 1,
  "1440p": 2,
  "1080p": 3,
  "720p": 4,
  "480p": 5,
  "360p": 6,
  Unknown: 99,
};

export interface StreamPickerProps {
  title?: string;
  streams: EnrichedStream[];
  selected: EnrichedStream | null;
  switching: boolean;
  switchError: string;
  platform: Platform;
  plan: Plan;
  onSelectStream: (s: EnrichedStream) => void;
  onOpenExternal?: (s: EnrichedStream) => void;
  onClose: () => void;
  isOverlay?: boolean;
}

export default function StreamPicker({
  title = "Select Version",
  streams,
  platform,
  plan,
  onSelectStream,
  onOpenExternal,
  onClose,
  isOverlay = false,
}: StreamPickerProps) {
  // We only need resolution state for this simplified UI
  const [activeRes, setActiveRes] = useState<string>("All");

  // 1. Process capabilities and streams just like before
  const caps = useMemo(() => getCapabilities(platform, plan), [platform, plan]);

  const processed = useMemo(
    () => streams.map((s) => processStream(s, caps, platform)),
    [streams, caps, platform],
  );

  // 2. Extract and sort resolutions based on your RES_ORDER
  const availableResolutions = useMemo(() => {
    const resSet = new Set<string>();
    processed.forEach((p) => resSet.add(p.stream.resolution || "Unknown"));

    const sorted = Array.from(resSet).sort((a, b) => {
      const orderA = RES_ORDER[a] ?? 50;
      const orderB = RES_ORDER[b] ?? 50;
      return orderA - orderB;
    });

    return ["All", ...sorted];
  }, [processed]);

  // 3. Filter by Resolution only
  const filteredProcessed = useMemo(() => {
    if (activeRes === "All") return processed;

    return processed.filter(
      (s) => (s.stream.resolution || "Unknown") === activeRes,
    );
  }, [activeRes, processed]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-background",
        isOverlay ? "absolute inset-0 z-50" : "w-full h-full",
      )}
    >
      {/* Full-width header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6 shrink-0">
        <div>
          <h2 className="text-[15px] font-semibold text-white">{title}</h2>
          <p className="text-[11px] mt-0.5 text-muted-foreground">
            Pick a version to watch
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-[#242424] text-muted-foreground hover:text-white transition-colors duration-120"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Resolution chips */}
      <div className="flex gap-2 px-8 mb-6 shrink-0 flex-wrap">
        {availableResolutions.map((res) => (
          <button
            key={res}
            onClick={() => setActiveRes(res)}
            className={`flex items-center shrink-0 px-3 py-1.5 rounded-md border transition-all text-sm ${
              activeRes === res
                ? "border-white/30 bg-white/10 text-white shadow-sm"
                : "border-white/10 bg-transparent text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {res}
          </button>
        ))}
      </div>

      {/* Stream list */}
      <div className="min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-2 px-8 pb-8">
          {filteredProcessed.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Search className="h-8 w-8 mb-3 text-muted-foreground opacity-20" />
              <p className="text-[12px] text-muted-foreground">
                No versions match this filter
              </p>
              <button
                onClick={() => setActiveRes("All")}
                className="mt-2 text-[11px] underline text-muted-foreground hover:text-white transition-colors duration-120"
              >
                Clear filter
              </button>
            </div>
          ) : (
            filteredProcessed.map((item) => (
              <StreamItem
                key={item.stream.infoHash || Math.random().toString()}
                item={{
                  title: item.stream.rawName || item.stream.parsedTitle || "Unknown source",
                  size: item.sizeGB,
                  resolution: item.stream.resolution,
                  addonName: addonId(item.stream.addonUrl),
                }}
                isPlayable={item.actions.includes("play")}
                isCached={item.stream.cached === true}
                isMobileWeb={platform === "mobileweb"}
                onPlay={() => onSelectStream(item.stream)}
                onExternal={() => onOpenExternal?.(item.stream)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── StreamItem ─────────────────────────────────────────────────────────────

function formatSize(gb: number): string {
  if (!gb) return "Unknown size";
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
  return `${gb.toFixed(2)} GB`;
}

function addonId(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/\..*$/, "");
  } catch {
    return null;
  }
}

function StreamItem({
  item,
  isPlayable,
  isCached,
  isMobileWeb,
  onPlay,
  onExternal,
}: {
  item: {
    title: string;
    size: number;
    resolution: Resolution;
    addonName?: string | null;
  };
  isPlayable: boolean;
  isCached: boolean;
  isMobileWeb: boolean;
  onPlay?: () => void;
  onExternal?: () => void;
}) {
  if (isPlayable) {
    return (
      <Card
        className="flex flex-col px-3 py-2.5 transition-all border-dashed shadow-none cursor-pointer"
        onClick={onPlay}
      >
        <div className="flex items-center gap-3 transition-opacity">
          {isCached ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-500/20 text-green-500">
              <Play className="h-4 w-4" fill="currentColor" />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium leading-none">
                {item.title}
              </span>
            </div>

            <div className="flex items-center text-xs font-medium text-muted-foreground flex-nowrap whitespace-nowrap">
              <span>{item.resolution ?? "Unknown"}</span>
              <Dot className="h-4 w-4 shrink-0" />
              <span>{formatSize(item.size)}</span>
              {item.addonName && (
                <>
                  <Dot className="h-4 w-4 shrink-0" />
                  <span>{item.addonName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.();
              }}
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" />
              <span className="hidden sm:inline">Play</span>
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col px-3 py-2.5 transition-all bg-muted/30 border-dashed shadow-none border-muted-foreground/20 hover:border-muted-foreground/40">
      <div className="flex items-center gap-3 transition-opacity">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-muted-foreground/50">
          <CircleOff className="h-4 w-4" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 cursor-pointer opacity-70">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-medium leading-none">
              {item.title}
            </span>
          </div>

          <div className="flex items-center text-xs font-medium text-muted-foreground">
            <span>{item.resolution ?? "Unknown"}</span>
            <Dot className="h-4 w-4" />
            <span>{formatSize(item.size)}</span>
            {item.addonName && (
              <>
                <Dot className="h-4 w-4" />
                <span>{item.addonName}</span>
              </>
            )}
            <Dot className="h-4 w-4 shrink-0" />
            <div className="flex items-center gap-1 shrink-0">
              <TriangleAlert className="h-3 w-3" />
              <span>Unsupported</span>
            </div>
          </div>
        </div>

        {isMobileWeb ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={onExternal}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">External</span>
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="link"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={() =>
                window.open("https://torbox.app/download", "_blank")
              }
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download App</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={onExternal}
            >
              <AppWindow className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open App</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

import { useState, useMemo } from "react";
import {
  X,
  Play,
  Clock,
  Search,
  ChevronDown,
  Monitor,
  ArrowUpRight,
  ExternalLink,
  CircleOff,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EnrichedStream } from "@/types/torbox";

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

function statusTabFor(item: ProcessedStream): Exclude<StatusTab, "All"> {
  if (!item.available) return "External only";
  if (item.stream.cached === undefined || item.stream.cached === null)
    return "Unknown";
  if (item.stream.cached === false) return "Uncached";
  return "Ready to play";
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
  selected,
  switching,
  switchError,
  platform,
  plan,
  onSelectStream,
  onOpenExternal,
  onClose,
  isOverlay = false,
}: StreamPickerProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("All");
  const [activeRes, setActiveRes] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  const caps = useMemo(() => getCapabilities(platform, plan), [platform, plan]);

  const processed = useMemo(
    () => streams.map((s) => processStream(s, caps, platform)),
    [streams, caps, platform],
  );

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

  const tabCounts = useMemo(() => {
    const c: Record<StatusTab, number> = {
      All: processed.length,
      "Ready to play": 0,
      Uncached: 0,
      "External only": 0,
      Unknown: 0,
    };
    for (const item of processed) c[statusTabFor(item)]++;
    return c;
  }, [processed]);

  const filteredProcessed = useMemo(() => {
    let list = processed;

    // 1. Filter by Status Tab
    if (activeTab !== "All") {
      list = list.filter((s) => statusTabFor(s) === activeTab);
    }

    // 2. Filter by Resolution
    if (activeRes !== "All") {
      list = list.filter(
        (s) => (s.stream.resolution || "Unknown") === activeRes,
      );
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const stream = item.stream;
        const label = streamLabel(stream).toLowerCase();
        const res = (stream.resolution || "").toLowerCase();
        const tags = item.tags.join(" ").toLowerCase();
        return (
          label.includes(q) ||
          res.includes(q) ||
          tags.includes(q) ||
          item.sizeGB.toString().includes(q)
        );
      });
    }

    return list;
  }, [activeTab, activeRes, processed, searchQuery]);

  return (
    <div
      className={cn(
        "flex items-center justify-center font-sans text-foreground overflow-hidden",
        isOverlay
          ? "absolute inset-0 z-50 bg-muted/80 backdrop-blur-sm p-2 sm:p-4 md:p-8"
          : "w-full h-full bg-muted/20 p-2 sm:p-4 md:p-8",
      )}
    >
      <div className="flex flex-col w-full max-w-[850px] h-full max-h-[100dvh] sm:max-h-full bg-background border rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 flex justify-between items-start border-b shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pick a version to watch
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Toolbar (Search, Status Tabs, and Resolution Filters) */}
        <div className="flex flex-col gap-4 p-4 border-b bg-muted/10 shrink-0">
          {/* Top row: Search & Status Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by resolution, codec, size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {STATUS_TABS.map((tab) => {
                const count = tabCounts[tab];
                if (tab !== "All" && count === 0) return null;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setExpandedHash(null);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    {tab}
                    <span
                      className={cn(
                        "text-[10px] font-semibold tabular-nums",
                        isActive ? "opacity-60" : "opacity-40",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom row: Resolution filters */}
          {availableResolutions.length > 2 && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                Resolution
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {availableResolutions.map((res) => (
                  <button
                    key={res}
                    onClick={() => {
                      setActiveRes(res);
                      setExpandedHash(null);
                    }}
                    className={cn(
                      "h-6 px-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap",
                      activeRes === res
                        ? "bg-foreground text-background"
                        : "bg-transparent text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stream list (No scrollbar visible) */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-4 sm:p-5 flex flex-col gap-2">
            {switchError && (
              <p className="text-xs text-destructive mb-2 px-1">
                {switchError}
              </p>
            )}

            {filteredProcessed.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Search className="h-10 w-10 mb-4 opacity-20" />
                <p className="text-sm font-medium">
                  No versions match your filters
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setActiveTab("All");
                    setActiveRes("All");
                    setSearchQuery("");
                  }}
                  className="mt-2 text-xs"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              filteredProcessed.map((item) => (
                <StreamItem
                  key={item.stream.infoHash ?? item.stream.rawName}
                  item={item}
                  isSelected={selected?.infoHash === item.stream.infoHash}
                  switching={switching}
                  isExpanded={
                    expandedHash ===
                    (item.stream.infoHash ?? item.stream.rawName)
                  }
                  caps={caps}
                  plan={plan}
                  onToggle={() => {
                    const key = item.stream.infoHash ?? item.stream.rawName;
                    setExpandedHash(expandedHash === key ? null : key);
                  }}
                  onSelect={() => onSelectStream(item.stream)}
                  onOpenExternal={
                    onOpenExternal
                      ? () => onOpenExternal(item.stream)
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="py-3 px-4 flex justify-between items-center text-xs text-muted-foreground/60 bg-muted/10 border-t shrink-0">
          <p>
            Showing {filteredProcessed.length} of {processed.length} versions
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500/50" /> Native
            <span className="w-2 h-2 rounded-full bg-amber-500/50 ml-2" /> Not
            Cached
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 ml-2" />{" "}
            External
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StreamItem ─────────────────────────────────────────────────────────────

function StreamItem({
  item,
  isSelected,
  switching,
  isExpanded,
  caps,
  plan,
  onToggle,
  onSelect,
  onOpenExternal,
}: {
  item: ProcessedStream;
  isSelected: boolean;
  switching: boolean;
  isExpanded: boolean;
  caps: Capabilities;
  plan: Plan;
  onToggle: () => void;
  onSelect: () => void;
  onOpenExternal?: () => void;
}) {
  const { stream, available, explain, actions, sizeGB, tags, blockReason } =
    item;
  const isCached = stream.cached;
  const isUnknown = isCached === undefined || isCached === null;
  const isBlocked = !available;
  const isExpandable = !!explain;

  const StatusIcon = isUnknown
    ? HelpCircle
    : isBlocked
      ? CircleOff
      : !isCached
        ? Clock
        : Play;

  const iconBg = isUnknown
    ? "bg-slate-500/10 text-slate-500"
    : isBlocked
      ? "bg-muted text-muted-foreground"
      : !isCached
        ? "bg-amber-500/10 text-amber-500"
        : isSelected
          ? "bg-primary/10 text-primary"
          : "bg-emerald-500/10 text-emerald-500";

  const label = streamLabel(stream);
  const sizeLabel = sizeGB > 0 ? `${sizeGB.toFixed(1)} GB` : null;

  let subText: string;
  let subColor: string;

  if (blockReason === "too_large") {
    subText = `External player required (Too large) · ${sizeLabel ?? "?"}`;
    subColor = "text-muted-foreground";
  } else if (blockReason === "needs_hdr" || blockReason === "needs_surround") {
    subText = `External player required (Needs Pro) · ${sizeLabel ?? "?"}`;
    subColor = "text-muted-foreground";
  } else if (isUnknown) {
    subText = `Status unknown · ${sizeLabel ?? "?"}`;
    subColor = "text-muted-foreground";
  } else if (!isCached) {
    subText = `Not cached · ${sizeLabel ?? "?"}`;
    subColor = "text-amber-500/90";
  } else {
    subText = sizeLabel ?? "";
    subColor = "text-muted-foreground";
  }

  return (
    <div className="group">
      <div
        onClick={() => (isExpandable ? onToggle() : undefined)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 border rounded-lg transition-all",
          isExpanded
            ? "rounded-b-none border-b-transparent bg-muted/40 shadow-sm"
            : cn(
                "bg-card shadow-sm hover:shadow-md",
                isSelected
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/50 hover:border-border",
                isBlocked && "opacity-75 bg-muted/30",
              ),
          isExpandable && "cursor-pointer",
        )}
      >
        {/* Status icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            iconBg,
          )}
        >
          <StatusIcon
            className={cn(
              "h-4 w-4",
              isCached && available && !isUnknown && "fill-current",
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-background text-muted-foreground shadow-sm">
              {stream.resolution || "Unknown"}
            </span>
            {tags.includes("hdr") && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-700 dark:text-yellow-500">
                HDR
              </span>
            )}
            {tags.includes("surround") && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-500">
                Atmos
              </span>
            )}
            <span
              className={cn(
                "text-sm font-medium truncate",
                isBlocked && "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
          {subText && (
            <p className={cn("text-[11px] mt-1 font-medium", subColor)}>
              {subText}
            </p>
          )}
        </div>

        {/* Actions Container */}
        <div className="shrink-0 flex items-center gap-1.5">
          {!isExpandable ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (isBlocked && onOpenExternal) {
                  onOpenExternal();
                } else {
                  onSelect();
                }
              }}
              disabled={switching}
              className={cn(
                "h-8 gap-1.5 px-3 text-xs font-semibold",
                isBlocked
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "",
              )}
            >
              {switching && isSelected ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isBlocked ? (
                <>
                  <ExternalLink className="h-3.5 w-3.5" /> External
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Play
                </>
              )}
            </Button>
          ) : (
            <button
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground transition-transform mx-1 hover:bg-muted",
                isExpanded && "rotate-180",
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && explain && (
        <div className="px-4 py-3 bg-muted/40 border border-t-0 rounded-b-lg space-y-3 animate-in slide-in-from-top-1 duration-150">
          <p className="text-xs leading-relaxed text-muted-foreground font-medium">
            {explain}
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Play action (for uncached or bypassing) */}
            {actions.includes("play") && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                  onToggle();
                }}
                disabled={switching}
                className="h-8 text-xs font-semibold"
              >
                {switching && isSelected ? (
                  <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                )}
                {isCached ? "Play in browser" : "Watch anyway"}
              </Button>
            )}

            {/* External player */}
            {actions.includes("external") && onOpenExternal && (
              <Button
                size="sm"
                variant={actions.includes("play") ? "outline" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExternal();
                }}
                disabled={switching}
                className={cn(
                  "h-8 text-xs font-semibold",
                  !actions.includes("play") && "bg-foreground text-background",
                )}
              >
                {switching && !actions.includes("play") ? (
                  <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                )}
                Open in external player
              </Button>
            )}

            {/* Desktop app shortcut */}
            {actions.includes("desktop") && !caps.hasNativePlayer && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-semibold bg-background"
              >
                <Monitor className="mr-1.5 h-3.5 w-3.5" />
                Open in desktop app
              </Button>
            )}

            {/* Upgrade to Pro */}
            {actions.includes("upgrade") && plan !== "pro" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-semibold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:hover:bg-blue-900/50"
              >
                <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
                Upgrade to Pro to unlock browser play
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

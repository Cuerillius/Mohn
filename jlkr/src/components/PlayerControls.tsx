import { useRef, useState, useEffect, useMemo } from "react";
import {
  AudioLines,
  Captions,
  CaptionsOff,
  Film,
  Hd,
  Loader,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeOff,
  X,
  AppWindow,
  Download,
  ArrowLeft,
  Clock,
  Info,
  ExternalLink,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { groupByResolution } from "../services/addons";
import { createTorrent, pollTorrentProgress } from "../services/torbox";
import type { EnrichedStream, Resolution, TorBoxTorrentItem } from "../types/torbox";
import {
  processStream,
  sortStreams,
  formatSize,
  addonHostname as addonHostnameUtil,
  type Platform,
  type ProcessedStream,
} from "@/lib/streamUtils";

export interface MpvTrack {
  id: number;
  type: "video" | "audio" | "sub";
  title?: string;
  lang?: string;
  codec?: string;
  selected?: boolean;
}

export type Section = "Subtitles" | "Audio" | "Quality" | "Source";
export const SECTIONS: Section[] = ["Subtitles", "Audio", "Quality", "Source"];

interface LangInfo {
  flag?: string;
  name: string;
}
const LANG_INFO: Record<string, LangInfo> = {
  eng: { flag: "gb", name: "English" },
  en: { flag: "gb", name: "English" },
  spa: { flag: "es", name: "Spanish" },
  es: { flag: "es", name: "Spanish" },
  fra: { flag: "fr", name: "French" },
  fre: { flag: "fr", name: "French" },
  fr: { flag: "fr", name: "French" },
  deu: { flag: "de", name: "German" },
  ger: { flag: "de", name: "German" },
  de: { flag: "de", name: "German" },
  jpn: { flag: "jp", name: "Japanese" },
  ja: { flag: "jp", name: "Japanese" },
  por: { flag: "pt", name: "Portuguese" },
  pt: { flag: "pt", name: "Portuguese" },
  ita: { flag: "it", name: "Italian" },
  it: { flag: "it", name: "Italian" },
  rus: { flag: "ru", name: "Russian" },
  ru: { flag: "ru", name: "Russian" },
  zho: { flag: "cn", name: "Chinese" },
  chi: { flag: "cn", name: "Chinese" },
  zh: { flag: "cn", name: "Chinese" },
  kor: { flag: "kr", name: "Korean" },
  ko: { flag: "kr", name: "Korean" },
  ara: { flag: "sa", name: "Arabic" },
  ar: { flag: "sa", name: "Arabic" },
  nld: { flag: "nl", name: "Dutch" },
  dut: { flag: "nl", name: "Dutch" },
  nl: { flag: "nl", name: "Dutch" },
  pol: { flag: "pl", name: "Polish" },
  pl: { flag: "pl", name: "Polish" },
  tur: { flag: "tr", name: "Turkish" },
  tr: { flag: "tr", name: "Turkish" },
  swe: { flag: "se", name: "Swedish" },
  sv: { flag: "se", name: "Swedish" },
  nor: { flag: "no", name: "Norwegian" },
  no: { flag: "no", name: "Norwegian" },
  fin: { flag: "fi", name: "Finnish" },
  fi: { flag: "fi", name: "Finnish" },
  dan: { flag: "dk", name: "Danish" },
  da: { flag: "dk", name: "Danish" },
  ces: { flag: "cz", name: "Czech" },
  cze: { flag: "cz", name: "Czech" },
  cs: { flag: "cz", name: "Czech" },
  hun: { flag: "hu", name: "Hungarian" },
  hu: { flag: "hu", name: "Hungarian" },
  ukr: { flag: "ua", name: "Ukrainian" },
  uk: { flag: "ua", name: "Ukrainian" },
  vie: { flag: "vn", name: "Vietnamese" },
  vi: { flag: "vn", name: "Vietnamese" },
  tha: { flag: "th", name: "Thai" },
  th: { flag: "th", name: "Thai" },
  heb: { flag: "il", name: "Hebrew" },
  he: { flag: "il", name: "Hebrew" },
  ind: { flag: "id", name: "Indonesian" },
  id: { flag: "id", name: "Indonesian" },
  msa: { flag: "my", name: "Malay" },
  may: { flag: "my", name: "Malay" },
  ms: { flag: "my", name: "Malay" },
  ron: { flag: "ro", name: "Romanian" },
  rum: { flag: "ro", name: "Romanian" },
  ro: { flag: "ro", name: "Romanian" },
  hrv: { flag: "hr", name: "Croatian" },
  hr: { flag: "hr", name: "Croatian" },
  bul: { flag: "bg", name: "Bulgarian" },
  bg: { flag: "bg", name: "Bulgarian" },
  srp: { flag: "rs", name: "Serbian" },
  sr: { flag: "rs", name: "Serbian" },
  slk: { flag: "sk", name: "Slovak" },
  slo: { flag: "sk", name: "Slovak" },
  sk: { flag: "sk", name: "Slovak" },
  hin: { flag: "in", name: "Hindi" },
  hi: { flag: "in", name: "Hindi" },
  cat: { flag: "es", name: "Catalan" },
  ca: { flag: "es", name: "Catalan" },
  grk: { flag: "gr", name: "Greek" },
  ell: { flag: "gr", name: "Greek" },
  el: { flag: "gr", name: "Greek" },
};

const _displayNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

function getLangInfo(lang: string | undefined): LangInfo | undefined {
  if (!lang) return undefined;
  const key = lang.toLowerCase();
  if (LANG_INFO[key]) return LANG_INFO[key];
  // fallback: try Intl for the display name, no flag
  const name = _displayNames?.of(lang);
  return name ? { name } : undefined;
}

// addonHostname re-exported from utils; keep local alias for existing callsites
function addonHostname(url: string | undefined): string | undefined {
  return addonHostnameUtil(url);
}


function TorrentProgressView({
  stream,
  progress,
  error,
  onCancel,
}: {
  stream: EnrichedStream;
  progress: TorBoxTorrentItem | null;
  error: string | null;
  onCancel: () => void;
}) {
  const title = stream.rawName || stream.parsedTitle || "Unknown";
  const pct = progress?.progress ?? 0;
  const state = progress?.download_state ?? "Starting…";
  const speed = progress?.download_speed;
  const seeds = progress?.seeds;

  function formatSpeed(bps: number): string {
    if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bps >= 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
    return `${bps} B/s`;
  }

  return (
    <div className="flex flex-col gap-3 px-1 py-2">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer self-start"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to streams
      </button>

      <div className="flex flex-col gap-2 p-3 rounded-lg border border-border">
        <div className="text-sm font-medium leading-snug line-clamp-2">{title}</div>

        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="capitalize">{state}</span>
              <span>{pct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {speed !== undefined && speed > 0 && (
                <span>{formatSpeed(speed)}</span>
              )}
              {seeds !== undefined && (
                <span>{seeds} seeds</span>
              )}
              {!progress && (
                <span className="flex items-center gap-1">
                  <Loader className="h-3 w-3 animate-spin" />
                  Connecting…
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const RESOLUTION_ORDER: Resolution[] = ["4K", "1080p", "720p", "SD", "Unknown"];

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function Seekbar({
  currentTime,
  duration,
  buffered,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (t: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  function calcTime(clientX: number) {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(pct * duration);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    barRef.current?.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    calcTime(e.clientX);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (draggingRef.current) calcTime(e.clientX);
  }
  function onPointerUp(e: React.PointerEvent) {
    if (draggingRef.current) {
      draggingRef.current = false;
      barRef.current?.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div
      ref={barRef}
      className="group relative flex h-6 flex-1 cursor-pointer touch-none items-center select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="slider"
      aria-valuenow={currentTime}
      aria-valuemin={0}
      aria-valuemax={duration}
      tabIndex={0}
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="absolute h-full rounded-full bg-white/30 transition-all duration-200 ease-out"
          style={{ width: `${bufferedPct}%` }}
        />
        <div
          className="absolute h-full rounded-full bg-white transition-all duration-75 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="absolute h-3 w-3 rounded-full bg-white opacity-0 shadow ring-4 ring-white/20 transition-opacity group-hover:opacity-100"
        style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

function VolumeBar({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  function calcVolume(clientX: number) {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(pct * 100));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    barRef.current?.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    calcVolume(e.clientX);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (draggingRef.current) calcVolume(e.clientX);
  }
  function onPointerUp(e: React.PointerEvent) {
    if (draggingRef.current) {
      draggingRef.current = false;
      barRef.current?.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div
      ref={barRef}
      className="group relative flex h-6 w-24 cursor-pointer touch-none items-center select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="absolute h-full rounded-full bg-white transition-all duration-75 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <div
        className="absolute h-3 w-3 rounded-full bg-white shadow ring-4 ring-white/20"
        style={{ left: `${value}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

export interface PlayerControlsProps {
  paused: boolean;
  isBuffering: boolean;
  timePos: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  audioTracks: MpvTrack[];
  subtitleTracks: MpvTrack[];
  currentAid: string;
  currentSid: string;
  isSettingsOpen: boolean;
  activeSection: Section;
  selectedResolutionLabel: string;
  streams: EnrichedStream[];
  selected: EnrichedStream | null;
  switching: boolean;
  switchError: string;
  controlsVisible: boolean;
  isFullscreen: boolean;
  platform: Platform;
  onSectionChange: (s: Section) => void;
  onSetActiveSection: (s: Section) => void;
  onCloseSettings: () => void;
  onSelectStream: (s: EnrichedStream) => void;
  onOpenExternal?: (s: EnrichedStream) => void;
  onSelectResolution: (label: string) => void;
  onFullscreen: () => void;
  onPlayPause: () => void;
  onSeekRelative: (delta: number) => void;
  onSeekTo: (t: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onSetSid: (id: string) => void;
  onSetAid: (id: string) => void;
}

export default function PlayerControls({
  paused,
  isBuffering,
  timePos,
  duration,
  buffered,
  volume,
  muted,
  audioTracks,
  subtitleTracks,
  currentAid,
  currentSid,
  isSettingsOpen,
  activeSection,
  selectedResolutionLabel,
  streams,
  selected,
  switching,
  switchError,
  controlsVisible,
  isFullscreen,
  platform,
  onSectionChange,
  onSetActiveSection,
  onCloseSettings,
  onSelectStream,
  onOpenExternal,
  onSelectResolution,
  onFullscreen,
  onPlayPause,
  onSeekRelative,
  onSeekTo,
  onVolumeChange,
  onToggleMute,
  onSetSid,
  onSetAid,
}: PlayerControlsProps) {
  const groups = groupByResolution(streams);
  const resolutionOptions = RESOLUTION_ORDER.filter(
    (r) => groups[r].length > 0,
  );

  // ── Source tab state ──────────────────────────────────────────────────────
  const [pendingStream, setPendingStream] = useState<EnrichedStream | null>(null);
  const [torrentProgress, setTorrentProgress] = useState<TorBoxTorrentItem | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  // When sidebar closes, reset pending progress state
  useEffect(() => {
    if (!isSettingsOpen) {
      setPendingStream(null);
      setTorrentProgress(null);
      setProgressError(null);
    }
  }, [isSettingsOpen]);

  // Only show streams matching the selected resolution, processed + sorted
  const sortedResolutionStreams = useMemo<ProcessedStream[]>(() => {
    const resStreams = groups[selectedResolutionLabel as Resolution] ?? [];
    return sortStreams(resStreams.map((s) => processStream(s, platform)));
  }, [groups, selectedResolutionLabel, platform]);

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Settings sidebar */}
      {isSettingsOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-90 h-full bg-background border-l border-border flex flex-col overflow-hidden z-50 shadow-2xl">
          {/* Tabs + close */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border shrink-0">
            {SECTIONS.map((section) => (
              <button
                key={section}
                onClick={() => onSetActiveSection(section)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeSection === section
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {section}
              </button>
            ))}
            <button
              onClick={onCloseSettings}
              className="ml-auto p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Pinned banner for web/mobileweb on Source tab */}
          {activeSection === "Source" && (platform === "web" || platform === "mobileweb") && (
            <div className="shrink-0 flex flex-col gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground leading-snug">
                  Not all streams can play in the browser. Download the app for the full experience.
                </p>
              </div>
              {platform === "web" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openUrl("https://torbox.app/download")}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Download App
                  </button>
                  <button
                    onClick={() => openUrl("jlkr://open")}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <AppWindow className="h-3 w-3" />
                    Open App
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-3 py-3 flex-1 min-h-0 w-full overflow-y-auto hide-scrollbar">
            {activeSection === "Quality" && (
              <div className="flex flex-col gap-1 w-full">
                {resolutionOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => onSelectResolution(r)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      selectedResolutionLabel === r
                        ? "bg-primary text-primary-foreground font-medium"
                        : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{r === "Unknown" ? "Unknown" : r}</span>
                    <span
                      className={`text-xs tabular-nums ${selectedResolutionLabel === r ? "opacity-70" : "text-muted-foreground"}`}
                    >
                      {groups[r].length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeSection === "Source" && (
              <div className="flex flex-col gap-1 w-full">
                {/* Inline torrent progress view */}
                {pendingStream ? (
                  <TorrentProgressView
                    stream={pendingStream}
                    progress={torrentProgress}
                    error={progressError}
                    onCancel={() => {
                      setPendingStream(null);
                      setTorrentProgress(null);
                      setProgressError(null);
                    }}
                  />
                ) : (
                  sortedResolutionStreams.map(({ stream, available, sizeGB, explain }) => {
                    const isSelected = selected?.infoHash === stream.infoHash;
                    const hostname = addonHostname(stream.addonUrl);
                    const title = stream.rawName || stream.parsedTitle || "Unknown Source";

                    const metaRow = (active: boolean) => (
                      <div className={`flex flex-wrap items-center gap-x-1 text-[11px] mt-0.5 ${active ? (isSelected ? "opacity-60" : "text-muted-foreground") : "text-muted-foreground/50"}`}>
                        {sizeGB > 0 && <span>{formatSize(sizeGB)}</span>}
                        {hostname && <><span>·</span><span>{hostname}</span></>}
                        {stream.cached === true && active && (
                          <><span>·</span><span>cached</span></>
                        )}
                        {stream.cached === false && available && (
                          <><span>·</span><span className={`flex items-center gap-0.5 ${isSelected ? "" : "text-amber-500 font-medium"}`}><Clock className="h-3 w-3" />uncached</span></>
                        )}
                      </div>
                    );

                    if (!available) {
                      if (platform === "mobileweb") {
                        return (
                          <button
                            key={stream.infoHash ?? stream.rawName}
                            disabled={switching}
                            onClick={() => onOpenExternal?.(stream)}
                            className="w-full text-left px-3 py-2.5 rounded-lg border border-border/50 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm leading-snug truncate text-foreground/70 min-w-0">{title}</div>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            </div>
                            <div className="flex items-center gap-x-1 text-[11px] mt-0.5 text-muted-foreground/50">
                              {sizeGB > 0 && <span>{formatSize(sizeGB)}</span>}
                              {hostname && <><span>·</span><span>{hostname}</span></>}
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><ExternalLink className="h-3 w-3" />Opens in VLC</span>
                            </div>
                          </button>
                        );
                      }
                      return (
                        <div
                          key={stream.infoHash ?? stream.rawName}
                          className="w-full text-left px-3 py-2.5 rounded-lg border border-border/50 opacity-50 select-none"
                          title={explain ?? undefined}
                        >
                          <div className="text-sm leading-snug truncate text-foreground/70">{title}</div>
                          {metaRow(false)}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={stream.infoHash ?? stream.rawName}
                        className={`w-full flex items-stretch rounded-lg text-sm border transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground border-primary font-medium" : "border-border hover:bg-muted"
                        }`}
                      >
                        <button
                          disabled={switching}
                          onClick={() => {
                            if (stream.cached === false) {
                              setPendingStream(stream);
                              setTorrentProgress(null);
                              setProgressError(null);
                              const magnet = stream.magnetLink ?? `magnet:?xt=urn:btih:${stream.infoHash}`;
                              createTorrent(magnet)
                                .then(({ data }) => {
                                  const cancel = pollTorrentProgress(data.torrent_id, (torrentItem) => {
                                    setTorrentProgress(torrentItem);
                                    if (torrentItem.files && torrentItem.files.length > 0) {
                                      cancel();
                                      setPendingStream(null);
                                      setTorrentProgress(null);
                                      onSelectStream(stream);
                                    }
                                  });
                                })
                                .catch((e) => {
                                  setProgressError(e instanceof Error ? e.message : "Failed to start download");
                                });
                            } else {
                              onSelectStream(stream);
                            }
                          }}
                          className="flex-1 text-left px-3 py-2.5 cursor-pointer min-w-0"
                        >
                          <div className={`text-sm leading-snug truncate ${isSelected ? "" : "text-foreground"}`}>{title}</div>
                          {metaRow(true)}
                        </button>
                        {platform === "mobileweb" && (
                          <button
                            disabled={switching}
                            onClick={() => onOpenExternal?.(stream)}
                            className={`shrink-0 flex items-center px-2.5 border-l cursor-pointer transition-colors ${
                              isSelected
                                ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
                                : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                            title="Open in external player"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeSection === "Subtitles" && (
              <>
                <button
                  onClick={() => onSetSid("no")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer mb-1 ${
                    currentSid === "no"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  No Subtitles
                </button>
                <div className="flex flex-col gap-1">
                  {subtitleTracks.map((track) => {
                    const info = getLangInfo(track.lang);
                    const isActive = currentSid === track.id.toString();
                    const label =
                      track.title ||
                      info?.name ||
                      track.lang ||
                      `Subtitle ${track.id}`;
                    return (
                      <button
                        key={track.id}
                        onClick={() => onSetSid(track.id.toString())}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {info?.flag ? (
                          <span
                            className={`fi fi-${info.flag} rounded-xs shrink-0 text-base`}
                          />
                        ) : (
                          <span className="w-5 h-4 shrink-0" />
                        )}
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                  {subtitleTracks.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1 py-2">
                      No subtitle tracks
                    </p>
                  )}
                </div>
              </>
            )}

            {activeSection === "Audio" && (
              <div className="flex flex-col gap-1">
                {audioTracks.map((track) => {
                  const info = getLangInfo(track.lang);
                  const isActive = currentAid === track.id.toString();
                  const label =
                    track.title ||
                    info?.name ||
                    track.lang ||
                    `Audio ${track.id}`;
                  return (
                    <button
                      key={track.id}
                      onClick={() => onSetAid(track.id.toString())}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {info?.flag ? (
                        <span
                          className={`fi fi-${info.flag} rounded-xs shrink-0 text-base`}
                        />
                      ) : (
                        <span className="w-5 h-4 shrink-0" />
                      )}
                      <span className="truncate flex-1">{label}</span>
                      {track.codec && (
                        <span
                          className={`text-[10px] shrink-0 ${isActive ? "opacity-60" : "text-muted-foreground/60"}`}
                        >
                          {track.codec}
                        </span>
                      )}
                    </button>
                  );
                })}
                {audioTracks.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1 py-2">
                    No audio tracks
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center controls */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-10 pointer-events-auto">
          <button
            onClick={() => onSeekRelative(-10)}
            className="relative flex items-center justify-center rounded-full p-3 transition-colors cursor-pointer text-white drop-shadow-lg"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="h-10 w-10" />
            <span className="absolute text-[10px] font-bold leading-none">
              10
            </span>
          </button>

          <button
            onClick={onPlayPause}
            className="rounded-full p-4 transition-colors text-white cursor-pointer drop-shadow-lg"
            aria-label={paused ? "Play" : "Pause"}
          >
            {isBuffering && !paused ? (
              <Loader className="h-16 w-16 animate-spin" />
            ) : paused ? (
              <Play fill="currentColor" className="h-16 w-16" />
            ) : (
              <Pause fill="currentColor" className="h-16 w-16" />
            )}
          </button>

          <button
            onClick={() => onSeekRelative(10)}
            className="relative flex items-center justify-center rounded-full p-3 transition-colors cursor-pointer text-white drop-shadow-lg"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="h-10 w-10" />
            <span className="absolute text-[10px] font-bold leading-none">
              10
            </span>
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      >
        <div className="px-5 pb-5 pt-8">
          {switchError && (
            <p className="text-[11px] text-red-400 mb-2">{switchError}</p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-[12px] text-white/50 tabular-nums shrink-0">
              {formatTime(timePos)}
            </span>
            <Seekbar
              currentTime={timePos}
              duration={duration}
              buffered={buffered}
              onSeek={onSeekTo}
            />
            <span className="text-[12px] text-white/50 tabular-nums shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between text-white mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleMute}
                  className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                  aria-label="Toggle mute"
                >
                  {muted || volume === 0 ? (
                    <VolumeOff className="h-5 w-5" />
                  ) : volume < 50 ? (
                    <Volume1 className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                <VolumeBar
                  value={volume}
                  onChange={onVolumeChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                onClick={() => onSectionChange("Subtitles")}
                aria-label="Subtitles"
              >
                {currentSid !== "no" ? (
                  <Captions className="h-5 w-5" />
                ) : (
                  <CaptionsOff className="h-5 w-5" />
                )}
              </button>

              <button
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                onClick={() => onSectionChange("Audio")}
                aria-label="Audio tracks"
              >
                <AudioLines className="h-5 w-5" />
              </button>

              <button
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                onClick={() => onSectionChange("Quality")}
                aria-label="Quality"
              >
                <Hd className="h-5 w-5" />
              </button>

              <button
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                onClick={() => onSectionChange("Source")}
                aria-label="Source"
              >
                <Film className="h-5 w-5" />
              </button>

              <button
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                onClick={onFullscreen}
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

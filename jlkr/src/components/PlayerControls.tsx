import { useRef } from "react";
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
} from "lucide-react";
import { command, setProperty } from "tauri-plugin-libmpv-api";
import { groupByResolution } from "../services/addons";
import type { EnrichedStream, Resolution } from "../types/torbox";

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

function addonHostname(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
  onSectionChange: (s: Section) => void;
  onSetActiveSection: (s: Section) => void;
  onCloseSettings: () => void;
  onSelectStream: (s: EnrichedStream) => void;
  onSelectResolution: (label: string) => void;
  onFullscreen: () => void;
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
  onSectionChange,
  onSetActiveSection,
  onCloseSettings,
  onSelectStream,
  onSelectResolution,
  onFullscreen,
}: PlayerControlsProps) {
  const groups = groupByResolution(streams);
  const resolutionOptions = RESOLUTION_ORDER.filter(
    (r) => groups[r].length > 0,
  );
  const currentResolutionStreams =
    groups[selectedResolutionLabel as Resolution] ?? [];

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
                {currentResolutionStreams.map((stream) => {
                  const isSelected = selected?.infoHash === stream.infoHash;
                  const hostname = addonHostname(stream.addonUrl);
                  return (
                    <button
                      key={stream.infoHash}
                      disabled={switching}
                      onClick={() => onSelectStream(stream)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium"
                          : "border border-border hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`text-sm leading-snug break-all ${isSelected ? "" : "text-foreground"}`}
                      >
                        {stream.rawName || "Unknown Source"}
                      </div>
                      {(hostname || stream.cached) && (
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <div
                            className={`text-xs ${isSelected ? "opacity-60" : "text-muted-foreground"}`}
                          >
                            {hostname}
                          </div>
                          {stream.cached && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                              cached
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {activeSection === "Subtitles" && (
              <>
                <button
                  onClick={() => setProperty("sid", "no").catch(() => {})}
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
                        onClick={() =>
                          setProperty("sid", track.id.toString()).catch(
                            () => {},
                          )
                        }
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
                      onClick={() =>
                        setProperty("aid", track.id.toString()).catch(() => {})
                      }
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
            onClick={() => command("seek", ["-10", "relative"]).catch(() => {})}
            className="relative flex items-center justify-center rounded-full p-3 transition-colors cursor-pointer text-white drop-shadow-lg"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="h-10 w-10" />
            <span className="absolute text-[10px] font-bold leading-none">
              10
            </span>
          </button>

          <button
            onClick={() => command("cycle", ["pause"]).catch(() => {})}
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
            onClick={() => command("seek", ["10", "relative"]).catch(() => {})}
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
              onSeek={(t) => setProperty("time-pos", t).catch(() => {})}
            />
            <span className="text-[12px] text-white/50 tabular-nums shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between text-white mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setProperty("mute", !muted).catch(() => {})}
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
                  onChange={(v) => setProperty("volume", v).catch(() => {})}
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

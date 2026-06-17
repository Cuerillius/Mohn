import { useRef } from "react";
import {
  AudioLines,
  Captions,
  CaptionsOff,
  Clock,
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
import { fileSize, isPlayable } from "../sources/selectSource";
import type { Source } from "../types";
import type { PlayerSnapshot } from "../session/usePlayerSession";

export type Section = "Subtitles" | "Audio" | "Quality" | "Source";
export const SECTIONS: Section[] = ["Subtitles", "Audio", "Quality", "Source"];

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

function formatSize(bytes: number | undefined): string {
  if (!bytes) return "";
  const gb = bytes / 1024 ** 3;
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
  return `${gb.toFixed(2)} GB`;
}

function hostname(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Scrubber({
  value,
  max,
  buffered,
  onSeek,
  width,
}: {
  value: number;
  max: number;
  buffered?: number;
  onSeek: (t: number) => void;
  width?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const pct = max > 0 ? (value / max) * 100 : 0;
  const bufPct = buffered && max > 0 ? (buffered / max) * 100 : 0;

  const calc = (clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(p * max);
  };

  return (
    <div
      ref={barRef}
      className={`group relative flex h-6 cursor-pointer touch-none items-center select-none ${
        width ?? "flex-1"
      }`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        barRef.current?.setPointerCapture(e.pointerId);
        draggingRef.current = true;
        calc(e.clientX);
      }}
      onPointerMove={(e) => draggingRef.current && calc(e.clientX)}
      onPointerUp={(e) => {
        if (draggingRef.current) {
          draggingRef.current = false;
          barRef.current?.releasePointerCapture(e.pointerId);
        }
      }}
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        {buffered !== undefined && (
          <div
            className="absolute h-full rounded-full bg-white/30 transition-all duration-200"
            style={{ width: `${bufPct}%` }}
          />
        )}
        <div
          className="absolute h-full rounded-full bg-white transition-all duration-75"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className="absolute size-3 rounded-full bg-white opacity-0 shadow ring-4 ring-white/20 transition-opacity group-hover:opacity-100"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

function PanelButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
        active
          ? "bg-primary text-primary-foreground font-medium"
          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SourceItem({
  source,
  selected,
  switching,
  platform,
  onSelect,
}: {
  source: Source;
  selected: boolean;
  switching: boolean;
  platform: PlayerSnapshot["platform"];
  onSelect: (s: Source) => void;
}) {
  const playable = isPlayable(source, platform);
  const title = source.rawName || source.parsedTitle || "Unknown source";
  const size = formatSize(fileSize(source));
  const host = hostname(source.addonUrl);

  if (!playable) {
    return (
      <div
        className="rounded-lg border border-border/50 px-3 py-2.5 opacity-50 select-none"
        title="Too large to stream in the browser (>5 GB)"
      >
        <div className="truncate text-sm text-foreground/70">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground/50">
          {size} · over 5 GB
        </div>
      </div>
    );
  }

  return (
    <button
      disabled={switching}
      onClick={() => onSelect(source)}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-primary bg-primary font-medium text-primary-foreground"
          : "border-border hover:bg-muted"
      } cursor-pointer disabled:opacity-60`}
    >
      <div className="truncate text-sm">{title}</div>
      <div
        className={`mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] ${
          selected ? "opacity-70" : "text-muted-foreground"
        }`}
      >
        {size && <span>{size}</span>}
        {host && (
          <>
            <span>·</span>
            <span>{host}</span>
          </>
        )}
        <span>·</span>
        {source.cached ? (
          <span>cached</span>
        ) : (
          <span className={`flex items-center gap-0.5 ${selected ? "" : "text-amber-500"}`}>
            <Clock className="size-3" />
            uncached
          </span>
        )}
      </div>
    </button>
  );
}

interface ControlsProps {
  s: PlayerSnapshot;
  controlsVisible: boolean;
  isSettingsOpen: boolean;
  activeSection: Section;
  onSectionButton: (sec: Section) => void;
  onCloseSettings: () => void;
}

export default function Controls({
  s,
  controlsVisible,
  isSettingsOpen,
  activeSection,
  onSectionButton,
  onCloseSettings,
}: ControlsProps) {
  return (
    <>
      {/* Settings sidebar */}
      {isSettingsOpen && (
        <div className="fixed right-0 top-0 bottom-0 z-50 flex h-full w-90 flex-col overflow-hidden border-l border-border bg-background shadow-2xl">
          <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2">
            {SECTIONS.map((section) => (
              <button
                key={section}
                onClick={() => onSectionButton(section)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeSection === section
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {section}
              </button>
            ))}
            <button
              onClick={onCloseSettings}
              className="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-0 w-full flex-1 overflow-y-auto px-3 py-3">
            {activeSection === "Subtitles" && (
              <div className="flex flex-col gap-1">
                <PanelButton active={s.currentSid === "no"} onClick={() => s.onSetSubtitle("no")}>
                  No subtitles
                </PanelButton>
                {s.subtitleTracks.map((t) => (
                  <PanelButton
                    key={t.id}
                    active={s.currentSid === t.id}
                    onClick={() => s.onSetSubtitle(t.id)}
                  >
                    <span className="truncate">{t.label}</span>
                  </PanelButton>
                ))}
                {s.subtitleTracks.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No subtitle tracks</p>
                )}
              </div>
            )}

            {activeSection === "Audio" && (
              <div className="flex flex-col gap-1">
                {s.audioTracks.map((t) => (
                  <PanelButton
                    key={t.id}
                    active={s.currentAid === t.id}
                    onClick={() => s.onSetAudio(t.id)}
                  >
                    <span className="flex-1 truncate text-left">{t.label}</span>
                    {t.codec && <span className="text-[10px] opacity-60">{t.codec}</span>}
                  </PanelButton>
                ))}
                {s.audioTracks.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No audio tracks</p>
                )}
              </div>
            )}

            {activeSection === "Quality" && (
              <div className="flex flex-col gap-1">
                {s.quality.options.map((q) => (
                  <PanelButton
                    key={q}
                    active={s.quality.current === q}
                    onClick={() => s.onSelectQuality(q)}
                  >
                    <span>{q}</span>
                  </PanelButton>
                ))}
                {s.quality.options.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No quality options</p>
                )}
              </div>
            )}

            {activeSection === "Source" && (
              <div className="flex flex-col gap-1">
                {s.sources.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No sources yet…</p>
                ) : (
                  s.sources.map((src) => (
                    <SourceItem
                      key={src.infoHash}
                      source={src}
                      selected={s.selected?.infoHash === src.infoHash}
                      switching={!!s.switchingTo}
                      platform={s.platform}
                      onSelect={s.onSelectSource}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center transport */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-10">
          <button
            onClick={() => s.onSeekRelative(-10)}
            className="relative flex items-center justify-center rounded-full p-3 text-white drop-shadow-lg cursor-pointer"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="size-10" />
            <span className="absolute text-[10px] font-bold">10</span>
          </button>
          <button
            onClick={s.onPlayPause}
            className="rounded-full p-4 text-white drop-shadow-lg cursor-pointer"
            aria-label={s.paused ? "Play" : "Pause"}
          >
            {s.isBuffering && !s.paused ? (
              <Loader className="size-16 animate-spin" />
            ) : s.paused ? (
              <Play fill="currentColor" className="size-16" />
            ) : (
              <Pause fill="currentColor" className="size-16" />
            )}
          </button>
          <button
            onClick={() => s.onSeekRelative(10)}
            className="relative flex items-center justify-center rounded-full p-3 text-white drop-shadow-lg cursor-pointer"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="size-10" />
            <span className="absolute text-[10px] font-bold">10</span>
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      >
        <div className="px-5 pb-5 pt-8">
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-[12px] tabular-nums text-white/50">
              {formatTime(s.timePos)}
            </span>
            <Scrubber
              value={s.timePos}
              max={s.duration}
              buffered={s.buffered}
              onSeek={s.onSeekTo}
            />
            <span className="shrink-0 text-[12px] tabular-nums text-white/50">
              {formatTime(s.duration)}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={s.onToggleMute}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Toggle mute"
              >
                {s.muted || s.volume === 0 ? (
                  <VolumeOff className="size-5" />
                ) : s.volume < 50 ? (
                  <Volume1 className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </button>
              <Scrubber value={s.volume} max={100} onSeek={s.onVolumeChange} width="w-24" />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onSectionButton("Subtitles")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Subtitles"
              >
                {s.currentSid !== "no" ? (
                  <Captions className="size-5" />
                ) : (
                  <CaptionsOff className="size-5" />
                )}
              </button>
              <button
                onClick={() => onSectionButton("Audio")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Audio"
              >
                <AudioLines className="size-5" />
              </button>
              <button
                onClick={() => onSectionButton("Quality")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Quality"
              >
                <Hd className="size-5" />
              </button>
              <button
                onClick={() => onSectionButton("Source")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Source"
              >
                <Film className="size-5" />
              </button>
              <button
                onClick={s.onFullscreen}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Fullscreen"
              >
                {s.isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

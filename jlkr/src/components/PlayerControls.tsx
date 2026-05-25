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
  const resolutionOptions = RESOLUTION_ORDER.filter((r) => groups[r].length > 0);
  const currentResolutionStreams = groups[selectedResolutionLabel as Resolution] ?? [];

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Settings sidebar */}
      {isSettingsOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-90 h-full bg-[#111] border-l border-white/10 flex flex-col overflow-hidden z-50 shadow-2xl">
          <div className="flex gap-2 p-2 shrink-0">
            <div className="border border-white/10 rounded-lg gap-1 flex p-1 flex-1 overflow-x-auto hide-scrollbar">
              {SECTIONS.map((section) => (
                <button
                  key={section}
                  onClick={() => onSetActiveSection(section)}
                  className={`px-2 py-1 rounded-md text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    activeSection === section
                      ? "bg-white text-black font-medium"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
            <div className="border border-white/10 rounded-full flex items-center justify-center p-1 shrink-0">
              <button
                onClick={onCloseSettings}
                className="rounded-full p-1.5 hover:bg-white/10 transition-colors text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-3 pb-3 flex-1 min-h-0 w-full overflow-y-auto hide-scrollbar">
            {activeSection === "Quality" && (
              <div className="flex flex-col gap-1 w-full">
                {resolutionOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => onSelectResolution(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      selectedResolutionLabel === r
                        ? "bg-white text-black font-medium"
                        : "border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {r === "Unknown" ? "Unknown" : r.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {activeSection === "Source" && (
              <div className="flex flex-col gap-1 w-full">
                {currentResolutionStreams.map((stream) => (
                  <button
                    key={stream.infoHash}
                    disabled={switching}
                    onClick={() => onSelectStream(stream)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer whitespace-normal ${
                      selected?.infoHash === stream.infoHash
                        ? "bg-white text-black font-medium"
                        : "border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {stream.parsedTitle || "Unknown Source"}
                  </button>
                ))}
              </div>
            )}

            {activeSection === "Subtitles" && (
              <>
                <button
                  onClick={() => setProperty("sid", "no").catch(() => {})}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer mb-2 ${
                    currentSid === "no"
                      ? "bg-white text-black font-medium"
                      : "border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  No Subtitles
                </button>
                <div className="flex flex-col gap-1">
                  {subtitleTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() =>
                        setProperty("sid", track.id.toString()).catch(() => {})
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        currentSid === track.id.toString()
                          ? "bg-white text-black font-medium"
                          : "border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {track.title || track.lang || `Subtitle ${track.id}`}
                    </button>
                  ))}
                  {subtitleTracks.length === 0 && (
                    <p className="text-[12px] text-white/40 px-1 py-2">
                      No subtitle tracks
                    </p>
                  )}
                </div>
              </>
            )}

            {activeSection === "Audio" && (
              <div className="flex flex-col gap-1">
                {audioTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() =>
                      setProperty("aid", track.id.toString()).catch(() => {})
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      currentAid === track.id.toString()
                        ? "bg-white text-black font-medium"
                        : "border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {track.title || track.lang || `Audio ${track.id}`}
                    {track.codec && (
                      <span className="ml-1 text-[10px] text-white/40">
                        {track.codec}
                      </span>
                    )}
                  </button>
                ))}
                {audioTracks.length === 0 && (
                  <p className="text-[12px] text-white/40 px-1 py-2">
                    No audio tracks
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
              <button
                onClick={() => command("cycle", ["pause"]).catch(() => {})}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label={paused ? "Play" : "Pause"}
              >
                {isBuffering && !paused ? (
                  <Loader className="h-6 w-6 animate-spin" />
                ) : paused ? (
                  <Play className="h-6 w-6" />
                ) : (
                  <Pause className="h-6 w-6" />
                )}
              </button>

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

                <div className="w-24">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={muted ? 0 : volume}
                    onChange={(e) =>
                      setProperty("volume", Number(e.target.value)).catch(
                        () => {},
                      )
                    }
                    className="w-full h-1 accent-white cursor-pointer"
                  />
                </div>
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
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
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

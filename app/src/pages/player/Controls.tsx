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
} from "lucide-react";
import type { PlayerVM } from "./types";

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
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

interface ControlsProps {
  vm: PlayerVM;
  visible: boolean;
}

export default function Controls({ vm, visible }: ControlsProps) {
  return (
    <>
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-10">
          <button
            onClick={() => vm.onSeekRelative(-10)}
            className="relative flex items-center justify-center rounded-full p-3 text-white drop-shadow-lg cursor-pointer"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="size-10" />
            <span className="absolute text-[10px] font-bold">10</span>
          </button>
          <button
            onClick={vm.onPlayPause}
            className="rounded-full p-4 text-white drop-shadow-lg cursor-pointer"
            aria-label={vm.paused ? "Play" : "Pause"}
          >
            {vm.isBuffering && !vm.paused ? (
              <Loader className="size-16 animate-spin" />
            ) : vm.paused ? (
              <Play fill="currentColor" className="size-16" />
            ) : (
              <Pause fill="currentColor" className="size-16" />
            )}
          </button>
          <button
            onClick={() => vm.onSeekRelative(10)}
            className="relative flex items-center justify-center rounded-full p-3 text-white drop-shadow-lg cursor-pointer"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="size-10" />
            <span className="absolute text-[10px] font-bold">10</span>
          </button>
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      >
        <div className="px-5 pb-5 pt-8">
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-[12px] tabular-nums text-white/50">
              {formatTime(vm.timePos)}
            </span>
            <Scrubber
              value={vm.timePos}
              max={vm.duration}
              buffered={vm.buffered}
              onSeek={vm.onSeekTo}
            />
            <span className="shrink-0 text-[12px] tabular-nums text-white/50">
              {formatTime(vm.duration)}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={vm.onToggleMute}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Toggle mute"
              >
                {vm.muted || vm.volume === 0 ? (
                  <VolumeOff className="size-5" />
                ) : vm.volume < 50 ? (
                  <Volume1 className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </button>
              <Scrubber
                value={vm.volume}
                max={100}
                onSeek={vm.onVolumeChange}
                width="w-24"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => vm.onSectionToggle("Subtitles")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Subtitles"
              >
                {vm.currentSid !== "no" ? (
                  <Captions className="size-5" />
                ) : (
                  <CaptionsOff className="size-5" />
                )}
              </button>
              <button
                onClick={() => vm.onSectionToggle("Audio")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Audio"
              >
                <AudioLines className="size-5" />
              </button>
              <button
                onClick={() => vm.onSectionToggle("Quality")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Quality"
              >
                <Hd className="size-5" />
              </button>
              <button
                onClick={() => vm.onSectionToggle("Source")}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Source"
              >
                <Film className="size-5" />
              </button>
              <button
                onClick={vm.onFullscreen}
                className="rounded-full p-2 transition-colors hover:bg-white/10 cursor-pointer"
                aria-label="Fullscreen"
              >
                {vm.isFullscreen ? (
                  <Minimize className="size-5" />
                ) : (
                  <Maximize className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

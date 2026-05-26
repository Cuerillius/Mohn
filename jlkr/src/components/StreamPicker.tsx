import { useState } from "react";
import { ArrowLeft, ExternalLink, Loader } from "lucide-react";
import { groupByResolution } from "../services/addons";
import type { EnrichedStream, Resolution } from "../types/torbox";

const RESOLUTION_ORDER: Resolution[] = ["4K", "1080p", "720p", "SD", "Unknown"];

function addonHostname(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface StreamPickerProps {
  streams: EnrichedStream[];
  selected: EnrichedStream | null;
  switching: boolean;
  switchError: string;
  onSelectStream: (s: EnrichedStream) => void;
  onBack: () => void;
}

export default function StreamPicker({
  streams,
  selected,
  switching,
  switchError,
  onSelectStream,
  onBack,
}: StreamPickerProps) {
  const [activeResolution, setActiveResolution] = useState<Resolution>(
    selected?.resolution ?? "1080p",
  );

  const groups = groupByResolution(streams);
  const resolutionOptions = RESOLUTION_ORDER.filter((r) => groups[r].length > 0);
  const currentStreams = groups[activeResolution] ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="px-3 py-1.5 text-xs font-medium text-foreground">
          Select Stream
        </span>
        {switching && (
          <Loader className="ml-auto mr-1.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-3 flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
        {/* Quality */}
        <div className="flex flex-col gap-1 w-full">
          {resolutionOptions.map((r) => (
            <button
              key={r}
              onClick={() => setActiveResolution(r)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                activeResolution === r
                  ? "bg-primary text-primary-foreground font-medium"
                  : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{r}</span>
              <span
                className={`text-xs tabular-nums ${activeResolution === r ? "opacity-70" : "text-muted-foreground"}`}
              >
                {groups[r].length}
              </span>
            </button>
          ))}
        </div>

        {/* Streams */}
        <div className="flex flex-col gap-1 w-full">
          {currentStreams.map((stream) => {
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
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`text-sm leading-snug break-all ${isSelected ? "" : "text-foreground"}`}
                  >
                    {stream.rawName || "Unknown Source"}
                  </div>
                  {isSelected && (
                    switching
                      ? <Loader size={13} className="animate-spin shrink-0 mt-0.5 opacity-70" />
                      : <ExternalLink size={13} className="shrink-0 mt-0.5 opacity-70" />
                  )}
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

        {switchError && (
          <p className="text-sm text-destructive px-1">{switchError}</p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {switching
            ? "Resolving stream…"
            : "Tap a stream to open in VLC. Come back to try another."}
        </p>
      </div>
    </div>
  );
}

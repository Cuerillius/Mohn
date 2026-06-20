import { Clock, Download, X } from "lucide-react";
import { isTauri } from "@/lib/platform";
import { fileSize, isPlayable } from "@/player/sources/selectSource";
import type { Source } from "@/player/types";
import { SECTIONS, type PlayerVM } from "./types";

const DOWNLOAD_URL = "https://mohn.app";

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
  platform: PlayerVM["platform"];
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
          <span
            className={`flex items-center gap-0.5 ${selected ? "" : "text-amber-500"}`}
          >
            <Clock className="size-3" />
            uncached
          </span>
        )}
      </div>
    </button>
  );
}

export default function Sidepanel({ vm }: { vm: PlayerVM }) {
  if (!vm.sidepanelOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 flex h-full w-90 flex-col overflow-hidden border-l border-border bg-background shadow-2xl">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2">
        {SECTIONS.map((section) => (
          <button
            key={section}
            onClick={() => vm.onSectionToggle(section)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              vm.activeSection === section
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {section}
          </button>
        ))}
        <button
          onClick={vm.onCloseSidepanel}
          className="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 w-full flex-1 overflow-y-auto px-3 py-3">
        {vm.activeSection === "Subtitles" && (
          <div className="flex flex-col gap-1">
            <PanelButton
              active={vm.currentSid === "no"}
              onClick={() => vm.onSetSubtitle("no")}
            >
              No subtitles
            </PanelButton>
            {vm.subtitleTracks.map((t) => (
              <PanelButton
                key={t.id}
                active={vm.currentSid === t.id}
                onClick={() => vm.onSetSubtitle(t.id)}
              >
                <span className="truncate">{t.label}</span>
              </PanelButton>
            ))}
            {vm.subtitleTracks.length === 0 && (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                No subtitle tracks
              </p>
            )}
          </div>
        )}

        {vm.activeSection === "Audio" && (
          <div className="flex flex-col gap-1">
            {vm.audioTracks.map((t) => (
              <PanelButton
                key={t.id}
                active={vm.currentAid === t.id}
                onClick={() => vm.onSetAudio(t.id)}
              >
                <span className="flex-1 truncate text-left">{t.label}</span>
                {t.codec && (
                  <span className="text-[10px] opacity-60">{t.codec}</span>
                )}
              </PanelButton>
            ))}
            {vm.audioTracks.length === 0 && (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                No audio tracks
              </p>
            )}
          </div>
        )}

        {vm.activeSection === "Quality" && (
          <div className="flex flex-col gap-1">
            {vm.quality.options.map((q) => (
              <PanelButton
                key={q}
                active={vm.quality.current === q}
                onClick={() => vm.onSelectQuality(q)}
              >
                <span>{q}</span>
              </PanelButton>
            ))}
            {vm.quality.options.length === 0 && (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                No quality options
              </p>
            )}
          </div>
        )}

        {vm.activeSection === "Source" && (
          <div className="flex flex-col gap-1">
            {vm.sources.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                No sources yet…
              </p>
            ) : (
              vm.sources.map((src) => (
                <SourceItem
                  key={src.infoHash}
                  source={src}
                  selected={vm.selected?.infoHash === src.infoHash}
                  switching={!!vm.switchingTo}
                  platform={vm.platform}
                  onSelect={vm.onSelectSource}
                />
              ))
            )}
          </div>
        )}
      </div>

      {!isTauri && (
        <div className="shrink-0 border-t border-border p-3">
          <p className="mb-2 text-sm text-muted-foreground">
            Due to browser limitations, not all sources may be available. For
            the best experience, we recommend using our desktop app.
          </p>
          <a
            href={DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
          >
            <Download className="size-4" />
            Download Desktop App
          </a>
        </div>
      )}
    </div>
  );
}

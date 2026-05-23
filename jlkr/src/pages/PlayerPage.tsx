import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  init,
  observeProperties,
  destroy,
  command,
  setProperty,
} from "tauri-plugin-libmpv-api";
import type { MpvObservableProperty, MpvConfig } from "tauri-plugin-libmpv-api";
import { getExternalIds } from "../services/tmdb";
import {
  fetchAllStreams,
  enrichStream,
  autoSelectStream,
  groupByResolution,
} from "../services/addons";
import { checkCached, createAndResolveLink } from "../services/torbox";
import { useSettings } from "../context/SettingsContext";
import { useProfile } from "../context/ProfileContext";
import { apiGet, apiPatch } from "../services/api";
import type { EnrichedStream, Resolution } from "../types/torbox";

interface MpvTrack {
  id: number;
  type: "video" | "audio" | "sub";
  title?: string;
  lang?: string;
  codec?: string;
  selected?: boolean;
}

type Panel = "subtitles" | "audio" | "quality" | null;

const RESOLUTION_ORDER: Resolution[] = ["4K", "1080p", "720p", "SD", "Unknown"];

const OBSERVED_PROPERTIES = [
  ["pause", "flag"],
  ["time-pos", "double", "none"],
  ["duration", "double", "none"],
  ["track-list", "node", "none"],
  ["aid", "string", "none"],
  ["sid", "string", "none"],
  ["volume", "double", "none"],
  ["mute", "flag"],
  ["paused-for-cache", "flag"],
  ["core-idle", "flag"],
  ["demuxer-cache-duration", "double", "none"],
] as const satisfies MpvObservableProperty[];

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${bytes} B`;
}

// ── Seekbar ────────────────────────────────────────────────────────────────

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

// ── Volume button ──────────────────────────────────────────────────────────

function VolumeIcon({ volume, muted }: { volume: number; muted: boolean }) {
  if (muted || volume === 0)
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  if (volume < 50)
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({
  panel,
  streams,
  selected,
  audioTracks,
  subtitleTracks,
  currentAid,
  currentSid,
  onSelectStream,
  onSelectAudio,
  onSelectSubtitle,
  onClose,
  switching,
}: {
  panel: Panel;
  streams: EnrichedStream[];
  selected: EnrichedStream | null;
  audioTracks: MpvTrack[];
  subtitleTracks: MpvTrack[];
  currentAid: string;
  currentSid: string;
  onSelectStream: (s: EnrichedStream) => void;
  onSelectAudio: (id: string) => void;
  onSelectSubtitle: (id: string) => void;
  onClose: () => void;
  switching: boolean;
}) {
  const groups = groupByResolution(streams);

  const panelTitle =
    panel === "quality" ? "Quality" : panel === "audio" ? "Audio" : "Subtitles";

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-[#111]/90 border-l border-white/10 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <span className="text-[12px] font-medium text-white/70 uppercase tracking-wider">
          {panelTitle}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 cursor-pointer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {panel === "quality" && (
          <>
            {RESOLUTION_ORDER.map((r) => {
              const group = groups[r];
              if (group.length === 0) return null;
              return (
                <div key={r} className="mb-3">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider px-1 mb-1 font-semibold">
                    {r}
                  </div>
                  {group.map((s) => {
                    const isCurrent = s.infoHash === selected?.infoHash;
                    return (
                      <button
                        key={s.infoHash}
                        disabled={switching}
                        onClick={() => onSelectStream(s)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors cursor-pointer mb-1 ${
                          isCurrent
                            ? "bg-white/15 text-white"
                            : "text-white/70 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate flex-1">
                            {s.parsedTitle}
                          </span>
                          {s.cached && (
                            <span className="text-[10px] text-green-400 shrink-0">
                              ● Cached
                            </span>
                          )}
                          {isCurrent && !s.cached && (
                            <span className="text-[10px] text-white/30 shrink-0">
                              ● Now
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-0.5 text-[10px] text-white/40">
                          {s.sizeBytes && (
                            <span>{formatBytes(s.sizeBytes)}</span>
                          )}
                          {s.seeders != null && <span>{s.seeders} seeds</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {panel === "audio" && (
          <>
            {audioTracks.length === 0 && (
              <p className="text-[12px] text-white/40 px-3 py-2">
                No audio tracks
              </p>
            )}
            {audioTracks.map((t) => {
              const isCurrent = currentAid === t.id.toString();
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectAudio(t.id.toString())}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {t.title || t.lang || `Audio ${t.id}`}
                  {t.codec && (
                    <span className="ml-1 text-[10px] text-white/40">
                      {t.codec}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}

        {panel === "subtitles" && (
          <>
            <button
              onClick={() => onSelectSubtitle("no")}
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors cursor-pointer ${
                currentSid === "no"
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              Off
            </button>
            {subtitleTracks.length === 0 && (
              <p className="text-[12px] text-white/40 px-3 py-2">
                No subtitle tracks
              </p>
            )}
            {subtitleTracks.map((t) => {
              const isCurrent = currentSid === t.id.toString();
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectSubtitle(t.id.toString())}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {t.title || t.lang || `Subtitle ${t.id}`}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main PlayerPage ────────────────────────────────────────────────────────

export default function PlayerPage() {
  const { type, id, season, episode } = useParams<{
    type: string;
    id: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();
  const { addonUrls, loading: settingsLoading } = useSettings();
  const { profile } = useProfile();

  // Stable media ID used as the DB key for progress tracking
  const progressMediaId =
    type === "tv" ? `tv:${id}:${season ?? 1}:${episode ?? 1}` : `movie:${id}`;
  const progressMediaType = type === "tv" ? "tv" : "movie";

  // Load state
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [loadStep, setLoadStep] = useState("mounted");

  // Streams
  const [streams, setStreams] = useState<EnrichedStream[]>([]);
  const [selected, setSelected] = useState<EnrichedStream | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");

  // mpv playback state
  const [paused, setPaused] = useState(true);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [muted, setMuted] = useState(false);
  const [audioTracks, setAudioTracks] = useState<MpvTrack[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<MpvTrack[]>([]);
  const [currentAid, setCurrentAid] = useState<string>("auto");
  const [currentSid, setCurrentSid] = useState<string>("no");
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [resumeToast, setResumeToast] = useState("");

  const unlistenRef = useRef<(() => void) | null>(null);
  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(true);
  const timePosRef = useRef(0);
  const durationRef = useRef(0);
  const lastSavedPosRef = useRef(0);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const progressMediaIdRef = useRef(progressMediaId);
  progressMediaIdRef.current = progressMediaId;
  const progressMediaTypeRef = useRef(progressMediaType);
  progressMediaTypeRef.current = progressMediaType;

  // ── Control visibility ──────────────────────────────────────────────────

  const resetUiTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      if (!pausedRef.current) setShowControls(false);
    }, 3000);
  }, []);

  // ── Load: fetch metadata + streams + resolve link ───────────────────────

  useEffect(() => {
    if (!id || !type || settingsLoading) {
      setLoadStep(
        `waiting — settingsLoading:${settingsLoading} id:${id} type:${type}`,
      );
      return;
    }
    setLoadStep("starting");

    document.documentElement.classList.add("player-page");
    document.body.classList.add("player-page");

    let cancelled = false;

    function saveProgress(pos: number, dur: number) {
      const p = profileRef.current;
      if (!p || pos < 30) return;
      // Position 0 signals "completed" — stops resume prompt next time
      const savedPos = dur > 0 && pos / dur >= 0.9 ? 0 : Math.floor(pos);
      apiPatch(`/api/profiles/${p.id}/history/progress`, {
        mediaId: progressMediaIdRef.current,
        mediaType: progressMediaTypeRef.current,
        position: savedPos,
        duration: Math.floor(dur),
      }).catch(() => {});
    }

    function handleProperty({ name, data }: { name: string; data: unknown }) {
      if (name === "pause") {
        const p = !!data;
        setPaused(p);
        pausedRef.current = p;
        if (p) setShowControls(true);
      } else if (name === "time-pos") {
        const t = (data as number) || 0;
        setTimePos(t);
        timePosRef.current = t;
        // Save progress every 10 seconds
        if (t - lastSavedPosRef.current >= 10) {
          lastSavedPosRef.current = t;
          saveProgress(t, durationRef.current);
        }
      } else if (name === "duration") {
        const d = (data as number) || 0;
        setDuration(d);
        durationRef.current = d;
      } else if (name === "aid") {
        setCurrentAid((data ?? "auto").toString());
      } else if (name === "sid") {
        setCurrentSid((data ?? "no").toString());
      } else if (name === "volume") {
        setVolumeState((data as number) || 0);
      } else if (name === "mute") {
        setMuted(!!data);
      } else if (name === "paused-for-cache") {
        setIsBuffering(!!data);
      } else if (name === "demuxer-cache-duration") {
        setBuffered(timePosRef.current + ((data as number) || 0));
      } else if (name === "track-list") {
        const tracks = (data as MpvTrack[]) || [];
        setAudioTracks(tracks.filter((t) => t.type === "audio"));
        setSubtitleTracks(tracks.filter((t) => t.type === "sub"));
      }
    }

    async function run() {
      try {
        setLoadStep("init mpv + fetch streams");

        const mpvConfig: MpvConfig = {
          initialOptions: {
            vo: "gpu-next",
            hwdec: "auto-safe",
            "keep-open": "yes",
            "force-window": "yes",
          },
          observedProperties: OBSERVED_PROPERTIES,
        };

        // Kick off saved-position fetch immediately in parallel with everything else
        const p = profileRef.current;
        const savedPosPromise = p
          ? apiGet<{ position: number; duration: number }>(
              `/api/profiles/${p.id}/history/progress?mediaId=${encodeURIComponent(progressMediaIdRef.current)}`,
            ).catch(() => ({ position: 0, duration: 0 }))
          : Promise.resolve({ position: 0, duration: 0 });

        const mpvPromise = init(mpvConfig).then(async () => {
          if (cancelled) return;
          unlistenRef.current = await observeProperties(
            OBSERVED_PROPERTIES,
            handleProperty,
          );
        });

        if (addonUrls.length === 0)
          throw new Error("Add addon URLs in Settings first");

        setLoadStep("fetching IMDB id");
        const { imdb_id } = await getExternalIds(
          Number(id),
          type === "tv" ? "tv" : "movie",
        );
        if (!imdb_id) throw new Error("No IMDB ID for this title");
        if (cancelled) return;

        const streamId =
          type === "tv" ? `${imdb_id}:${season ?? 1}:${episode ?? 1}` : imdb_id;
        setLoadStep(`fetching streams (${streamId})`);
        const raw = await fetchAllStreams(
          addonUrls,
          type === "tv" ? "series" : "movie",
          streamId,
        );
        if (raw.length === 0)
          throw new Error("No streams found from your addons");
        if (cancelled) return;

        setLoadStep(`checking cache (${raw.length} streams)`);
        const enriched = raw.map(enrichStream);
        const hashes = enriched
          .map((s) => s.infoHash)
          .filter(Boolean) as string[];
        const cacheResult = await checkCached(hashes);
        if (cancelled) return;

        for (const s of enriched) {
          if (s.infoHash && cacheResult.data?.[s.infoHash]) s.cached = true;
        }

        const best = autoSelectStream(enriched);
        if (!best?.infoHash) throw new Error("No suitable stream found");

        setLoadStep(`resolving link (${best.cached ? "cached" : "uncached"})`);
        const magnet =
          best.magnetLink ?? `magnet:?xt=urn:btih:${best.infoHash}`;
        const { url } = await createAndResolveLink(magnet, best.fileIdx);
        if (cancelled) return;

        setStreams(enriched);
        setSelected(best);
        setLoadState("ready");
        resetUiTimer();

        setLoadStep("waiting for mpv");
        await mpvPromise;
        if (cancelled) return;

        // Resume from saved position if available
        const { position: savedPos } = await savedPosPromise;
        if (savedPos > 30) {
          await setProperty("options/start", String(Math.floor(savedPos)));
          setResumeToast(`Resumed from ${formatTime(savedPos)}`);
          setTimeout(() => setResumeToast(""), 3000);
        }
        await command("loadfile", [url]);
        await setProperty("options/start", "none");
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setLoadState("error");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      clearTimeout(uiTimeoutRef.current);
      unlistenRef.current?.();
      // Save position on exit
      saveProgress(timePosRef.current, durationRef.current);
      destroy().catch(() => {});
      document.documentElement.classList.remove("player-page");
      document.body.classList.remove("player-page");
    };
  }, [id, type, season, episode, settingsLoading, addonUrls, resetUiTimer]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      )
        return;

      let handled = true;
      switch (e.key) {
        case " ":
          command("cycle", ["pause"]).catch(() => {});
          break;
        case "ArrowRight":
          setProperty(
            "time-pos",
            Math.min(durationRef.current, timePosRef.current + 10),
          ).catch(() => {});
          break;
        case "ArrowLeft":
          setProperty("time-pos", Math.max(0, timePosRef.current - 10)).catch(
            () => {},
          );
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
        case "m":
        case "M":
          setProperty("mute", !muted).catch(() => {});
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        resetUiTimer();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [muted, resetUiTimer]);

  // ── Control handlers ────────────────────────────────────────────────────

  async function handleFullscreen() {
    const next = !isFullscreen;
    setIsFullscreen(next);
    await getCurrentWindow()
      .setFullscreen(next)
      .catch(() => {});
  }

  async function handleSelectStream(stream: EnrichedStream) {
    if (stream.infoHash === selected?.infoHash || switching) return;
    setSwitching(true);
    setSwitchError("");
    try {
      const magnet =
        stream.magnetLink ?? `magnet:?xt=urn:btih:${stream.infoHash}`;
      const { url } = await createAndResolveLink(magnet, stream.fileIdx);
      setSelected(stream);
      await setProperty(
        "options/start",
        String(Math.floor(timePosRef.current)),
      );
      await command("loadfile", [url]);
      await setProperty("options/start", "none");
    } catch (e) {
      setSwitchError(
        e instanceof Error ? e.message : "Failed to switch stream",
      );
    } finally {
      setSwitching(false);
    }
  }

  function togglePanel(p: Exclude<Panel, null>) {
    setActivePanel((prev) => (prev === p ? null : p));
  }

  // ── Loading / error screens ─────────────────────────────────────────────

  if (loadState === "loading") {
    return (
      <div className="w-full h-screen bg-[#111] flex flex-col items-center justify-center gap-3">
        <svg
          className="animate-spin text-white/40"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span className="text-[13px] text-white/40">{loadStep}</span>
        <span className="text-[10px] text-white/25">
          {type}/{id} · settings {settingsLoading ? "loading" : "ready"} ·{" "}
          {addonUrls.length} addons
        </span>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="w-full h-screen bg-[#111] flex flex-col items-center justify-center gap-4">
        <p className="text-[14px] text-red-400">{loadError}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[13px] text-white/60 bg-white/8 rounded-lg px-4 py-2 hover:bg-white/12 transition-colors cursor-pointer"
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Player UI ───────────────────────────────────────────────────────────

  const controlsVisible = showControls || paused;

  return (
    <div
      className="relative w-full h-screen bg-transparent overflow-hidden"
      onMouseMove={resetUiTimer}
      onMouseLeave={() => {
        if (!pausedRef.current) setShowControls(false);
      }}
    >
      {/* Resume toast */}
      {resumeToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white/80 text-[12px] px-4 py-2 rounded-full pointer-events-none">
          {resumeToast}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className={`absolute top-4 left-4 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 transition-all duration-300 cursor-pointer ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="Back"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {/* Transport — centered */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex items-center gap-6 transition-all duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Skip back 10s */}
        <button
          onClick={() =>
            setProperty("time-pos", Math.max(0, timePosRef.current - 10)).catch(
              () => {},
            )
          }
          className="w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
          aria-label="Skip back 10s"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            <text x="8" y="16" fontSize="6" fontWeight="bold" fill="white">
              10
            </text>
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => command("cycle", ["pause"]).catch(() => {})}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black hover:opacity-90 transition-opacity cursor-pointer"
          aria-label={paused ? "Play" : "Pause"}
        >
          {isBuffering && !paused ? (
            <svg
              className="animate-spin"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : paused ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </button>

        {/* Skip forward 10s */}
        <button
          onClick={() =>
            setProperty(
              "time-pos",
              Math.min(durationRef.current, timePosRef.current + 10),
            ).catch(() => {})
          }
          className="w-11 h-11 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
          aria-label="Skip forward 10s"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
            <text x="8" y="16" fontSize="6" fontWeight="bold" fill="white">
              10
            </text>
          </svg>
        </button>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
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
            {/* Volume button */}
            <button
              onClick={() => setProperty("mute", !muted).catch(() => {})}
              className="text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Toggle mute"
            >
              <VolumeIcon volume={volume} muted={muted} />
            </button>

            {/* Volume slider */}
            <div className="w-20 shrink-0 flex items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) =>
                  setProperty("volume", Number(e.target.value)).catch(() => {})
                }
                className="w-full h-1 accent-white cursor-pointer"
              />
            </div>

            {/* Current time */}
            <span className="text-[12px] text-white/60 tabular-nums shrink-0">
              {formatTime(timePos)}
            </span>

            {/* Seekbar */}
            <Seekbar
              currentTime={timePos}
              duration={duration}
              buffered={buffered}
              onSeek={(t) => setProperty("time-pos", t).catch(() => {})}
            />

            {/* Duration */}
            <span className="text-[12px] text-white/60 tabular-nums shrink-0">
              {formatTime(duration)}
            </span>

            {/* Divider */}
            <div className="w-px h-4 bg-white/20 shrink-0" />

            {/* Subtitle */}
            <button
              onClick={() => togglePanel("subtitles")}
              className={`shrink-0 transition-colors cursor-pointer ${activePanel === "subtitles" ? "text-white" : "text-white/50 hover:text-white/80"}`}
              aria-label="Subtitles"
            >
              {currentSid !== "no" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
                  <path d="M7 12h10M7 16h4" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              )}
            </button>

            {/* Audio */}
            <button
              onClick={() => togglePanel("audio")}
              className={`shrink-0 transition-colors cursor-pointer ${activePanel === "audio" ? "text-white" : "text-white/50 hover:text-white/80"}`}
              aria-label="Audio tracks"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </button>

            {/* Quality (resolution + source combined) */}
            <button
              onClick={() => togglePanel("quality")}
              className={`shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${activePanel === "quality" ? "text-white" : "text-white/50 hover:text-white/80"}`}
              aria-label="Quality"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="20" height="10" rx="2" />
                <path d="M7 10.5h2l1 3h-2l-1-3zM13 10.5h4" />
              </svg>
              {selected && (
                <span className="text-[10px] tabular-nums">
                  {selected.resolution}
                </span>
              )}
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white/50 hover:text-white/80 shrink-0 transition-colors cursor-pointer"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar panel */}
      {activePanel !== null && (
        <Sidebar
          panel={activePanel}
          streams={streams}
          selected={selected}
          audioTracks={audioTracks}
          subtitleTracks={subtitleTracks}
          currentAid={currentAid}
          currentSid={currentSid}
          onSelectStream={handleSelectStream}
          onSelectAudio={(id) => setProperty("aid", id).catch(() => {})}
          onSelectSubtitle={(id) => setProperty("sid", id).catch(() => {})}
          onClose={() => setActivePanel(null)}
          switching={switching}
        />
      )}
    </div>
  );
}

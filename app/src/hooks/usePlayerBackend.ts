import { useState, useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  init,
  observeProperties,
  destroy,
} from "tauri-plugin-libmpv-api";
import type { MpvObservableProperty, MpvConfig } from "tauri-plugin-libmpv-api";
import {
  isTauri,
  isMobileBrowser,
  isBrowserPlayable,
  MpvStreamPlayer,
  BrowserVideoPlayer,
  ExternalStreamPlayer,
  DesktopPromptPlayer,
  type StreamPlayerService,
} from "../services/streamPlayer";
import { formatTime } from "../components/PlayerControls";
import type { MpvPropertyHandler, PlayerMode } from "./usePlaybackState";
import type { LoadState } from "./useStreamLoader";
import type { Platform } from "../lib/streamUtils";

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

const MPV_CONFIG: MpvConfig = {
  initialOptions: {
    vo: "gpu-next",
    hwdec: "auto-safe",
    "keep-open": "yes",
    "force-window": "yes",
  },
  observedProperties: OBSERVED_PROPERTIES,
};

export interface PlayerBackendResult {
  playerMode: PlayerMode;
  isFullscreen: boolean;
  handleFullscreen: () => Promise<void>;
}

export function usePlayerBackend(
  loadState: LoadState,
  resolvedUrl: string | null,
  resolvedMimetype: string | undefined,
  resumePosition: number,
  _platform: Platform,
  videoRef: RefObject<HTMLVideoElement>,
  mpvHandlerRef: MutableRefObject<MpvPropertyHandler>,
  onResumeToast: (msg: string) => void,
): PlayerBackendResult {
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playerRef = useRef<StreamPlayerService | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const isFullscreenRef = useRef(false);
  const prevUrlRef = useRef<string | null>(null);
  const resumePositionRef = useRef(resumePosition);
  resumePositionRef.current = resumePosition;
  const onResumeToastRef = useRef(onResumeToast);
  onResumeToastRef.current = onResumeToast;

  useEffect(() => {
    if (loadState !== "ready" || !resolvedUrl) return;
    if (resolvedUrl === prevUrlRef.current) return;

    const isSwitch = prevUrlRef.current !== null;
    prevUrlRef.current = resolvedUrl;
    let cancelled = false;

    async function setup() {
      try {
        const tauri = isTauri();
        const mobile = isMobileBrowser();

        let sp: StreamPlayerService;

        if (isSwitch && playerRef.current) {
          // Reuse existing player for stream switches
          sp = playerRef.current;
        } else {
          // Destroy previous before creating new one
          const prev = playerRef.current;
          if (prev?.type === "embedded") {
            destroy().catch(() => {});
          } else {
            prev?.destroy?.();
          }
          playerRef.current = null;
          unlistenRef.current?.();
          unlistenRef.current = null;

          if (tauri) {
            sp = new MpvStreamPlayer();
            setPlayerMode("mpv");
          } else if (isBrowserPlayable(resolvedMimetype)) {
            sp = new BrowserVideoPlayer(() => videoRef.current);
            setPlayerMode("browser-video");
          } else if (mobile) {
            sp = new ExternalStreamPlayer();
            setPlayerMode("external");
          } else {
            sp = new DesktopPromptPlayer();
            setPlayerMode("desktop-prompt");
          }

          playerRef.current = sp;

          if (tauri) {
            await init(MPV_CONFIG);
            if (cancelled) return;
            unlistenRef.current = await observeProperties(
              OBSERVED_PROPERTIES,
              (ev) => mpvHandlerRef.current(ev),
            );
          }
        }

        if (sp.type === "desktop-prompt") return;
        if (cancelled) return;

        const savedPos = resumePositionRef.current;
        const resumeAt =
          !isSwitch && sp.supportsResume && savedPos > 30 ? savedPos : undefined;

        if (resumeAt !== undefined) {
          onResumeToastRef.current(`Resumed from ${formatTime(resumeAt)}`);
        }

        await sp.loadFile(resolvedUrl as string, resumeAt);
      } catch {
        // Playback errors surface via mpv/HTML5 events or are swallowed (best-effort)
      }
    }

    setup();
    return () => { cancelled = true; };
  // resolvedUrl is the primary trigger; loadState gates the initial run
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUrl, loadState]);

  // Destroy player and exit fullscreen on unmount
  useEffect(() => {
    return () => {
      unlistenRef.current?.();
      const sp = playerRef.current;
      if (sp?.type === "embedded") {
        destroy().catch(() => {});
      } else {
        sp?.destroy?.();
      }
      if (isFullscreenRef.current) {
        isFullscreenRef.current = false;
        if (isTauri()) {
          getCurrentWindow().setFullscreen(false).catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
  }, []);

  async function handleFullscreen() {
    const next = !isFullscreenRef.current;
    isFullscreenRef.current = next;
    setIsFullscreen(next);
    if (isTauri()) {
      await getCurrentWindow().setFullscreen(next).catch(() => {});
    } else if (next) {
      await document.documentElement.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }

  return { playerMode, isFullscreen, handleFullscreen };
}

import { command } from "tauri-plugin-libmpv-api";
import Hls from "hls.js";

export type StreamPlayerType = "embedded" | "external" | "browser-video" | "hls" | "desktop-prompt";

export interface StreamPlayerService {
  type: StreamPlayerType;
  supportsResume: boolean;
  loadFile(url: string, startPositionSecs?: number): Promise<void>;
  destroy?(): void;
}

export function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export function isMobileBrowser(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    /Android/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isBrowserPlayable(mimetype: string | undefined): boolean {
  if (!mimetype) return false;
  const v = document.createElement("video");
  const result = v.canPlayType(mimetype);
  return result === "probably" || result === "maybe";
}

export class MpvStreamPlayer implements StreamPlayerService {
  type = "embedded" as const;
  supportsResume = true;

  async loadFile(url: string, startPositionSecs?: number): Promise<void> {
    if (startPositionSecs !== undefined) {
      await command("loadfile", [url, "replace", "0", `start=${Math.floor(startPositionSecs)}`]);
    } else {
      await command("loadfile", [url]);
    }
  }
}

export class ExternalStreamPlayer implements StreamPlayerService {
  type = "external" as const;
  supportsResume = false;

  async loadFile(url: string): Promise<void> {
    window.location.href = `vlc://${url.replace(/^https?:\/\//, "")}`;
  }
}

export class BrowserVideoPlayer implements StreamPlayerService {
  type = "browser-video" as const;
  supportsResume = true;

  constructor(private getEl: () => HTMLVideoElement | null) {}

  private el(): HTMLVideoElement {
    const el = this.getEl();
    if (!el) throw new Error("Video element not mounted");
    return el;
  }

  async loadFile(url: string, startPositionSecs?: number): Promise<void> {
    const videoEl = this.el();
    videoEl.src = url;
    videoEl.load();
    if (startPositionSecs !== undefined) {
      await new Promise<void>((resolve) => {
        const onMetadata = () => {
          videoEl.currentTime = startPositionSecs;
          resolve();
        };
        videoEl.addEventListener("loadedmetadata", onMetadata, { once: true });
      });
    }
    await videoEl.play();
  }

  destroy(): void {
    const videoEl = this.getEl();
    if (!videoEl) return;
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
  }
}

export class HlsStreamPlayer implements StreamPlayerService {
  type = "hls" as const;
  supportsResume = true;
  private hls: Hls | null = null;

  constructor(private getEl: () => HTMLVideoElement | null) {}

  private el(): HTMLVideoElement {
    const el = this.getEl();
    if (!el) throw new Error("Video element not mounted");
    return el;
  }

  async loadFile(url: string, startPositionSecs?: number): Promise<void> {
    this.hls?.destroy();
    this.hls = null;

    const videoEl = this.el();

    // Native HLS (Safari)
    if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = url;
      videoEl.load();
      if (startPositionSecs !== undefined) {
        await new Promise<void>((resolve) => {
          videoEl.addEventListener("loadedmetadata", () => {
            videoEl.currentTime = startPositionSecs;
            resolve();
          }, { once: true });
        });
      }
      await videoEl.play();
      return;
    }

    if (!Hls.isSupported()) {
      throw new Error("HLS is not supported on this browser");
    }

    const hls = new Hls({ startPosition: startPositionSecs ?? -1 });
    this.hls = hls;
    hls.loadSource(url);
    hls.attachMedia(videoEl);

    await new Promise<void>((resolve, reject) => {
      hls.once(Hls.Events.MANIFEST_PARSED, () => {
        this.el().play().then(resolve).catch(reject);
      });
      hls.once(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) reject(new Error(`HLS error: ${data.details}`));
      });
    });
  }

  destroy(): void {
    this.hls?.destroy();
    this.hls = null;
    const videoEl = this.getEl();
    if (!videoEl) return;
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
  }
}

export class DesktopPromptPlayer implements StreamPlayerService {
  type = "desktop-prompt" as const;
  supportsResume = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async loadFile(_url: string): Promise<void> {
    // no-op: PlayerPage renders the "use desktop app" prompt
  }
}

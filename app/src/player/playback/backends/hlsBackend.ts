import Hls from "hls.js";
import type { PlaybackBackend } from "../PlaybackBackend";

/**
 * Web backend: plays HLS (m3u8) in a <video> element via hls.js, or natively on
 * Safari. Supports re-loading a fresh url at the current position, which the
 * session uses when the user switches audio/subtitle/resolution (each produces a
 * new TorBox hls_url).
 */
export class HlsBackend implements PlaybackBackend {
  readonly kind = "hls" as const;
  readonly supportsResume = true;
  private hls: Hls | null = null;

  constructor(
    private getEl: () => HTMLVideoElement | null,
    private onFatalError?: () => void,
  ) {}

  private el(): HTMLVideoElement {
    const el = this.getEl();
    if (!el) throw new Error("Video element not mounted");
    return el;
  }

  async load(url: string, startPositionSecs?: number): Promise<void> {
    this.hls?.destroy();
    this.hls = null;
    const video = this.el();

    // Native HLS (Safari / iOS).
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.load();
      if (startPositionSecs !== undefined) {
        await new Promise<void>((resolve) => {
          video.addEventListener(
            "loadedmetadata",
            () => {
              video.currentTime = startPositionSecs;
              resolve();
            },
            { once: true },
          );
        });
      }
      await video.play().catch(() => {});
      return;
    }

    if (!Hls.isSupported()) {
      throw new Error("HLS is not supported in this browser");
    }

    // TorBox transcodes on-demand; early segments return 408 while the encoder
    // catches up. Give hls.js enough retries to ride out that warm-up window.
    const hls = new Hls({
      startPosition: startPositionSecs ?? -1,
      fragLoadPolicy: {
        default: {
          maxTimeToFirstByteMs: 30_000,
          maxLoadTimeMs: 60_000,
          timeoutRetry: { maxNumRetry: 12, retryDelayMs: 1_000, maxRetryDelayMs: 8_000 },
          errorRetry:   { maxNumRetry: 8,  retryDelayMs: 1_000, maxRetryDelayMs: 8_000 },
        },
      },
    });
    this.hls = hls;
    hls.loadSource(url);
    hls.attachMedia(video);

    let manifested = false;
    await new Promise<void>((resolve, reject) => {
      // Persistent error handler: pre-manifest errors reject (try next source),
      // post-manifest fatal errors call onFatalError so the session can advance.
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (!manifested) {
          reject(new Error(`HLS error: ${data.details}`));
        } else {
          this.onFatalError?.();
        }
      });
      hls.once(Hls.Events.MANIFEST_PARSED, () => {
        manifested = true;
        video.play().then(resolve).catch(resolve);
      });
    });
  }

  destroy(): void {
    this.hls?.destroy();
    this.hls = null;
    const video = this.getEl();
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

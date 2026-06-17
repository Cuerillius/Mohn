import type { PlaybackBackend } from "../PlaybackBackend";

/** Mobile-web backend: hands the stream off to an external player (VLC). */
export class ExternalBackend implements PlaybackBackend {
  readonly kind = "external" as const;
  readonly supportsResume = false;

  async load(url: string): Promise<void> {
    const vlcUrl = `vlc://${url.replace(/^https?:\/\//, "")}`;
    const a = document.createElement("a");
    a.href = vlcUrl;
    a.style.cssText = "display:none;position:fixed";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  }

  destroy(): void {}
}

import {
  command,
  init,
  observeProperties,
  destroy as destroyMpv,
} from "tauri-plugin-libmpv-api";
import type { MpvObservableProperty, MpvConfig } from "tauri-plugin-libmpv-api";
import type { PlaybackBackend } from "../PlaybackBackend";

// mpv property + config — carried over verbatim from the proven desktop player.
export const MPV_OBSERVED_PROPERTIES = [
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
  observedProperties: MPV_OBSERVED_PROPERTIES,
};

export type MpvPropertyEvent = { name: string; data: unknown };

/**
 * Desktop backend backed by embedded libmpv via the Tauri plugin. Initialises
 * mpv and forwards observed-property events to `onProperty`.
 */
export class MpvBackend implements PlaybackBackend {
  readonly kind = "file" as const;
  readonly supportsResume = true;
  private unlisten: (() => void) | null = null;
  private ready: Promise<void> | null = null;

  constructor(private onProperty: (ev: MpvPropertyEvent) => void) {}

  private async ensureInit(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      await init(MPV_CONFIG);
      this.unlisten = await observeProperties(MPV_OBSERVED_PROPERTIES, (ev) =>
        this.onProperty(ev),
      );
    })();
    return this.ready;
  }

  async load(url: string, startPositionSecs?: number): Promise<void> {
    await this.ensureInit();
    if (startPositionSecs !== undefined) {
      await command("loadfile", [
        url,
        "replace",
        "0",
        `start=${Math.floor(startPositionSecs)}`,
      ]);
    } else {
      await command("loadfile", [url]);
    }
  }

  destroy(): void {
    this.unlisten?.();
    this.unlisten = null;
    this.ready = null;
    destroyMpv().catch(() => {});
  }
}

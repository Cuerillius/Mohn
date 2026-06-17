import type { PlaybackKind } from "../types";

/** A media backend that can load and play a resolved URL. */
export interface PlaybackBackend {
  readonly kind: PlaybackKind | "external" | "prompt";
  /** Whether this backend can resume from a saved position. */
  readonly supportsResume: boolean;
  /** Load (and start playing) a url, optionally seeking to startPositionSecs. */
  load(url: string, startPositionSecs?: number): Promise<void>;
  /** Tear down. Safe to call multiple times. */
  destroy(): void;
}

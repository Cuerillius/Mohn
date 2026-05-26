import { command, setProperty } from "tauri-plugin-libmpv-api";

export type StreamPlayerType = "embedded" | "external";

export interface StreamPlayerService {
  type: StreamPlayerType;
  /** Whether the service can honour a start-position on load. */
  supportsResume: boolean;
  /**
   * Load and start playing a URL.
   * @param startPositionSecs - seconds to seek to on load; ignored when supportsResume is false.
   */
  loadFile(url: string, startPositionSecs?: number): Promise<void>;
}

class MpvStreamPlayer implements StreamPlayerService {
  type = "embedded" as const;
  supportsResume = true;

  async loadFile(url: string, startPositionSecs?: number): Promise<void> {
    if (startPositionSecs !== undefined) {
      await setProperty("options/start", String(Math.floor(startPositionSecs)));
    }
    await command("loadfile", [url]);
    await setProperty("options/start", "none");
  }
}

class ExternalStreamPlayer implements StreamPlayerService {
  type = "external" as const;
  supportsResume = false;

  async loadFile(url: string): Promise<void> {
    // vlc:// strips the protocol — iOS hands the URL to VLC
    window.location.href = `vlc://${url.replace(/^https?:\/\//, "")}`;
  }
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad Pro reports MacIntel with touch points > 1
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function createStreamPlayer(): StreamPlayerService {
  if (isIos()) return new ExternalStreamPlayer();
  return new MpvStreamPlayer();
}

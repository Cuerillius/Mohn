import type { Source, TrackInfo } from "@/player/types";
import type { Platform } from "@/player/platform";

export type Section = "Subtitles" | "Audio" | "Quality" | "Source";
export const SECTIONS: Section[] = ["Subtitles", "Audio", "Quality", "Source"];

/**
 * View-model produced by the orchestrating `Player` and consumed by the platform
 * components (`PlayerDesktop`/`PlayerWeb`), `Controls`, and `Sidepanel`. It is the
 * lean equivalent of the old `PlayerSnapshot`.
 */
export interface PlayerVM {
  platform: Platform;

  // playback
  paused: boolean;
  timePos: number;
  duration: number;
  volume: number;
  muted: boolean;
  buffered: number;
  isBuffering: boolean;
  isFullscreen: boolean;
  switching: boolean;

  // tracks
  audioTracks: TrackInfo[];
  subtitleTracks: TrackInfo[];
  currentAid: string;
  currentSid: string;

  // sources
  sources: Source[];
  selected: Source | null;
  switchingTo: Source | null;
  quality: { options: string[]; current: string };

  // handlers
  onPlayPause: () => void;
  onSeekRelative: (delta: number) => void;
  onSeekTo: (t: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onSetAudio: (id: string) => void;
  onSetSubtitle: (id: string) => void;
  onSelectQuality: (label: string) => void;
  onSelectSource: (s: Source) => void;
  onFullscreen: () => void;

  // sidepanel
  sidepanelOpen: boolean;
  activeSection: Section;
  onSectionToggle: (section: Section) => void;
  onCloseSidepanel: () => void;
}

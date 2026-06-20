import Controls from "./Controls";
import type { PlayerVM } from "./types";

/**
 * Desktop surface. libmpv renders into the transparent Tauri window behind the
 * DOM, so there's no media element here — just the controls overlay.
 */
export default function PlayerDesktop({
  vm,
  controlsVisible,
}: {
  vm: PlayerVM;
  controlsVisible: boolean;
}) {
  return <Controls vm={vm} visible={controlsVisible} />;
}

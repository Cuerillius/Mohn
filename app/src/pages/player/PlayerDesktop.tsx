import Controls from "./Controls";
import type { PlayerVM } from "./types";

export default function PlayerDesktop({
  vm,
  controlsVisible,
}: {
  vm: PlayerVM;
  controlsVisible: boolean;
}) {
  return <Controls vm={vm} visible={controlsVisible} />;
}

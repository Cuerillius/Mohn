import Controls from "./Controls";
import type { PlayerVM } from "./types";

export default function PlayerWeb({
  vm,
  controlsVisible,
  videoRef,
}: {
  vm: PlayerVM;
  controlsVisible: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 size-full bg-black object-contain"
        playsInline
      />
      <Controls vm={vm} visible={controlsVisible} />
    </>
  );
}

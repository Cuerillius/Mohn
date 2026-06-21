import { ArrowLeft, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import LoadingSteps, { type LoadStep } from "@/components/MultiStepLoader";

interface Props {
  switching: boolean;
  isPlaying: boolean;
  showLoading: boolean;
  loadStep: LoadStep;
  error: string | null;
  hasSources: boolean;
  onBrowseSources: () => void;
  goBack: () => void;
}

/** The stacked overlays shown over the video: switching, loading, and error. */
export default function PlayerOverlays({
  switching,
  isPlaying,
  showLoading,
  loadStep,
  error,
  hasSources,
  onBrowseSources,
  goBack,
}: Props) {
  return (
    <>
      {/* Switching overlay */}
      {switching && isPlaying && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader className="size-7 animate-spin text-white/80" />
            <p className="text-sm text-white/80">Switching source…</p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {showLoading && <LoadingSteps current={loadStep} />}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center ">
          <div className="flex w-full max-w-md flex-col gap-7">
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                Can't play this title
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {error}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {hasSources && (
                <Button
                  variant="outline"
                  onClick={onBrowseSources}
                  className="w-full"
                >
                  Browse sources
                </Button>
              )}
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

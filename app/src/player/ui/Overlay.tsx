import {
  AppWindow,
  ArrowLeft,
  Crown,
  Download,
  ExternalLink,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionStatus } from "../session/usePlayerSession";

const DOWNLOAD_URL = "https://cyri.li";
const TORBOX_UPGRADE_URL = "https://torbox.app/subscription";

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-6">
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-7 rounded-2xl border border-border bg-background p-8 shadow-2xl">
      {children}
    </div>
  );
}

export interface OverlayProps {
  status: SessionStatus;
  onRetry: () => void;
  onBrowseSources: () => void;
  onSkip: () => void;
  onBack: () => void;
}

/**
 * Blocking / transient overlays. Returns null for the playing ("none") state and
 * lets the controls show through.
 */
export default function Overlay({
  status,
  onRetry,
  onBrowseSources,
  onSkip,
  onBack,
}: OverlayProps) {
  switch (status.kind) {
    case "none":
      return null;

    case "gating":
    case "loading":
      return (
        <Backdrop>
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader className="size-8 animate-spin text-foreground/70" />
            <p className="text-sm text-muted-foreground">
              {status.kind === "loading" ? status.message : "Checking your TorBox plan…"}
            </p>
          </div>
        </Backdrop>
      );

    case "switching":
      return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader className="size-7 animate-spin text-white/80" />
            <p className="text-sm text-white/80">Trying another source…</p>
          </div>
        </div>
      );

    case "stalled":
      return (
        <div className="absolute left-1/2 top-6 z-40 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full bg-black/80 px-4 py-2 text-xs text-white/90">
            <Loader className="size-3.5 animate-spin" />
            Stream stalled
            <button
              onClick={onSkip}
              className="rounded-full bg-white/15 px-2.5 py-1 font-medium hover:bg-white/25 transition-colors cursor-pointer"
            >
              Skip source
            </button>
          </div>
        </div>
      );

    case "external":
      return (
        <Backdrop>
          <Card>
            <div className="flex flex-col items-center gap-3 text-center">
              <ExternalLink className="size-8 text-foreground/70" />
              <h2 className="text-xl font-semibold tracking-tight">Opening external player</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We handed this stream off to your external player (VLC). If nothing
                happened, make sure it's installed.
              </p>
            </div>
            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </Card>
        </Backdrop>
      );

    case "needs-upgrade":
      return (
        <Backdrop>
          <Card>
            <div className="flex flex-col gap-1.5">
              <div className="mb-1 flex items-center gap-3">
                <img
                  src="/torbox.png"
                  alt="TorBox"
                  className="size-9 shrink-0 rounded-xl object-contain"
                />
                <h2 className="text-xl font-semibold tracking-tight">
                  Browser streaming needs Pro
                </h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Streaming in the browser uses TorBox's HLS transcoding, which is a
                Pro-only feature. Upgrade your plan, or use the desktop app to play
                any source with no plan requirement.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.open(TORBOX_UPGRADE_URL, "_blank", "noreferrer")}
                className="w-full"
              >
                <Crown className="size-4" />
                Upgrade to Pro
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(DOWNLOAD_URL, "_blank", "noreferrer")}
                className="w-full"
              >
                <Download className="size-4" />
                Download the desktop app
              </Button>
              <Button variant="ghost" onClick={onBack} className="w-full">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
          </Card>
        </Backdrop>
      );

    case "error":
      return (
        <Backdrop>
          <Card>
            <div className="flex flex-col items-center gap-3 text-center">
              <AppWindow className="size-8 text-foreground/70" />
              <h2 className="text-xl font-semibold tracking-tight">Can't play this title</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{status.message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={onRetry} className="w-full">
                Try again
              </Button>
              {status.canBrowse && (
                <Button variant="outline" onClick={onBrowseSources} className="w-full">
                  Browse sources
                </Button>
              )}
              <Button variant="ghost" onClick={onBack} className="w-full">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
          </Card>
        </Backdrop>
      );
  }
}

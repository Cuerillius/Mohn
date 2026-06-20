import { Check, Loader } from "lucide-react";

export type LoadStep = "lookup" | "search" | "cache" | "prepare" | "start";

const LOAD_STEPS: { key: LoadStep; label: string }[] = [
  { key: "lookup", label: "Looking up title" },
  { key: "search", label: "Searching addons for sources" },
  { key: "cache", label: "Checking cached availability" },
  { key: "prepare", label: "Preparing the stream" },
  { key: "start", label: "Starting playback" },
];

export default function LoadingSteps({ current }: { current: LoadStep }) {
  const idx = LOAD_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
      <ul className="flex w-full max-w-xs flex-col gap-3.5">
        {LOAD_STEPS.map((step, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center">
                {done ? (
                  <Check className="size-4 text-emerald-400" />
                ) : active ? (
                  <Loader className="size-4 animate-spin text-foreground/80" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </span>
              <span
                className={`text-sm transition-colors ${
                  done
                    ? "text-muted-foreground"
                    : active
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

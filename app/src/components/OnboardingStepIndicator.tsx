import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function StepIndicator({ current }: { current: number }) {
  const steps = ["TorBox", "Addons", "Profiles"];
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-background border px-3 py-2">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full transition-all">
              <div
                className={cn(
                  "size-4 rounded-full flex items-center justify-center transition-all",
                  done
                    ? "bg-foreground"
                    : active
                      ? "bg-foreground/20 ring-1 ring-foreground/40"
                      : "bg-foreground/8",
                )}
              >
                {done ? (
                  <Check className="size-2.5 text-background" />
                ) : (
                  <span
                    className={cn(
                      "text-[9px] font-bold",
                      active ? "text-foreground" : "text-foreground/30",
                    )}
                  >
                    {idx}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : done
                      ? "text-foreground/50"
                      : "text-foreground/25",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-4 h-px mx-0.5",
                  done ? "bg-foreground/30" : "bg-foreground/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

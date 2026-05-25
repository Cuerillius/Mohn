import { Check, Loader } from "lucide-react";

interface Step {
  title: string;
  description: string;
}

export default function MultiStepLoader({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: Step[];
}) {
  return (
    <div className="w-full max-w-md">
      {steps.map((step, index) => {
        const isCompleted = currentStep > index;
        const isActive = currentStep === index;

        return (
          <div key={index} className="relative pb-8 pl-12 last:pb-0">
            {index !== steps.length - 1 && (
              <div
                className={`absolute left-3.75 top-8 bottom-0 w-0.5 -translate-x-1/2 rounded-full transition-colors duration-300 ${
                  isCompleted ? "bg-white/30" : "bg-accent"
                }`}
              />
            )}

            <div
              className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                isCompleted
                  ? "bg-white/30 text-white"
                  : isActive
                    ? "bg-white text-black"
                    : "bg-accent text-white"
              }`}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : isActive ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                index + 1
              )}
            </div>

            <div className="flex flex-col pt-1.5">
              <span
                className={`text-sm font-semibold transition-colors duration-300 ${
                  isActive
                    ? "text-white"
                    : isCompleted
                      ? "text-white/70"
                      : "text-white/40"
                }`}
              >
                {step.title}
              </span>
              <span className="text-sm text-white/40 mt-0.5">
                {step.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

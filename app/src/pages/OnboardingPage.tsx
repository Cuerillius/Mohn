import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import {
  StepAddons,
  StepProfiles,
  StepTorBox,
} from "@/components/OnboardingSteps";
import { StepIndicator } from "@/components/OnboardingStepIndicator";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { onboardingStep, setOnboardingStep } = useSettings();
  const step = onboardingStep >= 1 && onboardingStep <= 3 ? onboardingStep : 1;

  const goToStep = (n: number) => setOnboardingStep(n);

  const handleFinish = () => {
    setOnboardingStep(-1);
    navigate("/profile");
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12 overflow-hidden">
      <img
        src="/bare-poppy-left.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 bottom-0 h-1/2 w-64 object-cover object-right opacity-15"
        style={{ maskImage: "linear-gradient(to right, black 50%, transparent 100%), linear-gradient(to top, black 65%, transparent 100%)", maskComposite: "intersect" }}
      />
      <img
        src="/bare-poppy-right.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 h-3/4 w-124 object-cover object-left opacity-15"
        style={{ maskImage: "linear-gradient(to left, black 50%, transparent 100%)", maskComposite: "intersect" }}
      />
      <div className="flex flex-col items-center gap-4">
        <img src="/mohn.svg" alt="Mohn" className="size-16" />
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Mohn</h1>
        <StepIndicator current={step} />
      </div>

      <div className="w-full max-w-md">
        {step === 1 && <StepTorBox onNext={() => goToStep(2)} />}
        {step === 2 && <StepAddons onNext={() => goToStep(3)} />}
        {step === 3 && <StepProfiles onFinish={handleFinish} />}
      </div>
    </div>
  );
}

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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
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

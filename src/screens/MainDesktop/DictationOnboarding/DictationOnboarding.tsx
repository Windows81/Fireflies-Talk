import { useLocalSettings } from "@/features/settings";
import {
  releaseOnboardingCapture,
  setDictationInAppCapture,
} from "@/hooks/dictationInAppCapture";
import { useCallback, useEffect, type FC } from "react";
import { CaptureStep } from "./steps/CaptureStep";
import { HandsFreeStep } from "./steps/HandsFreeStep";
import { LanguageStep } from "./steps/LanguageStep";
import { MicTestStep } from "./steps/MicTestStep";
import { PermissionsStep } from "./steps/PermissionsStep";
import { ShortcutStep } from "./steps/ShortcutStep";
import { SpeedResultStep } from "./steps/SpeedResultStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import type { DictationOnboardingStep } from "./progress";
import { useDictationOnboardingProgress } from "./progress.store";
import { useOnboardingPermissions } from "./useOnboardingPermissions";

/** Steps where the user dictates, or has just seen the result of doing so. */
const PILL_STEPS: DictationOnboardingStep[] = [
  "capture",
  "hands-free",
  "speed-result",
];

interface DictationOnboardingProps {
  onComplete: () => void;
}

export const DictationOnboarding: FC<DictationOnboardingProps> = ({
  onComplete,
}) => {
  const step = useDictationOnboardingProgress((s) => s.step);
  const setStep = useDictationOnboardingProgress((s) => s.setStep);
  const spokenWpm = useDictationOnboardingProgress((s) => s.spokenWpm);
  const setSpokenWpm = useDictationOnboardingProgress((s) => s.setSpokenWpm);
  const finish = useDictationOnboardingProgress((s) => s.finish);
  const permissions = useOnboardingPermissions();
  const { bothGranted } = permissions;
  const { showDictationPill } = useLocalSettings();

  const handleHandsFreeNext = useCallback(
    (wpm: number | null) => {
      setSpokenWpm(wpm);
      setStep("speed-result");
    },
    [setSpokenWpm, setStep],
  );

  // The overlay owns the Talk key for its whole life. Without this, a hold on
  // welcome or the mic test would paste into the app behind Fireflies.
  useEffect(() => {
    useDictationOnboardingProgress.getState().begin("dictation-tab");
    setDictationInAppCapture(true);
    return () => {
      releaseOnboardingCapture(() =>
        window.electron?.dictation?.requestCancel?.(),
      );
    };
  }, []);

  // The pill has nothing to say until a step actually asks for dictation, and
  // seeing it react to the shortcut test is confusing. From the first demo on
  // it stays up, because the user is dictating for real from there.
  useEffect(() => {
    const dictates = PILL_STEPS.includes(step);
    window.electron?.dictation?.setPillVisible?.(dictates && showDictationPill);
  }, [step, showDictationPill]);

  // Only once onboarding is over does the pill go back to following the user's
  // own preference full-time. Read at teardown rather than captured, so this
  // runs on the way out and not on every step change.
  useEffect(
    () => () => {
      window.electron?.dictation?.setPillVisible?.(
        useLocalSettings.getState().showDictationPill,
      );
    },
    [],
  );

  // With both permissions already granted the screen has nothing to ask for.
  // Skipped in both directions, otherwise Back off the language step would land
  // on it and bounce straight forward again.
  const goToPermissions = useCallback(
    (skipTo: DictationOnboardingStep) =>
      setStep(bothGranted ? skipTo : "permissions"),
    [bothGranted, setStep],
  );

  const handleDismiss = () => {
    finish("dismissed");
    onComplete();
  };

  const handleComplete = () => {
    finish("completed");
    onComplete();
  };

  const handleWelcomeNext = () => goToPermissions("language");
  const handlePermissionsNext = () => setStep("language");
  const handlePermissionsBack = () => setStep("welcome");
  const handleLanguageNext = () => setStep("mic-test");
  const handleLanguageBack = () => goToPermissions("welcome");
  const handleMicTestBack = () => setStep("language");

  switch (step) {
    case "welcome":
      return <WelcomeStep onNext={handleWelcomeNext} onClose={handleDismiss} />;
    case "permissions":
      return (
        <PermissionsStep
          permissions={permissions}
          onNext={handlePermissionsNext}
          onBack={handlePermissionsBack}
        />
      );
    case "language":
      return (
        <LanguageStep
          onNext={handleLanguageNext}
          onBack={handleLanguageBack}
          onClose={handleDismiss}
        />
      );
    case "mic-test":
      return (
        <MicTestStep
          onNext={() => setStep("shortcut")}
          onBack={handleMicTestBack}
        />
      );
    case "shortcut":
      return (
        <ShortcutStep
          onComplete={() => setStep("capture")}
          onBack={() => setStep("mic-test")}
        />
      );
    case "capture":
      return (
        <CaptureStep
          onComplete={() => setStep("hands-free")}
          onBack={() => setStep("shortcut")}
        />
      );
    case "hands-free":
      return (
        <HandsFreeStep
          onNext={handleHandsFreeNext}
          onClose={handleDismiss}
          onBack={() => setStep("capture")}
        />
      );
    case "speed-result":
      return (
        <SpeedResultStep spokenWpm={spokenWpm} onComplete={handleComplete} />
      );
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
};

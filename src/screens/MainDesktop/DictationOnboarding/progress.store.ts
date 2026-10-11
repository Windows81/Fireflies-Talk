import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useLocalSettings } from "@/features/settings";
import { storage } from "@/features/storage";
import { tracker } from "@/tracking";
import {
  DEFAULT_DICTATION_ONBOARDING_STEP,
  migrateDictationOnboardingStep,
  type DictationOnboardingStep,
} from "./progress";
import {
  beginRun,
  buildTalkOnboardingChoices,
  endRun,
  reachStep,
  type TalkOnboardingEntryPoint,
  type TalkOnboardingOutcome,
  type TalkOnboardingRun,
} from "./tracking";

interface DictationOnboardingProgressStore {
  step: DictationOnboardingStep;
  spokenWpm: number | null;
  run: TalkOnboardingRun | null;
  runCount: number;
  /** The language step seeded the hints from the account once; never again. */
  languagePrefilled: boolean;
  setStep: (step: DictationOnboardingStep) => void;
  markLanguagePrefilled: () => void;
  setSpokenWpm: (spokenWpm: number | null) => void;
  begin: (entryPoint: TalkOnboardingEntryPoint) => void;
  finish: (outcome: TalkOnboardingOutcome) => void;
  reset: () => void;
}

const currentChoices = (spokenWpm: number | null) => {
  const settings = useLocalSettings.getState();

  return buildTalkOnboardingChoices({
    languageHints: settings.dictationLanguageHints,
    microphoneDeviceId: settings.dictationMicrophone.deviceId,
    shortcut: settings.dictationShortcut,
    platform: globalThis.window?.electron?.platform ?? "darwin",
    spokenWpm,
  });
};

export const useDictationOnboardingProgress = create(
  persist<DictationOnboardingProgressStore>(
    (set, get) => ({
      step: DEFAULT_DICTATION_ONBOARDING_STEP,
      spokenWpm: null,
      run: null,
      runCount: 0,
      languagePrefilled: false,
      markLanguagePrefilled: () => set({ languagePrefilled: true }),
      setStep: (step: DictationOnboardingStep) => {
        const { run, spokenWpm } = get();

        if (run === null) {
          set({ step });
          return;
        }

        const reached = reachStep(run, step, currentChoices(spokenWpm));

        for (const [eventName, properties] of reached.calls) {
          tracker.track(eventName, properties);
        }

        set({ step, run: reached.run });
      },
      setSpokenWpm: (spokenWpm: number | null) => set({ spokenWpm }),
      begin: (entryPoint: TalkOnboardingEntryPoint) => {
        const { run, runCount, step, spokenWpm } = get();

        if (run !== null) return;

        const nextCount = runCount + 1;

        const started = beginRun({
          runId: globalThis.crypto.randomUUID(),
          runIndex: nextCount,
          entryPoint,
          step,
          choices: currentChoices(spokenWpm),
        });

        for (const [eventName, properties] of started.calls) {
          tracker.track(eventName, properties);
        }

        set({ run: started.run, runCount: nextCount });
      },
      finish: (outcome: TalkOnboardingOutcome) => {
        const { run, step, spokenWpm } = get();

        if (run === null) return;

        const [eventName, properties] = endRun(
          run,
          step,
          outcome,
          currentChoices(spokenWpm),
        );

        tracker.track(eventName, properties);
        set({ run: null });
      },
      reset: () =>
        set({
          step: DEFAULT_DICTATION_ONBOARDING_STEP,
          spokenWpm: null,
          run: null,
        }),
    }),
    {
      name: "dictation-onboarding-progress",
      storage: createJSONStorage(() => storage),
      version: 2,
      migrate: (persisted, version) => {
        // SAFETY: persist rehydrates the JSON this store wrote.
        const state = persisted as DictationOnboardingProgressStore;
        const step = migrateDictationOnboardingStep(state.step, version);

        if (version < 2) return { ...state, step, run: null, runCount: 0 };

        return { ...state, step };
      },
    },
  ),
);

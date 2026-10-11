import {
  defaultDictationBinding,
  dictationBindingsEqual,
  normalizeDictationBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";
import { SYSTEM_DEFAULT_MICROPHONE_ID } from "@/hooks/dictationMicrophone";
import { TRACKING_EVENTS } from "@/tracking/trackingEvents";
import {
  DICTATION_ONBOARDING_STEPS,
  type DictationOnboardingStep,
} from "./progress";
import { onboardingShortcutLabel } from "./shortcutCopy";
import { isFasterThanTyping } from "./speakingSpeed";

export type TalkOnboardingEntryPoint =
  | "dictation-tab"
  | "get-onboarded"
  | "pill-teaser"
  | "talk-intro-banner";

export type TalkOnboardingOutcome = "completed" | "dismissed";

export interface TalkOnboardingRun {
  runId: string;
  runIndex: number;
  entryPoint: TalkOnboardingEntryPoint;
  seenSteps: DictationOnboardingStep[];
}

export type TalkOnboardingChoices = {
  languageHints: string;
  autoDetectLanguage: boolean;
  usesSystemDefaultMicrophone: boolean;
  shortcut: string;
  shortcutIsDefault: boolean;
  spokenWpm: number | null;
  fasterThanTyping: boolean;
};

type TalkOnboardingRunProperties = {
  runId: string;
  runIndex: number;
  entryPoint: TalkOnboardingEntryPoint;
};

export type TalkOnboardingStartedProperties = TalkOnboardingRunProperties & {
  stepName: DictationOnboardingStep;
};

export type TalkOnboardingStepProperties = TalkOnboardingRunProperties &
  TalkOnboardingChoices & {
    stepName: DictationOnboardingStep;
    autoSkipped: boolean;
  };

export type TalkOnboardingEndedProperties = TalkOnboardingRunProperties &
  TalkOnboardingChoices & {
    stepName: DictationOnboardingStep;
    outcome: TalkOnboardingOutcome;
  };

export type TalkOnboardingTrackCall =
  | [
      TRACKING_EVENTS.DESKTOP_TALK_ONBOARDING_STARTED,
      TalkOnboardingStartedProperties,
    ]
  | [TRACKING_EVENTS.DESKTOP_TALK_ONBOARDING_STEP, TalkOnboardingStepProperties]
  | [
      TRACKING_EVENTS.DESKTOP_TALK_ONBOARDING_ENDED,
      TalkOnboardingEndedProperties,
    ];

export type TalkOnboardingRunResult = {
  run: TalkOnboardingRun;
  calls: TalkOnboardingTrackCall[];
};

export function buildTalkOnboardingChoices(args: {
  languageHints: string[];
  microphoneDeviceId: string;
  shortcut: DictationBinding;
  platform: string;
  spokenWpm: number | null;
}): TalkOnboardingChoices {
  const normalized = normalizeDictationBinding(args.shortcut, args.platform);

  return {
    languageHints: args.languageHints.join(","),
    autoDetectLanguage: args.languageHints.length === 0,
    usesSystemDefaultMicrophone:
      args.microphoneDeviceId === SYSTEM_DEFAULT_MICROPHONE_ID ||
      args.microphoneDeviceId === "",
    shortcut: onboardingShortcutLabel(args.shortcut, args.platform),
    shortcutIsDefault: dictationBindingsEqual(
      normalized,
      defaultDictationBinding(args.platform),
    ),
    spokenWpm: args.spokenWpm,
    fasterThanTyping:
      args.spokenWpm !== null && isFasterThanTyping(args.spokenWpm),
  };
}

function runProperties(run: TalkOnboardingRun): TalkOnboardingRunProperties {
  return {
    runId: run.runId,
    runIndex: run.runIndex,
    entryPoint: run.entryPoint,
  };
}

function stepCall(
  run: TalkOnboardingRun,
  stepName: DictationOnboardingStep,
  choices: TalkOnboardingChoices,
  autoSkipped: boolean,
): TalkOnboardingTrackCall {
  return [
    TRACKING_EVENTS.DESKTOP_TALK_ONBOARDING_STEP,
    { ...runProperties(run), ...choices, stepName, autoSkipped },
  ];
}

function skippedStepsBetween(
  seenSteps: DictationOnboardingStep[],
  step: DictationOnboardingStep,
): DictationOnboardingStep[] {
  const furthest = Math.max(
    ...seenSteps.map((seen) => DICTATION_ONBOARDING_STEPS.indexOf(seen)),
  );

  const target = DICTATION_ONBOARDING_STEPS.indexOf(step);

  return DICTATION_ONBOARDING_STEPS.filter(
    (candidate, index) =>
      index > furthest && index < target && !seenSteps.includes(candidate),
  );
}

export function beginRun(args: {
  runId: string;
  runIndex: number;
  entryPoint: TalkOnboardingEntryPoint;
  step: DictationOnboardingStep;
  choices: TalkOnboardingChoices;
}): TalkOnboardingRunResult {
  const run: TalkOnboardingRun = {
    runId: args.runId,
    runIndex: args.runIndex,
    entryPoint: args.entryPoint,
    seenSteps: [args.step],
  };

  return {
    run,
    calls: [
      [
        TRACKING_EVENTS.DESKTOP_TALK_ONBOARDING_STARTED,
        { ...runProperties(run), stepName: args.step },
      ],
      stepCall(run, args.step, args.choices, false),
    ],
  };
}

export function reachStep(
  run: TalkOnboardingRun,
  step: DictationOnboardingStep,
  choices: TalkOnboardingChoices,
): TalkOnboardingRunResult {
  if (run.seenSteps.includes(step)) {
    return { run, calls: [] };
  }

  const skipped = skippedStepsBetween(run.seenSteps, step);
  const reported = [...skipped, step];

  const calls = reported.map((stepName, index) =>
    stepCall(run, stepName, choices, index < skipped.length),
  );

  return {
    run: { ...run, seenSteps: [...run.seenSteps, ...reported] },
    calls,
  };
}

export function endRun(
  run: TalkOnboardingRun,
  step: DictationOnboardingStep,
  outcome: TalkOnboardingOutcome,
  choices: TalkOnboardingChoices,
): TalkOnboardingTrackCall {
  return [
    TRACKING_EVENTS.DESKTOP_TALK_ONBOARDING_ENDED,
    {
      ...runProperties(run),
      ...choices,
      stepName: step,
      outcome,
    },
  ];
}

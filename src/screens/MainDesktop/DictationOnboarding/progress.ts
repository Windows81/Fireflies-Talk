import type { DesktopHomeTab } from "../components/DesktopHomeTabBar";

export const DICTATION_ONBOARDING_STEPS = [
  "welcome",
  "permissions",
  "language",
  "mic-test",
  "shortcut",
  "capture",
  "hands-free",
  "speed-result",
] as const;

export type DictationOnboardingStep =
  (typeof DICTATION_ONBOARDING_STEPS)[number];

export const DEFAULT_DICTATION_ONBOARDING_STEP: DictationOnboardingStep =
  "welcome";

const STEPS_AFTER_LANGUAGE = new Set<DictationOnboardingStep>([
  "mic-test",
  "shortcut",
  "capture",
  "hands-free",
  "speed-result",
]);

/** v0 sessions saved a later step before the language page existed. */
export function migrateDictationOnboardingStep(
  step: DictationOnboardingStep,
  version: number,
): DictationOnboardingStep {
  if (version >= 1) return step;
  if (STEPS_AFTER_LANGUAGE.has(step)) return "language";
  return step;
}

/** Permissions need a quit and relaunch, so that step comes back on its own. */
export function shouldResumeDictationOnboardingOnLaunch(opts: {
  enabled: boolean;
  completed: boolean;
  step: DictationOnboardingStep;
}): boolean {
  return opts.enabled && !opts.completed && opts.step === "permissions";
}

/** Whether the Dictation tab should open onboarding; finishing is what closes it. */
export function shouldShowDictationOnboarding(opts: {
  enabled: boolean;
  completed: boolean;
  dictationTabActive: boolean;
}): boolean {
  return opts.enabled && !opts.completed && opts.dictationTabActive;
}

/**
 * The Notetaker tab pitches Talk until the person has either finished its
 * onboarding, dictated something, or closed the banner themselves.
 */
export function shouldShowTalkIntroBanner(opts: {
  enabled: boolean;
  completed: boolean;
  dismissed: boolean;
  hasDictated: boolean;
}): boolean {
  return (
    opts.enabled && !opts.completed && !opts.dismissed && !opts.hasDictated
  );
}

/** Onboarding covers the whole home, so while it is open the tab is Dictation. */
export function resolveDesktopHomeTab(opts: {
  enabled: boolean;
  selectedTab: DesktopHomeTab;
  onboardingOpen: boolean;
}): DesktopHomeTab {
  if (!opts.enabled) return "notetaker";
  return opts.onboardingOpen ? "dictation" : opts.selectedTab;
}

export function isTalkFirstHome(opts: {
  installRef: string | null;
  dictationAvailable: boolean;
  notetakerOnboardingCompleted: boolean;
}): boolean {
  return (
    opts.installRef === "talk" &&
    opts.dictationAvailable &&
    !opts.notetakerOnboardingCompleted
  );
}

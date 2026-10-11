// The store module, not the barrel: the barrel also pulls in tracking and
// settings, which this leaf must not drag into everything that opens onboarding.
import {
  DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY,
  setLocalUserFlag,
} from "@/features/user-flags/store";
import { create } from "zustand";

interface DictationOnboardingOpenState {
  open: boolean;
}

/**
 * Module state rather than screen state because the desktop home screen is
 * mounted more than once (see consentSetupPrompt.store): coming back from the
 * Live window or Settings pushes a fresh copy that starts on the Notetaker tab.
 * That copy reads from here that onboarding is underway and shows it at the
 * saved step instead of the home page.
 */
export const useDictationOnboardingOpen = create<DictationOnboardingOpenState>(
  () => ({ open: false }),
);

/**
 * Opening the onboarding — from the Dictation tab, the "Try Talk" card, or a
 * resumed launch — is the moment the card has nothing left to introduce, so it
 * is retired for this installation here, whichever door the user came through.
 */
export function setDictationOnboardingOpen(open: boolean): void {
  useDictationOnboardingOpen.setState({ open });
  if (open) setLocalUserFlag(DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY, true);
}

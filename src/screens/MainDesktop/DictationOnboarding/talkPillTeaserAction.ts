import {
  DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY,
  setLocalUserFlag,
  userLocalUserFlagsStore,
} from "@/features/user-flags/store";
import { popToDesktopHome } from "@/screens/RootNavigation";
import type { DictationTeaserAction } from "electron/src/types";
import { setDictationOnboardingOpen } from "./open.store";
import { useDictationOnboardingProgress } from "./progress.store";
import { trackTalkTeaserAction } from "./talkPillTeaserTracking";

function isTalkTeaserDismissed(): boolean {
  return !!userLocalUserFlagsStore.getState().flags[
    DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY
  ];
}

/**
 * What the "Try Talk" card's Try and Close mean. The card stays on screen for
 * a moment after its first click, until the new presence reaches the desktop;
 * anything clicked in that gap is the same intent, not a second one, so only
 * the first action counts.
 */
export function handleTalkTeaserAction(action: DictationTeaserAction): void {
  if (isTalkTeaserDismissed()) return;
  trackTalkTeaserAction(action);
  if (action === "close") {
    setLocalUserFlag(DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY, true);
    return;
  }
  const progress = useDictationOnboardingProgress.getState();
  progress.reset();
  progress.begin("pill-teaser");
  // The onboarding renders inside the home screen, which may be parked behind
  // Settings or Live when the click arrives; opening it puts that screen on
  // the Dictation tab and retires the card. It is module state so whichever
  // copy is on top shows it.
  popToDesktopHome();
  setDictationOnboardingOpen(true);
}

import { useAuth } from "@/features/auth";
import {
  DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY,
  DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY,
  useDesktopLifecycleStore,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import {
  clearPendingMilestone,
  getLifetimeWords,
  getPendingMilestone,
  useDictationHistory,
} from "@/hooks/dictationHistory";
import { useIsDictationAvailable } from "@/hooks/useIsDictationAvailable";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDictationOnboardingOpen } from "./open.store";
import { showMilestoneShare } from "@/hooks/milestoneShare.store";
import { resolveTeaserContent } from "./milestoneNudge";
import {
  resolveTalkPillPresence,
  TALK_PILL_TEASER_INSTALL_DELAY_MS,
} from "./talkPillTeaser";
import { handleTalkTeaserAction } from "./talkPillTeaserAction";
import {
  trackMilestoneNudgeAction,
  trackMilestoneNudgeShown,
  trackTalkTeaserShown,
} from "./talkPillTeaserTracking";

/**
 * Tells the pill whether to introduce Talk with the "Try Talk" card, rest
 * interactive as usual, or stay out of sight, and acts on the card's Try and
 * Close. Lives at the app root of the main window rather than on a screen so
 * the decision keeps following the flag, the account, and the dictation
 * history while the window is minimized, hidden to the tray, or was never
 * shown at all: the pill and the card live outside it. The card is its own
 * window, so its clicks arrive through the desktop bridge; this hook is the
 * one place that decides what they mean.
 */
export function useTalkPillTeaser(): void {
  const flagOn = useIsDictationAvailable();
  const userId = useAuth((s) => s.user?.id);
  const onboardingDone = userLocalUserFlagsStore(
    (s) => !!s.flags[DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY],
  );
  const dismissed = userLocalUserFlagsStore(
    (s) => !!s.flags[DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY],
  );
  const onboardingOpen = useDictationOnboardingOpen((s) => s.open);
  const hasDictations = useDictationHistory(
    (s) =>
      getLifetimeWords(s, userId) > 0 ||
      s.entries.some((entry) => entry.userId === userId),
  );
  const installedAt = useDesktopLifecycleStore((s) => s.installedAt);
  const now = useTalkTeaserInstallDelay(installedAt);
  const presence = resolveTalkPillPresence({
    flagOn,
    onboardingDone,
    dismissed,
    hasDictations,
    signedIn: userId !== undefined,
    onboardingOpen,
    installedAt,
    now,
  });

  const pendingMilestone = useDictationHistory((s) =>
    getPendingMilestone(s, userId),
  );

  // Held by value: the effect below pushes it over ipc, and a fresh object
  // every render would push it on every render.
  const content = useMemo(
    () => resolveTeaserContent({ presence, pending: pendingMilestone, userId }),
    [presence, pendingMilestone, userId],
  );
  // The action arrives from another window, so the handler cannot close over
  // the render that produced the card; this is what it was showing.
  const variant = useRef(content?.variant);
  variant.current = content?.variant;
  // The nudge already counted as seen, as the account it was for and the rung
  // it was for. Both halves matter: this hook stays mounted across a sign-in,
  // and two accounts on one machine each earn their own 360th word.
  const reportedNudge = useRef<string>(undefined);

  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;
    window.electron?.dictation.setPillPresence?.(presence);
  }, [presence]);

  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;
    window.electron?.dictation.setTeaserContent?.(content);
  }, [content]);

  // The card only counts as shown once the desktop actually put it on screen;
  // "teaser" presence alone is not enough (the pill preference can veto it).
  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;
    const offAction = window.electron?.dictation.onTeaserAction?.((action) => {
      // The card outlives its content: clearing the milestone takes it off the
      // pill only once the push has reached the desktop, so a second press in
      // that gap still arrives. It belongs to the nudge that was on screen, and
      // must not fall through to the introduction and start onboarding for
      // someone who already uses Talk.
      if (variant.current === "intro") {
        handleTalkTeaserAction(action);
        return;
      }
      if (variant.current !== "milestone") return;
      // Either way the nudge is spent — clearing the pending milestone is what
      // takes it off the pill. Share opens the card itself rather than routing
      // through a screen, so it works from whatever tab the user is on.
      const pending = getPendingMilestone(
        useDictationHistory.getState(),
        userId,
      );
      if (action === "try" && pending) {
        showMilestoneShare({
          userId: pending.userId,
          milestoneWords: pending.milestoneWords,
          totalWords: pending.totalWords,
          source: "pill_nudge",
        });
      }
      if (pending) {
        trackMilestoneNudgeAction(action, pending.milestoneWords);
        clearPendingMilestone(pending.userId);
      }
    });
    // Only the introduction belongs in its funnel; a nudge is a different card
    // shown for a different reason. A card can be put back on screen more than
    // once — the permission guide or the feedback offer takes the edge and then
    // gives it back — so the rung it was for is what makes it one impression.
    const offShown = window.electron?.dictation.onTeaserShown?.(() => {
      if (variant.current === "intro") {
        trackTalkTeaserShown();
        return;
      }
      if (variant.current !== "milestone") return;

      const rung = getPendingMilestone(
        useDictationHistory.getState(),
        userId,
      )?.milestoneWords;
      if (rung === undefined) return;

      const nudge = `${userId}:${rung}`;
      if (nudge === reportedNudge.current) return;

      reportedNudge.current = nudge;
      trackMilestoneNudgeShown(rung);
    });
    return () => {
      offAction?.();
      offShown?.();
    };
  }, [userId]);
}

/**
 * Ticks once when the install-delay boundary passes so a presence that was
 * still within the app's first day flips to "teaser" without a restart.
 */
function useTalkTeaserInstallDelay(installedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (installedAt === null) return;
    const delay = installedAt + TALK_PILL_TEASER_INSTALL_DELAY_MS - Date.now();
    if (delay <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), delay + 50);
    return () => clearTimeout(timer);
  }, [installedAt]);

  return now;
}

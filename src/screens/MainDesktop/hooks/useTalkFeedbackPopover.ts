import { useApolloClient } from "@apollo/client";
import { useAuth } from "@/features/auth";
import {
  DICTATION_FEEDBACK_NUDGE_DELAY_MS,
  DICTATION_FEEDBACK_THANKS_MS,
  resolveTalkFeedbackPopoverWanted,
  selectNudgeState,
  useDictationFeedbackNudge,
} from "@/features/dictation-feedback-nudge";
import {
  DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import {
  GetCurrentUserDocument,
  useGetCurrentUserQuery,
  useUpdateUserDynamicMetadataMutation,
} from "@/graphql";
import {
  getDictationCount,
  useDictationHistory,
} from "@/hooks/dictationHistory";
import { useIsDictationAvailable } from "@/hooks/useIsDictationAvailable";
import { Logger } from "@/logger";
import { isTalkFeedbackNudgeCompletedOnServer } from "@/screens/MainDesktop/components/talkFeedback";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import type { DictationFeedbackAction } from "electron/src/types";
import { useEffect, useRef, useState } from "react";
import { useSubmitTalkFeedback } from "./useSubmitTalkFeedback";

const logger = new Logger("dictation-feedback-nudge");

/**
 * The Talk feedback offer made beside the pill at dictation milestones (10,
 * 25, 50, 100 spoken dictations). Each offer is owed from the moment its
 * milestone lands and is persisted, so quitting before it appears resumes it
 * on the next launch; it is spent only once the desktop actually puts the
 * card on screen. Shows and completion also persist server-side through user
 * dynamic metadata, so another device's offers advance the same schedule.
 * Lives at the app root of the main window, like the pill teaser — the card
 * is its own window, so its actions arrive through the desktop bridge and
 * this hook is the one place that decides what they mean.
 */
export function useTalkFeedbackPopover(): void {
  const flagOn = useIsDictationAvailable();
  const userId = useAuth((s) => s.user?.id);
  const submitTalkFeedback = useSubmitTalkFeedback();
  const onboardingDone = userLocalUserFlagsStore(
    (s) => !!s.flags[DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY],
  );
  const nudgeState = useDictationFeedbackNudge(selectNudgeState(userId));
  const markNudgeShown = useDictationFeedbackNudge((s) => s.markNudgeShown);
  const syncServerTimesShown = useDictationFeedbackNudge(
    (s) => s.syncServerTimesShown,
  );
  const seedFromHistory = useDictationFeedbackNudge((s) => s.seedFromHistory);
  const client = useApolloClient();
  const [offered, setOffered] = useState(false);

  // The cached user already carries flags/counters for most sessions —
  // cache-first so this adds no network call then.
  const { data: userData } = useGetCurrentUserQuery({
    skip: !userId || !isDesktop,
    fetchPolicy: "cache-first",
    errorPolicy: "ignore",
    context: { silentErrors: true },
  });
  const serverTimesSeen =
    userData?.user?.userMetaData?.counters?.timesSeenTalkFeedbackNudge ?? 0;
  const serverCompleted = isTalkFeedbackNudgeCompletedOnServer(userData?.user);

  // The card belongs to the account that earned it; a sign-out or account
  // switch takes it down rather than spending it on the next account.
  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;
    return () => {
      setOffered(false);
      window.electron?.dictation.setFeedbackPopoverActive?.(false);
    };
  }, [userId]);

  // Users who already dictated a lot get their first offer after their next
  // dictation instead of starting the count from zero. The count survives
  // deleted and cleared history, so a milestone cannot be earned twice.
  useEffect(() => {
    if (!isDesktop || !userId) return;
    const spokenCount = getDictationCount(
      useDictationHistory.getState(),
      userId,
    );
    seedFromHistory(userId, spokenCount);
  }, [userId, seedFromHistory]);

  // Another device's shows advance this device's milestone schedule.
  useEffect(() => {
    if (userId && serverTimesSeen > nudgeState.timesShown) {
      syncServerTimesShown(userId, serverTimesSeen);
    }
  }, [userId, serverTimesSeen, nudgeState.timesShown, syncServerTimesShown]);

  const [updateDynamicMetadata] = useUpdateUserDynamicMetadataMutation({
    onError(error) {
      logger.warn("failed to persist nudge metadata", { error: `${error}` });
    },
    context: { silentErrors: true },
  });

  const metadataMutationRef = useRef(updateDynamicMetadata);
  metadataMutationRef.current = updateDynamicMetadata;

  const wanted = resolveTalkFeedbackPopoverWanted({
    nudgePending: nudgeState.nudgePending,
    onboardingDone,
    signedIn: userId !== undefined,
    flagOn,
    serverCompleted: serverCompleted || nudgeState.completed,
  });
  // Once shown, the card stays until the user acts on it: marking the offer
  // shown clears nudgePending, which alone would take it right back down.
  const shouldOffer = wanted || offered;

  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;
    if (!shouldOffer) {
      window.electron?.dictation.setFeedbackPopoverActive?.(false);
      return;
    }
    // A restored window is the same offer — the card is already active.
    if (offered) return;
    let cancelled = false;
    // The delay lets the paste land and the pill's own toast finish before
    // the card appears over them. A new offer also refreshes the user first:
    // another device may have completed the nudge while this one was offline.
    // The freshness check is its own network query, not the hook's refetch:
    // the hook ignores GraphQL errors (errorPolicy "ignore"), while the
    // default policy here rejects on them — and a failed refresh keeps the
    // offer pending so the next dictation retries. The result still lands in
    // the cache, and it also gates activation: a nudge another device just
    // completed never shows here.
    const fresh = client
      .query({
        query: GetCurrentUserDocument,
        fetchPolicy: "network-only",
        context: { silentErrors: true },
      })
      .then((result) =>
        isTalkFeedbackNudgeCompletedOnServer(result.data?.user),
      );
    const delay = new Promise<void>((r) =>
      setTimeout(r, DICTATION_FEEDBACK_NUDGE_DELAY_MS),
    );
    Promise.all([delay, fresh]).then(
      ([, completed]) => {
        if (!cancelled && !completed) {
          window.electron?.dictation.setFeedbackPopoverActive?.(true);
        }
      },
      () => {
        logger.warn("skipped feedback offer: user refresh failed");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [shouldOffer, offered, client, nudgeState.completedDictations]);

  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;
    // The thanks beat is owned here, not by the card: the card window can
    // be torn down mid-thanks (pill hidden, guide opened), and its dismiss
    // would then never arrive. This timer settles the offer regardless.
    let thanksTimer: ReturnType<typeof setTimeout> | undefined;
    // A non-empty details X submits before dismissing; don't count that as
    // the user walking away.
    let submitted = false;
    // The card only counts as shown once the desktop put it on screen; that
    // is what spends the offer and records the impression.
    const offShown = window.electron?.dictation.onFeedbackPopoverShown?.(() => {
      submitted = false;
      const pending =
        userId &&
        selectNudgeState(userId)(useDictationFeedbackNudge.getState())
          .nudgePending;
      // A restored window (pill hidden and shown again, guide closed) is the
      // same offer, not a new impression.
      if (userId && pending) {
        markNudgeShown(userId);
        const shown = selectNudgeState(userId)(
          useDictationFeedbackNudge.getState(),
        );
        metadataMutationRef.current({
          variables: {
            input: {
              counters: { timesSeenTalkFeedbackNudge: shown.timesShown },
              ...(shown.completed
                ? { flags: { completedTalkFeedbackNudge: true } }
                : {}),
            },
          },
        });
      }
      setOffered(true);
    });
    const offAction = window.electron?.dictation.onFeedbackAction?.(
      (action: DictationFeedbackAction) => {
        const state = userId
          ? selectNudgeState(userId)(useDictationFeedbackNudge.getState())
          : undefined;
        const trackProps = {
          milestone: state?.lastShownMilestone ?? 0,
          timesSeen: state?.timesShown ?? 0,
        };
        if (action.type === "dismiss") {
          if (!submitted) {
            tracker.track(
              TRACKING_EVENTS.DICTATION_FEEDBACK_NUDGE_DISMISSED,
              trackProps,
            );
          }
          clearTimeout(thanksTimer);
          setOffered(false);
          window.electron?.dictation.setFeedbackPopoverActive?.(false);
          return;
        }
        submitted = true;
        tracker.track(TRACKING_EVENTS.DICTATION_FEEDBACK_NUDGE_SUBMITTED, {
          ...trackProps,
          rating: action.rating,
        });
        // The card shows its thanks state until this takes it down.
        thanksTimer = setTimeout(() => {
          setOffered(false);
          window.electron?.dictation.setFeedbackPopoverActive?.(false);
        }, DICTATION_FEEDBACK_THANKS_MS);
        // Settling the schedule waits on the mutation: a failed submit keeps
        // the offer unsettled for the next milestone, and the error toast
        // stays the only user-facing signal.
        submitTalkFeedback(action);
      },
    );
    return () => {
      clearTimeout(thanksTimer);
      offShown?.();
      offAction?.();
    };
  }, [userId, markNudgeShown, submitTalkFeedback]);
}

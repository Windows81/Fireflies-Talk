import { Config } from "@/constants/config";
import { openURL } from "@/features/navigation/utils";
import { apolloClient, UpdateUserDynamicMetadataDocument } from "@/graphql";
import { Logger } from "@/logger";
import type {
  DictationEmailAssistantAction,
  DictationEmailAssistantProvider,
} from "electron/src/types";
import {
  selectEmailAssistantNudge,
  useDictationEmailAssistantNudge,
} from "./dictation-email-assistant-nudge.store";
import { buildEmailAssistantConnectUrl } from "./emailAssistantConnect";
import {
  emailAssistantNudgeTrackProps,
  trackEmailAssistantNudgeAction,
  trackEmailAssistantNudgeShown,
} from "./emailAssistantNudgeTracking";
import { isOwedInState } from "./nudgeState";

const logger = new Logger("dictation-email-assistant-nudge");

/**
 * The card reached the screen: that spends the owed milestone, records the
 * impression and persists the show server-side, so every device keeps the
 * same schedule and cooldown. A restored window (pill hidden and shown
 * again) is the same offer, not a new one.
 */
export function handleEmailAssistantNudgeShown(
  userId: string,
  provider: DictationEmailAssistantProvider,
): void {
  const store = useDictationEmailAssistantNudge.getState();
  const now = Date.now();
  if (!isOwedInState(selectEmailAssistantNudge(userId)(store), now)) return;

  store.markShown(userId, now);

  const shown = selectEmailAssistantNudge(userId)(
    useDictationEmailAssistantNudge.getState(),
  );

  trackEmailAssistantNudgeShown(emailAssistantNudgeTrackProps(shown, provider));

  apolloClient
    .mutate({
      mutation: UpdateUserDynamicMetadataDocument,
      variables: {
        input: {
          counters: { timesSeenTalkEmailAssistantNudge: shown.timesSeen },
          timestamps: { lastTimeSeenTalkEmailAssistantNudge: new Date(now) },
        },
      },
      context: { silentErrors: true },
    })
    .catch(() => {
      logger.warn("failed to persist Email Assistant nudge show");
    });
}

/**
 * What the card's Connect and Close mean. Neither changes the schedule: the
 * show already spent its milestone, and once Connect turns the assistant on
 * the offer-time settings check keeps every later milestone quiet.
 */
export function handleEmailAssistantNudgeAction(
  userId: string,
  action: DictationEmailAssistantAction,
  provider: DictationEmailAssistantProvider,
): void {
  const nudge = selectEmailAssistantNudge(userId)(
    useDictationEmailAssistantNudge.getState(),
  );

  trackEmailAssistantNudgeAction(
    action,
    emailAssistantNudgeTrackProps(nudge, provider),
  );

  if (action === "connect") {
    openURL(buildEmailAssistantConnectUrl(Config.DASHBOARD_URL));
  }
}

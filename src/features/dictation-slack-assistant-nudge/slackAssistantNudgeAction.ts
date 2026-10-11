import { Config } from "@/constants/config";
import { openURL } from "@/features/navigation/utils";
import { apolloClient, UpdateUserDynamicMetadataDocument } from "@/graphql";
import { Logger } from "@/logger";
import type { DictationSlackAssistantAction } from "electron/src/types";
import {
  selectSlackAssistantNudge,
  useDictationSlackAssistantNudge,
} from "./dictation-slack-assistant-nudge.store";
import { isOwedInState } from "./nudgeState";
import { buildSlackAssistantConnectUrl } from "./slackAssistantConnect";
import {
  slackAssistantNudgeTrackProps,
  trackSlackAssistantNudgeAction,
  trackSlackAssistantNudgeShown,
} from "./slackAssistantNudgeTracking";

const logger = new Logger("dictation-slack-assistant-nudge");

/**
 * The card reached the screen: that spends the owed milestone, records the
 * impression and persists the show server-side, so every device keeps the
 * same schedule and cooldown. A restored window (pill hidden and shown
 * again) is the same offer, not a new one.
 */
export function handleSlackAssistantNudgeShown(userId: string): void {
  const store = useDictationSlackAssistantNudge.getState();
  const now = Date.now();
  if (!isOwedInState(selectSlackAssistantNudge(userId)(store), now)) return;

  store.markShown(userId, now);

  const shown = selectSlackAssistantNudge(userId)(
    useDictationSlackAssistantNudge.getState(),
  );

  trackSlackAssistantNudgeShown(slackAssistantNudgeTrackProps(shown));

  apolloClient
    .mutate({
      mutation: UpdateUserDynamicMetadataDocument,
      variables: {
        input: {
          counters: { timesSeenTalkSlackAssistantNudge: shown.timesSeen },
          timestamps: { lastTimeSeenTalkSlackAssistantNudge: new Date(now) },
        },
      },
      context: { silentErrors: true },
    })
    .catch(() => {
      logger.warn("failed to persist Slack Assistant nudge show");
    });
}

/**
 * What the card's Connect and Close mean. Neither changes the schedule: the
 * show already spent its milestone, and once Connect links Slack the
 * offer-time connection check keeps every later milestone quiet.
 */
export function handleSlackAssistantNudgeAction(
  userId: string,
  action: DictationSlackAssistantAction,
): void {
  const nudge = selectSlackAssistantNudge(userId)(
    useDictationSlackAssistantNudge.getState(),
  );

  trackSlackAssistantNudgeAction(action, slackAssistantNudgeTrackProps(nudge));

  if (action === "connect") {
    openURL(buildSlackAssistantConnectUrl(Config.DASHBOARD_URL));
  }
}

import { initAssistantNudgeOffer } from "@/features/dictation-assistant-nudge/assistantNudgeOffer";
import { parseServerShows } from "@/features/dictation-assistant-nudge/schedule";
import { FEATURE_FLAGS } from "@/features/feature-flags/featureFlags";
import { readFeatureIsOn } from "@/features/feature-flags/readFeatureIsOn";
import {
  apolloClient,
  GetSlackConnectionDocument,
  type GetSlackConnectionQuery,
} from "@/graphql";
import type { DictationSlackAssistantAction } from "electron/src/types";
import { SLACK_CONNECTOR_NAME } from "./constants";
import {
  type SlackAssistantOffer,
  selectSlackAssistantNudge,
  useDictationSlackAssistantNudge,
} from "./dictation-slack-assistant-nudge.store";
import { isOwedInState, type UserSlackAssistantNudge } from "./nudgeState";
import {
  handleSlackAssistantNudgeAction,
  handleSlackAssistantNudgeShown,
} from "./slackAssistantNudgeAction";

/**
 * Slack counts as set up once its connector is connected, with or without the
 * Slack Assistant onboarding, so accounts that connected Slack before the
 * onboarding existed are not offered it.
 */
const isSlackConnected = async (): Promise<boolean> => {
  const connection = await apolloClient.query<GetSlackConnectionQuery>({
    query: GetSlackConnectionDocument,
    fetchPolicy: "network-only",
    context: { silentErrors: true },
  });

  const slackId = connection.data?.getConnectorList?.integrations?.find(
    (integration) => integration.name === SLACK_CONNECTOR_NAME,
  )?.id;

  return (
    !!slackId &&
    !!connection.data?.getConnectorListConnected?.some(
      (connected) => connected?.id === slackId,
    )
  );
};

/** The Slack Assistant card, offered after Slack pastes. */
export function initSlackAssistantNudge(): () => void {
  return initAssistantNudgeOffer<
    UserSlackAssistantNudge,
    SlackAssistantOffer,
    DictationSlackAssistantAction
  >({
    name: "dictation-slack-assistant-nudge",
    label: "Slack Assistant",
    store: useDictationSlackAssistantNudge,
    isOwed: (userId) =>
      isOwedInState(
        selectSlackAssistantNudge(userId)(
          useDictationSlackAssistantNudge.getState(),
        ),
      ),
    nudgeFlag: FEATURE_FLAGS.DESKTOP_TALK_SLACK_ASSISTANT_NUDGE,
    canAccess: () => readFeatureIsOn(FEATURE_FLAGS.ENABLE_SLACK_ASSISTANT),
    readServerShows: (user) =>
      parseServerShows(
        user?.userMetaData?.counters?.timesSeenTalkSlackAssistantNudge,
        user?.userMetaData?.timestamps?.lastTimeSeenTalkSlackAssistantNudge,
      ),
    isSetUp: isSlackConnected,
    buildOffer: (userId) => ({ userId }),
    bridge: {
      setActive: (offer) =>
        window.electron?.dictation.setSlackAssistantNudgeActive?.(!!offer),
      onShown: (callback) =>
        window.electron?.dictation.onSlackAssistantNudgeShown?.(callback),
      onAction: (callback) =>
        window.electron?.dictation.onSlackAssistantNudgeAction?.(callback),
    },
    onShown: (offer) => handleSlackAssistantNudgeShown(offer.userId),
    onAction: (offer, action) =>
      handleSlackAssistantNudgeAction(offer.userId, action),
  });
}

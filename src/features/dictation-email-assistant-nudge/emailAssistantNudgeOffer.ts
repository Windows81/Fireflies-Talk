import { initAssistantNudgeOffer } from "@/features/dictation-assistant-nudge/assistantNudgeOffer";
import { parseServerShows } from "@/features/dictation-assistant-nudge/schedule";
import { FEATURE_FLAGS } from "@/features/feature-flags/featureFlags";
import { readFeatureIsOn } from "@/features/feature-flags/readFeatureIsOn";
import { apolloClient, GetEmailAssistantSettingsDocument } from "@/graphql";
import type { DictationEmailAssistantAction } from "electron/src/types";
import {
  type EmailAssistantOffer,
  selectEmailAssistantNudge,
  useDictationEmailAssistantNudge,
} from "./dictation-email-assistant-nudge.store";
import { emailAssistantProviderFor } from "./emailAssistantConnect";
import {
  handleEmailAssistantNudgeAction,
  handleEmailAssistantNudgeShown,
} from "./emailAssistantNudgeAction";
import { isOwedInState, type UserEmailAssistantNudge } from "./nudgeState";

const isEmailAssistantEnabled = async (): Promise<boolean> => {
  const settings = await apolloClient.query({
    query: GetEmailAssistantSettingsDocument,
    fetchPolicy: "network-only",
    context: { silentErrors: true },
  });

  return !!settings.data?.emailSettings?.isAssistantEnabled;
};

/** The Email Assistant card, offered after email pastes. */
export function initEmailAssistantNudge(): () => void {
  return initAssistantNudgeOffer<
    UserEmailAssistantNudge,
    EmailAssistantOffer,
    DictationEmailAssistantAction
  >({
    name: "dictation-email-assistant-nudge",
    label: "Email Assistant",
    store: useDictationEmailAssistantNudge,
    isOwed: (userId) =>
      isOwedInState(
        selectEmailAssistantNudge(userId)(
          useDictationEmailAssistantNudge.getState(),
        ),
      ),
    nudgeFlag: FEATURE_FLAGS.DESKTOP_TALK_EMAIL_ASSISTANT_NUDGE,
    canAccess: (user) =>
      readFeatureIsOn(FEATURE_FLAGS.EMAIL_ASSISTANT) ||
      !!user?.flags?.hasAccessToEmailAssistant,
    readServerShows: (user) =>
      parseServerShows(
        user?.userMetaData?.counters?.timesSeenTalkEmailAssistantNudge,
        user?.userMetaData?.timestamps?.lastTimeSeenTalkEmailAssistantNudge,
      ),
    isSetUp: isEmailAssistantEnabled,
    buildOffer: (userId, user) => ({
      userId,
      provider: emailAssistantProviderFor(user?.profile?.isOutlook),
    }),
    bridge: {
      setActive: (offer) =>
        window.electron?.dictation.setEmailAssistantNudgeActive?.(
          offer?.provider ?? null,
        ),
      onShown: (callback) =>
        window.electron?.dictation.onEmailAssistantNudgeShown?.(callback),
      onAction: (callback) =>
        window.electron?.dictation.onEmailAssistantNudgeAction?.(callback),
    },
    onShown: (offer) =>
      handleEmailAssistantNudgeShown(offer.userId, offer.provider),
    onAction: (offer, action) =>
      handleEmailAssistantNudgeAction(offer.userId, action, offer.provider),
  });
}

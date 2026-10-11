import {
  createDictationAssistantNudgeStore,
  type DictationAssistantNudgeStore,
} from "@/features/dictation-assistant-nudge/dictation-assistant-nudge.store";
import {
  EMPTY_SLACK_ASSISTANT_NUDGE,
  isOwedInState,
  recordSlackDictationInState,
  type UserSlackAssistantNudge,
} from "./nudgeState";

export interface SlackAssistantOffer {
  userId: string;
}

type DictationSlackAssistantNudgeStore = DictationAssistantNudgeStore<
  UserSlackAssistantNudge,
  SlackAssistantOffer
>;

export const selectSlackAssistantNudge =
  (userId?: string) =>
  (store: DictationSlackAssistantNudgeStore): UserSlackAssistantNudge =>
    (userId && store.byUser[userId]) || EMPTY_SLACK_ASSISTANT_NUDGE;

export const useDictationSlackAssistantNudge =
  createDictationAssistantNudgeStore<
    UserSlackAssistantNudge,
    SlackAssistantOffer
  >({
    name: "dictation-slack-assistant-nudge",
    empty: EMPTY_SLACK_ASSISTANT_NUDGE,
    record: recordSlackDictationInState,
    isOwed: isOwedInState,
    describeMilestone: (nudge) =>
      `reached ${nudge.slackDictations} Slack dictations`,
  });

export const dictationSlackAssistantNudgeApi =
  useDictationSlackAssistantNudge.getState() as Pick<
    DictationSlackAssistantNudgeStore,
    "recordDictation"
  >;

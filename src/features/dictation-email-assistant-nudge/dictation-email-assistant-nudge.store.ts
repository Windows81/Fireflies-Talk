import {
  createDictationAssistantNudgeStore,
  type DictationAssistantNudgeStore,
} from "@/features/dictation-assistant-nudge/dictation-assistant-nudge.store";
import type { DictationEmailAssistantProvider } from "electron/src/types";
import {
  EMPTY_EMAIL_ASSISTANT_NUDGE,
  isOwedInState,
  recordEmailDictationInState,
  type UserEmailAssistantNudge,
} from "./nudgeState";

export interface EmailAssistantOffer {
  userId: string;
  provider: DictationEmailAssistantProvider;
}

type DictationEmailAssistantNudgeStore = DictationAssistantNudgeStore<
  UserEmailAssistantNudge,
  EmailAssistantOffer
>;

export const selectEmailAssistantNudge =
  (userId?: string) =>
  (store: DictationEmailAssistantNudgeStore): UserEmailAssistantNudge =>
    (userId && store.byUser[userId]) || EMPTY_EMAIL_ASSISTANT_NUDGE;

export const useDictationEmailAssistantNudge =
  createDictationAssistantNudgeStore<
    UserEmailAssistantNudge,
    EmailAssistantOffer
  >({
    name: "dictation-email-assistant-nudge",
    empty: EMPTY_EMAIL_ASSISTANT_NUDGE,
    record: recordEmailDictationInState,
    isOwed: isOwedInState,
    describeMilestone: (nudge) =>
      `reached ${nudge.emailDictations} email dictations`,
  });

export const dictationEmailAssistantNudgeApi =
  useDictationEmailAssistantNudge.getState() as Pick<
    DictationEmailAssistantNudgeStore,
    "recordDictation"
  >;

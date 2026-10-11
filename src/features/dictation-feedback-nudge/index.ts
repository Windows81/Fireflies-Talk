export {
  DICTATION_FEEDBACK_NUDGE_DELAY_MS,
  DICTATION_FEEDBACK_THANKS_MS,
  TALK_FEEDBACK_NUDGE_MILESTONES,
} from "./constants";
export {
  countsTowardNudge,
  migrateNudgePersistedState,
  nextMilestoneAfter,
  recordDictationInState,
  seedFromHistoryInState,
  type UserNudgeState,
} from "./nudgeState";
export {
  resolveTalkFeedbackPopoverWanted,
  type TalkFeedbackPopoverInput,
} from "./popoverPresence";
export {
  dictationFeedbackNudgeApi,
  selectNudgeState,
  useDictationFeedbackNudge,
} from "./dictation-feedback-nudge.store";

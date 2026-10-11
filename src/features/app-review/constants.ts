import type { ReviewPromptConfig } from "./types";

export const defaultReviewPromptConfig: ReviewPromptConfig = {
  enabled: false,
  minimumDaysBetweenPrompts: 5,
  recordCountThresholds: [3, 6, 10],
  sharedMeetingThresholds: [2, 4, 6],
  completedTaskThresholds: [3, 6, 10],
  minutesInNotepadThresholds: [10, 20, 30],
};

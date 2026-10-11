import type { ReviewPromptConfig } from "./types";
import type { MetricCounts, MetricTiers, ThresholdResults } from "./types";

export const millisecondsToDays = (ms: number) =>
  Math.floor(ms / (1000 * 60 * 60 * 24));

export const isReadyToShow = ({
  previousReviewTimestamp,
  minimumDaysBetweenPrompts,
}: {
  previousReviewTimestamp: number | undefined;
  minimumDaysBetweenPrompts: number;
}) => {
  if (!previousReviewTimestamp) return true;
  const minDayInMillis = minimumDaysBetweenPrompts * 1000 * 60 * 60 * 24;
  return Date.now() - previousReviewTimestamp > minDayInMillis;
};

export const getCurrentThreshold = (
  tierIndex: number,
  thresholds: number[],
): number => {
  return thresholds[Math.min(tierIndex, thresholds.length - 1)];
};

export const checkMetThresholds = (
  currentCounts: MetricCounts,
  tiers: MetricTiers,
  config: ReviewPromptConfig,
): ThresholdResults => {
  const recordThreshold = getCurrentThreshold(
    tiers.recordTierIndex,
    config.recordCountThresholds,
  );
  const meetingThreshold = getCurrentThreshold(
    tiers.sharedMeetingTierIndex,
    config.sharedMeetingThresholds,
  );
  const taskThreshold = getCurrentThreshold(
    tiers.completedTaskTierIndex,
    config.completedTaskThresholds,
  );
  const notepadThreshold = getCurrentThreshold(
    tiers.notepadTierIndex,
    config.minutesInNotepadThresholds,
  );

  const minutesInNotepad = Math.floor(currentCounts.secondsSpentInNotepad / 60);

  return {
    recordMet: currentCounts.recordCount >= recordThreshold,
    sharedMeetingMet: currentCounts.sharedMeetingCount >= meetingThreshold,
    completedTaskMet: currentCounts.completedTaskCount >= taskThreshold,
    notepadMet: minutesInNotepad >= notepadThreshold,
  };
};

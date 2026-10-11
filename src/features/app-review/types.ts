export type ThresholdResults = {
  recordMet: boolean;
  sharedMeetingMet: boolean;
  completedTaskMet: boolean;
  notepadMet: boolean;
};

export interface MetricTiers {
  recordTierIndex: number;
  sharedMeetingTierIndex: number;
  completedTaskTierIndex: number;
  notepadTierIndex: number;
}

export interface MetricCounts {
  recordCount: number;
  sharedMeetingCount: number;
  completedTaskCount: number;
  secondsSpentInNotepad: number;
}

export type ReviewPromptConfig = {
  enabled: boolean;
  minimumDaysBetweenPrompts: number;
  recordCountThresholds: number[];
  sharedMeetingThresholds: number[];
  completedTaskThresholds: number[];
  minutesInNotepadThresholds: number[];
};

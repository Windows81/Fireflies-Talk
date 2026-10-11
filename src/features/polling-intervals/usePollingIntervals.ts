import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";

// use no-polling as default. apollo uses 0 as no-poll
const DEFAULT_POLLING_INTERVALS = {
  recentMeetingsMobile: 0,
  recentMeetingsDesktop: 0,
  calendarEventsMobile: 0,
  calendarEventsDesktop: 0,
  liveMeetingsMobile: 0,
  liveMeetingsDesktop: 0,
  liveMeetingsIntensiveMobile: 0,
  liveMeetingsIntensiveDesktop: 0,
};

export type PollingIntervals = typeof DEFAULT_POLLING_INTERVALS;

/**
 * Hook that returns polling intervals from the mobile-polling-intervals feature flag
 * Falls back to default values if the flag is not set
 */
export const usePollingIntervals = () => {
  return useFeatureValue(
    FEATURE_FLAGS.MOBILE_POLLING_INTERVALS,
    DEFAULT_POLLING_INTERVALS,
  );
};

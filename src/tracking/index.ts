import { Config } from "@/constants";
import { AnalyticsTracker } from "./AnalyticsTracker";

export const tracker = new AnalyticsTracker({
  segmentKey: Config.SEGMENT_WRITE_KEY,
  dryRun: Config.APP_ENV !== "production",
});

export { TRACKING_EVENTS } from "./trackingEvents";

export { getLoginTrackingParams, persistReferral } from "./referral";

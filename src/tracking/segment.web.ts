import { AnalyticsBrowser } from "@segment/analytics-next";
import type { SegmentClient } from "@segment/analytics-react-native";
import type { AnalyticsTrackerOptions } from "./types";
import { getActualPlatformFriendly, isDesktop } from "@/utils/device";

const getEnrichedProperties = (properties?: Record<string, unknown>) => {
  const enriched = {
    ...properties,
    platform: getActualPlatformFriendly(),
    desktop: isDesktop,
  };
  return enriched;
};

export const createAnalytics = (
  options: AnalyticsTrackerOptions,
): Pick<SegmentClient, "track" | "screen" | "identify" | "reset"> => {
  const analytics = AnalyticsBrowser.load({
    writeKey: options.segmentKey,
  });
  return {
    track: async (eventName, properties) => {
      await analytics.track(eventName, getEnrichedProperties(properties));
    },
    screen: async (screenName, properties) => {
      // the function signature is (category, name, properties)
      // but if only 2 arguments are passed, it's (name, properties)
      await analytics.screen(screenName, getEnrichedProperties(properties));
    },
    identify: async (id, traits) => {
      await analytics.identify(id, traits);
    },
    reset: async () => {
      await analytics.reset();
    },
  };
};

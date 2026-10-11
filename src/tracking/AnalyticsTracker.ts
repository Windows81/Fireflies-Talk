import { Logger } from "@/logger";
import type { JsonMap, SegmentClient } from "@segment/analytics-react-native";
import type { AuthUser } from "../features/auth";
import { createAnalytics } from "./segment";
import { TRACKING_EVENTS } from "./trackingEvents";
import type { AnalyticsTrackerOptions } from "./types";

const logger = new Logger("AnalyticsTracker");

export class AnalyticsTracker {
  private analytics: Pick<
    SegmentClient,
    "track" | "screen" | "identify" | "reset"
  >;
  private userId: string | undefined;
  private errorHandler: (error: Error) => void;
  private dryRun: boolean;
  private enabled: boolean = true;

  constructor(options: AnalyticsTrackerOptions) {
    this.errorHandler =
      options.errorHandler ||
      (() => {
        /** noop */
      });
    this.dryRun = options.dryRun || false;
    this.analytics = createAnalytics(options);
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  async setUser(user: AuthUser | null) {
    const prevUserId = this.userId;
    this.userId = user?.id;

    if (!this.enabled || this.dryRun) {
      logger.debug(`setUser: ${user?.id}`);
      return;
    }
    if (prevUserId && user?.id !== prevUserId) {
      // this regenerates a new anonymousId
      // so different login sessions don't get linked to the same user
      await this.analytics.reset();
    }
    if (user) {
      // identifying allows subsequent track calls to be linked to this user
      return this.analytics.identify(user.id, {
        email: user.email,
        name: user.name,
        paidUser: user.paidUser,
        avatar: user.photoUrl,
      });
    }
  }

  track(event: TRACKING_EVENTS, properties?: JsonMap) {
    if (!this.enabled || this.dryRun) {
      logger.debug(`track: ${event}:`, properties);
      return;
    }
    this.analytics.track(event, properties).catch(this.errorHandler);
  }

  screen(name: string, properties?: JsonMap) {
    if (!this.enabled || this.dryRun) {
      logger.debug(`track screen: ${name}:`, properties);
      return;
    }

    Promise.all([
      this.analytics.screen(name, properties),
      this.track(TRACKING_EVENTS.APP_SCREEN_VIEWED, {
        name,
        params: properties,
      }),
    ]).catch(this.errorHandler);
  }
}

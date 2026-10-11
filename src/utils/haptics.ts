import { Logger } from "@/logger";
import * as Haptics from "expo-haptics";

const logger = new Logger("haptics");

/**
 * The full expo-haptics surface, minus the error handling every caller would
 * otherwise repeat. A device with haptics turned off (iOS System Haptics, Low
 * Power Mode) or a build without the native module must never break the
 * interaction that asked for feedback — but it should say so in the logs
 * rather than failing silently.
 *
 * Callers pick the style themselves, so adding a new kind of feedback never
 * means editing this file.
 */
const fire = (run: () => Promise<void>) => {
  run().catch((error) => {
    logger.info("haptic feedback unavailable", { error });
  });
};

export const haptics = {
  /** `ImpactFeedbackStyle.{Light, Medium, Heavy, Soft, Rigid}` */
  impact: (style: Haptics.ImpactFeedbackStyle) =>
    fire(() => Haptics.impactAsync(style)),
  /** `NotificationFeedbackType.{Success, Warning, Error}` */
  notification: (type: Haptics.NotificationFeedbackType) =>
    fire(() => Haptics.notificationAsync(type)),
  /** A selection changed, e.g. moving through a list or slider. */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** Android-only engine effects; a no-op elsewhere. */
  android: (type: Haptics.AndroidHaptics) =>
    fire(() => Haptics.performAndroidHapticsAsync(type)),
};

export {
  AndroidHaptics,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from "expo-haptics";

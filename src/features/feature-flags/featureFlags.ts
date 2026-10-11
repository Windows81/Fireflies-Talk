// need to deep import here because tree-shaking
// in metro is not good and may include the server code
// in AnalyticsTRACKER
import { FEATURE_FLAGS as FEATURE_FLAGS_ENUM } from "@firefliesai/shared-libs.growthbook/dist/growthbookFlags";

// workaround a bug in gorwthbook react lib TS
export const FEATURE_FLAGS: Record<string, string> = {
  ...(FEATURE_FLAGS_ENUM as Record<string, string>),
  /**
   * JSON object of Google Meet class names the desktop speaker watcher keys
   * on (see electron/src/speaker-source/adapters/google-meet-chrome.ts). Lets a
   * Meet UI change be followed without shipping a new build.
   */
  DESKTOP_MEET_SPEAKER_SELECTORS: "desktop.meet-speaker-selectors",
};

export const FEATURE_FLAG_STORAGE_KEY: string = "growthbookFlags";

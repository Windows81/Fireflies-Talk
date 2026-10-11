import { isDesktop } from "@/utils/device";
import { Config } from "./config";

export const HELP_CENTER_URL = "https://guide.fireflies.ai/hc/en-us";

export const TERMS_OF_SERVICE_URL = "https://fireflies.ai/terms-of-service";
export const PRIVACY_POLICY_URL = "https://fireflies.ai/privacy-policy";

export const DESKTOP_APP_DEMO_URL =
  "https://files.fireflies.ai/app/desktop/video/app-demo.webm";

export const DASHBOARD_TUTORIAL_VIDEO_URL =
  "https://files.fireflies.ai/app/desktop/video/dashboard-tutorial.webm";

// TODO: confirm this asset is uploaded — the filename follows the convention
// above but the dictation walkthrough had not shipped when the banner landed.
export const DICTATION_TUTORIAL_VIDEO_URL =
  "https://files.fireflies.ai/app/desktop/video/dictation-tutorial.webm";

export const ONBOARDING_BACKGROUND_AUDIO_URL =
  "https://files.fireflies.ai/app/desktop/audio/onboarding-background-sound.mp3";

export const SHARE_FEEDBACK_URL = `${Config.MOBILE_APP_URL}/to/${isDesktop ? "desktop-app-feedback" : "mobile-app-feedback"}`;

/** Where a shared milestone card sends whoever sees it. */
export const TALK_LANDING_URL = `${Config.LANDING_URL}/talk`;

/**
 * How that link is written on the card: no scheme, and capitalised for the
 * brand rather than derived from the URL, which is lowercase by convention.
 * The card shows this plain form; only the pasted caption carries the tags.
 */
export const TALK_LANDING_LABEL = "Fireflies.ai/Talk";

/** The user's meeting list on the web dashboard, where meetings can be deleted. */
export const DASHBOARD_NOTEBOOK_URL = `${Config.DASHBOARD_URL}/notebook/mine`;

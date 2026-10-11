import { Config } from "@/constants";
import { isDesktop } from "@/utils/device";
import type { AskFredSubmitParams } from "../types/askFred";

export const ASK_FRED_LOADING_ANSWER = "LOADING";
export const ASK_FRED_FAILED_RESPONSE_FALLBACK_ANSWER =
  "Sorry, I couldn't generate a response. Please try again.";

export const ASK_FRED_LOADING_MESSAGES = [
  "Analyzing meeting...",
  "Reading transcript...",
  "Preparing your answer...",
  "Almost there...",
];

export const ASK_FRED_LOADING_MESSAGES_LIVE = [
  "Understanding...",
  "Looking into your meetings...",
  "Reading transcripts...",
  "Gathering insights...",
  "Almost there...",
];

export const ASK_FRED_MESSAGE_TYPES = {
  CHAT: "CHAT",
  FINAL: "FINAL",
  ERROR: "ERROR",
  METADATA: "METADATA",
} as const;

export const ASKFRED_SUGGESTION_SOURCE = {
  LIVE_ASSIST_ACTIONS: "topic live assist",
  ASSIST_FRED_PANEL_FIXED_SUGGESTION: "fixed live assist suggestion",
  ASSIST_FRED_PANEL_MANUAL_INPUT: "manual input",
  ASSIST_FRED_PANEL_SUGGESTIONS_FOLLOW_UP: "followup suggestion",
  ASSIST_FRED_PANEL_AI_APPS_SUGGESTION: "ai apps suggestion",
} as const;

// Regular AskFred chat (meeting detail / recordings).
export const ASK_FRED_SUBMIT_PARAMS: AskFredSubmitParams = {
  source: "ask-fred-v1",
  refSource: "notepad",
};

// The realtime Live Assist agent — same thread the live panel uses, so a bot
// meeting's chat continues seamlessly across surfaces.
export const LIVE_ASSIST_SUBMIT_PARAMS: AskFredSubmitParams = {
  source: isDesktop ? "realtime-desktop-app" : "realtime-mobile-app",
  refSource: "assist-execution-agent",
};

export enum ASK_FRED_REF_SOURCE {
  NOTEPAD = "notepad",
  SUGGESTED_PROMPTS = "suggested-prompts",
  WELCOME_SCREEN = "welcome-screen",
  TOPICS = "topics",
  LIVE_ASSIST_ACTIONS = "live-assist-actions",
  GLOBAL_SEARCH = "global-search",
  AI_APPS_PROMPTS = "ai-apps-prompts",
  ASSIST_AGENT_SOURCE = "assist-execution-agent",
  DEAL_METADATA = "deal-metadata",
  ASKFRED_O = "askfred-o",
}

const PRODUCTION_MODE_TEMPLATES = [
  "67251121d8a6f0c52a4f60a1",
  "68f8a5a0cbd73aa68703da88",
  "6971f8ed5c8de741d3b1eae8",
  "66944cd14399fa6baed80187",
  "667afb3b403e8d868e0c2105",
  "66994ef94399fa6bae43a3bf",
  "66994ef44399fa6bae43a09f",
  "66944ccf4399fa6baed800de",
  "66994ef44399fa6bae43a0f5",
  "66994ef14399fa6bae439efa",
  "66994ef54399fa6bae43a181",
  "66994ef24399fa6bae439f61",
  "676046b328f09ce85946bbdc",
  "66994ef74399fa6bae43a29a",
] as const;

const STAGING_MODE_TEMPLATES = [
  "669448a3e193d0f38e2016f0",
  "667afb7ab4def75ae10e550d",
  "667afbee11fb908a324e6379",
  "669a67fae193d0f38e29a195",
  "669a67fbe193d0f38e29a209",
  "669a67fde193d0f38e29a2e0",
  "669a67fee193d0f38e29a35c",
  "669a67fee193d0f38e29a396",
  "669a6800e193d0f38e29a47d",
  "67604646839c94709c4be4ae",
  "6889ca9cc643e5e5d15c5b11",
] as const;

export const getInitialTemplatesToShow = () => {
  const isProduction = Config.APP_ENV === "production";
  if (isProduction) return PRODUCTION_MODE_TEMPLATES;
  return STAGING_MODE_TEMPLATES;
};

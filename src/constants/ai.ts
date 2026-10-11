export const LLM_MODELS = {
  GPT_4O_BASIC: "GPT_4O_BASIC",
  GPT_4O_ADVANCED: "GPT_4O_ADVANCED",
  GPT_4O_ADVANCED_LARGE: "GPT_4O_ADVANCED_LARGE",
};

export const AI_MODELS = [
  {
    name: "GPT-4o",
    short: "GPT-4o",
    tier: "Basic",
    credits: "Free",
    value: LLM_MODELS.GPT_4O_BASIC,
  },
  {
    name: "GPT-4o Advanced",
    short: "GPT-4o Advanced",
    tier: "Advance",
    credits: "1 AI Credit/Prompt",
    value: LLM_MODELS.GPT_4O_ADVANCED,
  },
  {
    name: "GPT-4o Advanced Large",
    short: "GPT-4o Adv Large",
    tier: "Insane",
    credits: "2 AI Credits/Prompt",
    value: LLM_MODELS.GPT_4O_ADVANCED_LARGE,
  },
];

export enum SummarySectionKey {
  OVERVIEW = "OVERVIEW",
  OUTLINE = "OUTLINE",
  SHORTHAND_BULLET = "SHORTHAND_BULLET",
  ACTION_ITEMS = "ACTION_ITEMS",
  KEYWORDS = "KEYWORDS",
}

export const DAILY_BRIEF_APP_TITLE = "Daily Brief";

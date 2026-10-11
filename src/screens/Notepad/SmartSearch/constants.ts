import type { RainbowColor } from "@/styles";

export const SMART_SEARCH_CATEGORY_COLOR_MAP: Record<string, RainbowColor> = {
  task: "Orange",
  metrics: "Cyan",
  pricing: "Indigo",
  questions: "Pink",
  keyTopics: "Purple",
  dateTimes: "Teal",
};

export const SENTIMENT_COLOR_MAP: Record<string, RainbowColor> = {
  neutral: "Teal",
  positive: "Pink",
  negative: "Orange",
};

export const WPM_STARDARD_RANGE = {
  low: 140,
  high: 160,
};

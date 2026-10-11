export enum CAPTION_CATEGORY {
  Task = "task",
  Metrics = "metrics",
  Pricing = "pricing",
  Questions = "questions",
  KeyTopics = "keyTopics",
  DateTimes = "dateTimes",
}

export const ANALYTICS_CATEGORY_LABEL = {
  [CAPTION_CATEGORY.Task]: "Tasks",
  [CAPTION_CATEGORY.Metrics]: "Metrics",
  [CAPTION_CATEGORY.Pricing]: "Pricing",
  [CAPTION_CATEGORY.Questions]: "Questions",
  [CAPTION_CATEGORY.KeyTopics]: "Key Topics",
  [CAPTION_CATEGORY.DateTimes]: "Dates & Times",
};

export const MEETING_NOTE_CATEGORY_NAME_KEY = {
  Nouns: "generalTopics",
  People: "names",
  "Money Value": CAPTION_CATEGORY.Pricing,
  Topics: CAPTION_CATEGORY.KeyTopics,
  "Consecutive Nouns": CAPTION_CATEGORY.KeyTopics,
  Numbers: CAPTION_CATEGORY.Metrics,
  "Numbered Nouns 1": CAPTION_CATEGORY.Metrics,
  Dates: CAPTION_CATEGORY.DateTimes,
  "Fireflies Mentions": "voiceCommands",
  "Ums & Ahs": "pauses",
};

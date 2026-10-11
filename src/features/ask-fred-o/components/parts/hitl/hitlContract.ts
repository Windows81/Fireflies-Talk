export const HITL_INTERACTION_TYPE = {
  ASK_QUESTION: "ask-question",
} as const;

export const OTHER_OPTION_ID = "__other__";

export interface AskQuestionOption {
  id: string;
  label: string;
}

export interface AskQuestion {
  id: string;
  prompt: string;
  allow_multiple?: boolean;
  options: AskQuestionOption[];
}

export interface AskQuestionPayload {
  title?: string;
  questions: AskQuestion[];
}

const isAskQuestionOption = (value: unknown): value is AskQuestionOption =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as AskQuestionOption).id === "string" &&
  typeof (value as AskQuestionOption).label === "string";

const hasUniqueIds = (ids: string[]): boolean =>
  new Set(ids).size === ids.length;

const isAskQuestion = (value: unknown): value is AskQuestion => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as AskQuestion;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.prompt !== "string"
  ) {
    return false;
  }
  if (
    candidate.allow_multiple !== undefined &&
    typeof candidate.allow_multiple !== "boolean"
  ) {
    return false;
  }
  if (
    !Array.isArray(candidate.options) ||
    !candidate.options.every(isAskQuestionOption)
  ) {
    return false;
  }
  if (candidate.options.some((option) => option.id === OTHER_OPTION_ID)) {
    return false;
  }

  return hasUniqueIds(candidate.options.map((option) => option.id));
};

export const isAskQuestionPayload = (
  payload: unknown,
): payload is AskQuestionPayload => {
  if (typeof payload !== "object" || payload === null) return false;

  const candidate = payload as AskQuestionPayload;
  if (candidate.title !== undefined && typeof candidate.title !== "string") {
    return false;
  }
  if (!Array.isArray(candidate.questions) || !candidate.questions.length) {
    return false;
  }
  if (!candidate.questions.every(isAskQuestion)) return false;

  return hasUniqueIds(candidate.questions.map((question) => question.id));
};

export const serializeHitlResponse = (response: unknown): string =>
  typeof response === "string" ? response : JSON.stringify(response, null, 2);

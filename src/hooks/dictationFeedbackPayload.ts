export const MAX_DICTATION_FEEDBACK_TEXT_CHARS = 10_000;
export const MAX_DICTATION_FEEDBACK_REASON_CHARS = 2000;

export type DictationFeedbackPayload = {
  cleanedText: string;
  rawText: string;
  dictationId: string;
  category: string;
  reason: string;
};

export function buildDictationFeedbackPayload(input: DictationFeedbackPayload) {
  return {
    cleanedText: input.cleanedText.slice(0, MAX_DICTATION_FEEDBACK_TEXT_CHARS),
    rawText: input.rawText.slice(0, MAX_DICTATION_FEEDBACK_TEXT_CHARS),
    dictationId: input.dictationId,
    category: input.category,
    reason: input.reason.slice(0, MAX_DICTATION_FEEDBACK_REASON_CHARS),
  };
}

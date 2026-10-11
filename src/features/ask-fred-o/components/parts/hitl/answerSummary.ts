import type { AskQuestion } from "./hitlContract";
import { OTHER_OPTION_ID } from "./hitlContract";

export type AskQuestionSelections = Record<string, string[]>;
export type AskQuestionOtherText = Record<string, string>;

const labelsFor = (
  question: AskQuestion,
  selectedIds: string[],
  otherValue: string | undefined,
): string[] => {
  const labels = selectedIds
    .filter((id) => id !== OTHER_OPTION_ID)
    .map(
      (id) => question.options.find((option) => option.id === id)?.label ?? id,
    );

  if (selectedIds.includes(OTHER_OPTION_ID) && otherValue) {
    labels.push(`Other: ${otherValue}`);
  }

  return labels;
};

export const buildAnswerSummary = (
  questions: AskQuestion[],
  selections: AskQuestionSelections,
  otherText: AskQuestionOtherText,
): string =>
  questions
    .map((question) => {
      const labels = labelsFor(
        question,
        selections[question.id] ?? [],
        otherText[question.id]?.trim(),
      );
      const answer = labels.length ? labels.join(", ") : "(no answer)";
      return `- ${question.prompt}\n  ${answer}`;
    })
    .join("\n");

export const canSubmitAnswers = (
  questions: AskQuestion[],
  selections: AskQuestionSelections,
  otherText: AskQuestionOtherText,
): boolean =>
  questions.some((question) => {
    const selectedIds = selections[question.id] ?? [];
    if (!selectedIds.length) return false;

    const hasNamedOption = selectedIds.some((id) => id !== OTHER_OPTION_ID);
    const hasOtherValue =
      selectedIds.includes(OTHER_OPTION_ID) &&
      Boolean(otherText[question.id]?.trim());

    return hasNamedOption || hasOtherValue;
  });

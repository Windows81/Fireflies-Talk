import type { CreateMessageInput } from "@firefliesai/fred-client";
import { ASK_FRED_O_SOURCE } from "../constants";

export type AskFredOSubmissionSource = "composer" | "hitl" | "suggestion";

interface AskFredOSubmitDecisionInput {
  hasLoadedBilling: boolean;
  isAllowedToUsePrompts: boolean;
  isLoading: boolean;
  question: string;
}

export const getAskFredOSubmitDecision = ({
  hasLoadedBilling,
  isAllowedToUsePrompts,
  isLoading,
  question,
}: AskFredOSubmitDecisionInput): "blocked" | "ignored" | "submit" => {
  if (!hasLoadedBilling || !isAllowedToUsePrompts) return "blocked";
  if (isLoading || !question.trim()) return "ignored";
  return "submit";
};

export const createAskFredOSubmitParams = (
  question: string,
): Omit<CreateMessageInput, "query"> & { input: string } => ({
  input: question,
  source: ASK_FRED_O_SOURCE,
});

const AI_CREDITS_ERROR_TOKEN = "don't have enough ai credits";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return String(error ?? "");
};

export const isAskFredCreditsError = (error: unknown): boolean => {
  return getErrorMessage(error).toLowerCase().includes(AI_CREDITS_ERROR_TOKEN);
};

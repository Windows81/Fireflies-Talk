export interface AskFredOBillingAccessSnapshot {
  isAllowed: boolean;
  isFreeUser: boolean;
  promptsLeft: number;
  monthlyCreditsRemaining: number;
  hasCreditsSubscription: boolean;
}

export const hasAskFredOBillingAccessRecovered = (
  before: AskFredOBillingAccessSnapshot,
  current: AskFredOBillingAccessSnapshot,
): boolean => {
  if (!current.isAllowed) return false;
  if (!before.isAllowed) return true;
  if (before.isFreeUser && !current.isFreeUser) return true;
  if (!before.hasCreditsSubscription && current.hasCreditsSubscription) {
    return true;
  }
  return (
    current.promptsLeft > before.promptsLeft ||
    current.monthlyCreditsRemaining > before.monthlyCreditsRemaining
  );
};

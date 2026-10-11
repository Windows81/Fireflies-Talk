import { storage } from "@/features/storage";
import type { ConsentChannel } from "@/features/recording-consent";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { withoutLiftedRequirements } from "./consentRequirementsSeen";
import type { DesktopConsentPolicy } from "./desktopConsentPolicy";

interface ConsentRequirementsSeenState {
  /** Per account, since a machine can be shared between teams. */
  seenByAccount: Record<string, ConsentChannel[]>;
}

/**
 * The admin requirements each account has seen the consent card name. Kept
 * across launches, so a requirement added while the app was closed still
 * brings the card back on the next one.
 */
export const useConsentRequirementsSeenStore = create(
  persist<ConsentRequirementsSeenState>(() => ({ seenByAccount: {} }), {
    name: "consentRequirementsSeen",
    storage: createJSONStorage(() => storage),
  }),
);

function setSeen(accountId: string, channels: ConsentChannel[]): void {
  useConsentRequirementsSeenStore.setState((state) => ({
    seenByAccount: { ...state.seenByAccount, [accountId]: channels },
  }));
}

function seenBy(accountId: string): ConsentChannel[] {
  return (
    useConsentRequirementsSeenStore.getState().seenByAccount[accountId] ?? []
  );
}

/** Added to, never replaced: a row hidden for a moment stays seen. */
export function markConsentRequirementsSeen(
  accountId: string,
  channels: readonly ConsentChannel[],
): void {
  const seen = seenBy(accountId);
  const added = channels.filter((channel) => !seen.includes(channel));
  if (added.length > 0) setSeen(accountId, [...seen, ...added]);
}

export function forgetLiftedConsentRequirements(
  accountId: string,
  policy: DesktopConsentPolicy,
): void {
  const seen = seenBy(accountId);
  const kept = withoutLiftedRequirements(seen, policy);
  if (kept.length < seen.length) setSeen(accountId, kept);
}

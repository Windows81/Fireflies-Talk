import { create } from "zustand";
import {
  type DesktopConsentPolicy,
  NO_CONSENT_REQUIRED,
  isSameDesktopConsentPolicy,
} from "./desktopConsentPolicy";

interface ConsentPolicyState {
  policy: DesktopConsentPolicy;
  /** False until the first successful read of this session. */
  loaded: boolean;
}

/**
 * Module state rather than screen state, like the consent setup prompt: the
 * desktop home screen is mounted several times, and Settings and the live
 * view read the same answer. Not persisted: the desktop only records while
 * online, and the policy is re-read right before every start.
 */
export const useConsentPolicyStore = create<ConsentPolicyState>(() => ({
  policy: NO_CONSENT_REQUIRED,
  loaded: false,
}));

export function getDesktopConsentPolicy(): DesktopConsentPolicy {
  return useConsentPolicyStore.getState().policy;
}

export function setDesktopConsentPolicy(policy: DesktopConsentPolicy): void {
  const current = useConsentPolicyStore.getState();
  if (current.loaded && isSameDesktopConsentPolicy(current.policy, policy)) {
    return;
  }
  useConsentPolicyStore.setState({ policy, loaded: true });
}

/** On sign-out: the next account must not inherit this one's requirements. */
export function resetDesktopConsentPolicy(): void {
  useConsentPolicyStore.setState({
    policy: NO_CONSENT_REQUIRED,
    loaded: false,
  });
}

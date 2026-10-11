import { Logger } from "@/logger";
import {
  getDesktopConsentPolicy,
  setDesktopConsentPolicy,
} from "./consentPolicy.store";
import { fetchDesktopConsentPolicy } from "./consentPolicyQuery";
import type { DesktopConsentPolicy } from "./desktopConsentPolicy";

const log = new Logger("ConsentPolicy");

/** How long a record start waits for a fresh answer before using the last one. */
export const START_REFRESH_TIMEOUT_MS = 3_000;

/**
 * How long the shared read may stay in flight. Past this, a later refresh
 * starts another request. The start wait above is shorter on purpose: a slow
 * reply can still land for the next start, and a request that never settles
 * must not occupy the slot forever.
 */
export const READ_DEADLINE_MS = 15_000;

interface RefresherTimers {
  setTimer: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer: (handle: ReturnType<typeof setTimeout>) => void;
}

/**
 * Reads the team's policy into the store. Concurrent callers share one
 * request, so the several home-screen copies and a record start never fan out
 * into parallel reads. A failed read keeps the last value. `invalidate` drops
 * the in-flight result; sign-out uses it so the previous account cannot write
 * its policy back or lend its request to the next one.
 */
export function createConsentPolicyRefresher(
  fetchPolicy: () => Promise<DesktopConsentPolicy>,
  // Wrapped, not stored: the browser rejects setTimeout called as a method of
  // another object ("Illegal invocation"), which would fail every start.
  timers: RefresherTimers = {
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle),
  },
) {
  let inFlight: Promise<void> | null = null;
  let generation = 0;

  const readWithinDeadline = (): Promise<DesktopConsentPolicy> => {
    let handle: ReturnType<typeof setTimeout> | null = null;
    const pending = fetchPolicy();
    // The race settles once. A fetch that loses it, or rejects after being
    // abandoned, must not surface as an unhandled rejection.
    void pending.catch(() => undefined);
    const timeout = new Promise<never>((_, reject) => {
      handle = timers.setTimer(
        () => reject(new Error("Consent policy read timed out")),
        READ_DEADLINE_MS,
      );
    });
    return Promise.race([pending, timeout]).finally(() => {
      if (handle !== null) timers.clearTimer(handle);
    });
  };

  const refresh = (): Promise<void> => {
    if (inFlight) return inFlight;

    const requestGeneration = generation;
    const request = readWithinDeadline()
      .then((policy) => {
        if (requestGeneration !== generation) return;
        setDesktopConsentPolicy(policy);
      })
      .catch((error: unknown) => {
        if (requestGeneration !== generation) return;
        log.warn("Failed to read the team consent policy", { error });
      })
      .finally(() => {
        if (inFlight === request) inFlight = null;
      });
    inFlight = request;
    return request;
  };

  const invalidate = (): void => {
    generation += 1;
    inFlight = null;
  };

  /**
   * The policy a record start should apply: a fresh read when it lands within
   * the budget, otherwise the last known one. The late reply still applies to
   * the next start, so a slow network costs at most one stale decision.
   */
  const ensureFresh = async (
    timeoutMs = START_REFRESH_TIMEOUT_MS,
  ): Promise<DesktopConsentPolicy> => {
    let handle: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<void>((resolve) => {
      handle = timers.setTimer(resolve, timeoutMs);
    });
    try {
      await Promise.race([refresh(), timeout]);
    } finally {
      if (handle !== null) timers.clearTimer(handle);
    }
    return getDesktopConsentPolicy();
  };

  return { refresh, ensureFresh, invalidate };
}

const defaultRefresher = createConsentPolicyRefresher(
  fetchDesktopConsentPolicy,
);

export const refreshDesktopConsentPolicy = defaultRefresher.refresh;
export const ensureFreshDesktopConsentPolicy = defaultRefresher.ensureFresh;
export const invalidateDesktopConsentPolicyRefresh =
  defaultRefresher.invalidate;

import { Logger } from "@/logger";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { isDesktop } from "@/utils/device";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { globalModalsApi } from "../global-modals/global-modals.store";
import { storage } from "../storage";
import {
  COOLDOWN_DAYS_AFTER_MAX_SHOWN,
  COOLDOWN_DAYS_AFTER_SUBMIT,
  FEEDBACK_NUDGE_MODAL_NAME,
  MAX_SHOWS_PER_CYCLE,
  MIN_RECORDINGS_BEFORE_NUDGE,
  NUDGE_DELAY_MS,
} from "./constants";

const logger = new Logger("feedback-nudge");

const STORAGE_KEY = "feedback-nudge";

function daysSince(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

/**
 * Read the persisted state directly from storage.
 * Needed because the main window's in-memory Zustand state won't reflect
 * writes made by the live window (separate Electron BrowserWindow / React instance).
 */
function readPersistedState(): Partial<FeedbackNudgeStore> | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * Write the pendingNudge flag directly to storage.
 * Ensures the flag is visible to other windows immediately.
 */
function writePersistedPendingNudge(value: boolean): void {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state = { ...parsed.state, pendingNudge: value };
    storage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (err) {
    logger.error(`writePersistedPendingNudge failed: ${err}`);
  }
}

interface FeedbackNudgeStore {
  lastShownTimestamp: number | null;
  lastDismissedTimestamp: number | null;
  lastSubmittedTimestamp: number | null;
  /** Set by the live window to signal the main window to show the nudge */
  pendingNudge: boolean;
  /** Lifetime counter of successful recordings — never resets */
  successfulRecordingsCount: number;
  /** Times the nudge has been shown in the current cycle (0, 1, or 2) */
  shownCount: number;

  requestNudge: () => void;
  showPendingNudge: () => void;
  markDismissed: () => void;
  markSubmitted: () => void;
  incrementRecordingsCount: () => void;
}

function shouldShowNudge(state: FeedbackNudgeStore): boolean {
  const {
    successfulRecordingsCount,
    lastShownTimestamp,
    lastSubmittedTimestamp,
    shownCount,
  } = state;

  // Not enough recordings yet
  if (successfulRecordingsCount < MIN_RECORDINGS_BEFORE_NUDGE) {
    logger.info(
      `shouldShowNudge: only ${successfulRecordingsCount} recordings, need ${MIN_RECORDINGS_BEFORE_NUDGE}`,
    );
    return false;
  }

  // Never shown before — eligible
  if (!lastShownTimestamp) {
    logger.info("shouldShowNudge: never shown before, eligible");
    return true;
  }

  // Determine if the current cycle is over
  const submittedAfterLastShow =
    lastSubmittedTimestamp != null &&
    lastSubmittedTimestamp >= (lastShownTimestamp ?? 0);
  const cycleOver = shownCount >= MAX_SHOWS_PER_CYCLE || submittedAfterLastShow;

  // Cycle not over — still have shows left
  if (!cycleOver) {
    logger.info(
      `shouldShowNudge: cycle not over, shownCount=${shownCount}, eligible`,
    );
    return true;
  }

  // Cycle over due to feedback submission — wait 60 days
  if (submittedAfterLastShow) {
    const days = daysSince(lastSubmittedTimestamp);
    const eligible = days >= COOLDOWN_DAYS_AFTER_SUBMIT;
    logger.info(
      `shouldShowNudge: cycle over (submitted), ${days.toFixed(1)} days ago, need ${COOLDOWN_DAYS_AFTER_SUBMIT}, eligible=${eligible}`,
    );
    return eligible;
  }

  // Cycle over due to max shows — wait 14 days
  const days = daysSince(lastShownTimestamp);
  const eligible = days >= COOLDOWN_DAYS_AFTER_MAX_SHOWN;
  logger.info(
    `shouldShowNudge: cycle over (max shows), ${days.toFixed(1)} days ago, need ${COOLDOWN_DAYS_AFTER_MAX_SHOWN}, eligible=${eligible}`,
  );
  return eligible;
}

export const useFeedbackNudgeStore = create(
  persist<FeedbackNudgeStore>(
    (set, get) => ({
      lastShownTimestamp: null,
      lastDismissedTimestamp: null,
      lastSubmittedTimestamp: null,
      pendingNudge: false,
      successfulRecordingsCount: 0,
      shownCount: 0,

      requestNudge: () => {
        logger.info("requestNudge called", { isDesktop });

        if (!isDesktop) {
          logger.info("requestNudge: skipped, not desktop");
          return;
        }

        const state = get();
        logger.info("requestNudge: checking eligibility", {
          successfulRecordingsCount: state.successfulRecordingsCount,
          shownCount: state.shownCount,
          lastShownTimestamp: state.lastShownTimestamp,
          lastSubmittedTimestamp: state.lastSubmittedTimestamp,
        });

        if (!shouldShowNudge(state)) {
          logger.info("requestNudge: skipped, cooldown not met");
          return;
        }

        logger.info("requestNudge: setting pendingNudge flag for main window");
        // Write directly to storage so the main window can see it
        // (Zustand in-memory state doesn't sync across Electron windows)
        writePersistedPendingNudge(true);
      },

      showPendingNudge: () => {
        // Read directly from storage since the flag was set by the live window
        // (a separate Electron BrowserWindow with its own Zustand instance)
        const persisted = readPersistedState();
        const pending = persisted?.pendingNudge ?? false;

        logger.info("showPendingNudge called", {
          pendingNudge: pending,
          persistedState: persisted,
        });

        if (!pending) return;

        // Clear the flag immediately to avoid showing twice
        writePersistedPendingNudge(false);
        set({ pendingNudge: false });

        // Build state for eligibility check from persisted values
        // (main window's in-memory state may be stale)
        const cooldownState = {
          successfulRecordingsCount: persisted?.successfulRecordingsCount ?? 0,
          shownCount: persisted?.shownCount ?? 0,
          lastShownTimestamp: persisted?.lastShownTimestamp ?? null,
          lastDismissedTimestamp: persisted?.lastDismissedTimestamp ?? null,
          lastSubmittedTimestamp: persisted?.lastSubmittedTimestamp ?? null,
        } as FeedbackNudgeStore;

        if (!shouldShowNudge(cooldownState)) {
          logger.info("showPendingNudge: skipped, not eligible");
          return;
        }

        logger.info(
          `showPendingNudge: scheduling modal in ${NUDGE_DELAY_MS}ms`,
        );

        // Determine if a new cycle is starting (previous cycle was over + cooldown passed)
        const { shownCount, lastShownTimestamp, lastSubmittedTimestamp } =
          cooldownState;
        const submittedAfterLastShow =
          lastSubmittedTimestamp != null &&
          lastSubmittedTimestamp >= (lastShownTimestamp ?? 0);
        const wasOver =
          shownCount >= MAX_SHOWS_PER_CYCLE || submittedAfterLastShow;
        const newShownCount = wasOver ? 1 : shownCount + 1;

        setTimeout(() => {
          logger.info("showPendingNudge: opening feedback nudge modal");
          globalModalsApi.openModal(FEEDBACK_NUDGE_MODAL_NAME);
          set({
            lastShownTimestamp: Date.now(),
            shownCount: newShownCount,
          });
          tracker.track(TRACKING_EVENTS.FEEDBACK_NUDGE_SHOWN);
        }, NUDGE_DELAY_MS);
      },

      markDismissed: () => {
        logger.info("markDismissed: user dismissed nudge");
        set({ lastDismissedTimestamp: Date.now() });
        tracker.track(TRACKING_EVENTS.FEEDBACK_NUDGE_DISMISSED);
      },

      markSubmitted: () => {
        logger.info("markSubmitted: user submitted feedback");
        set({ lastSubmittedTimestamp: Date.now() });
        tracker.track(TRACKING_EVENTS.FEEDBACK_NUDGE_SUBMITTED);
      },

      incrementRecordingsCount: () => {
        const current = get().successfulRecordingsCount;
        logger.info(`incrementRecordingsCount: ${current} -> ${current + 1}`);
        set({ successfulRecordingsCount: current + 1 });
      },
    }),
    {
      name: "feedback-nudge",
      storage: createJSONStorage(() => storage),
      // Only persist state fields, not actions
      partialize: (state) =>
        ({
          lastShownTimestamp: state.lastShownTimestamp,
          lastDismissedTimestamp: state.lastDismissedTimestamp,
          lastSubmittedTimestamp: state.lastSubmittedTimestamp,
          pendingNudge: state.pendingNudge,
          successfulRecordingsCount: state.successfulRecordingsCount,
          shownCount: state.shownCount,
        }) as FeedbackNudgeStore,
    },
  ),
);

export const feedbackNudgeApi = useFeedbackNudgeStore.getState() as Pick<
  FeedbackNudgeStore,
  | "requestNudge"
  | "showPendingNudge"
  | "markDismissed"
  | "markSubmitted"
  | "incrementRecordingsCount"
>;

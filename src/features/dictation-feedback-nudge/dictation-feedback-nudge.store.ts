import { storage } from "@/features/storage";
import type { DictationEntry } from "@/hooks/dictationHistoryEntries";
import { Logger } from "@/logger";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isDesktop } from "@/utils/device";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  EMPTY_NUDGE_STATE,
  adoptServerTimesShown,
  markCompletedInState,
  markShownInState,
  migrateNudgePersistedState,
  recordDictationInState,
  seedFromHistoryInState,
  type UserNudgeState,
} from "./nudgeState";

const logger = new Logger("dictation-feedback-nudge");

interface DictationFeedbackNudgeStore {
  /**
   * Kept per user: a machine is shared between accounts, and one account must
   * not spend or suppress another's offer.
   */
  byUser: Record<string, UserNudgeState>;

  recordDictation: (entry: Pick<DictationEntry, "userId" | "kind">) => void;
  markNudgeShown: (userId: string) => void;
  markNudgeCompleted: (userId: string) => void;
  syncServerTimesShown: (userId: string, serverTimesSeen: number) => void;
  seedFromHistory: (userId: string, spokenCount: number) => void;
}

/** Stable empty state, so a user with no record yet keeps one reference. */
export const selectNudgeState =
  (userId?: string) =>
  (store: DictationFeedbackNudgeStore): UserNudgeState =>
    (userId && store.byUser[userId]) || EMPTY_NUDGE_STATE;

export const useDictationFeedbackNudge = create(
  persist<DictationFeedbackNudgeStore>(
    (set, get) => {
      const updateUser = (userId: string, next: UserNudgeState) =>
        set({ byUser: { ...get().byUser, [userId]: next } });

      return {
        byUser: {},

        recordDictation: ({ userId, kind }) => {
          if (!isDesktop || !userId) return;

          const prev = get().byUser[userId] ?? EMPTY_NUDGE_STATE;
          const next = recordDictationInState(prev, kind);
          if (!next) return;

          updateUser(userId, next);
          if (!next.nudgePending || prev.nudgePending) return;

          logger.info(
            `reached ${next.completedDictations} dictations, offering feedback`,
          );
        },

        markNudgeShown: (userId) => {
          const prev = get().byUser[userId] ?? EMPTY_NUDGE_STATE;
          if (prev.completed) return;

          const next = markShownInState(prev);
          updateUser(userId, next);
          tracker.track(TRACKING_EVENTS.DICTATION_FEEDBACK_NUDGE_SHOWN, {
            milestone: prev.nextMilestone ?? 0,
            timesSeen: next.timesShown,
          });
        },

        markNudgeCompleted: (userId) => {
          const prev = get().byUser[userId] ?? EMPTY_NUDGE_STATE;
          updateUser(userId, markCompletedInState(prev));
        },

        seedFromHistory: (userId, spokenCount) => {
          // A record means the user was already tracked; never overwrite it.
          if (!userId || get().byUser[userId]) return;
          updateUser(userId, seedFromHistoryInState(spokenCount));
          logger.info(`seeded ${spokenCount} dictations from history`);
        },

        syncServerTimesShown: (userId, serverTimesSeen) => {
          const prev = get().byUser[userId] ?? EMPTY_NUDGE_STATE;
          if (serverTimesSeen <= prev.timesShown) return;
          updateUser(userId, adoptServerTimesShown(prev, serverTimesSeen));
        },
      };
    },
    {
      name: "dictation-feedback-nudge",
      storage: createJSONStorage(() => storage),
      version: 3,
      migrate: (persistedState, version) =>
        migrateNudgePersistedState(
          persistedState,
          version,
        ) as DictationFeedbackNudgeStore,
      partialize: (state) =>
        ({ byUser: state.byUser }) as DictationFeedbackNudgeStore,
    },
  ),
);

export const dictationFeedbackNudgeApi =
  useDictationFeedbackNudge.getState() as Pick<
    DictationFeedbackNudgeStore,
    | "recordDictation"
    | "markNudgeShown"
    | "markNudgeCompleted"
    | "seedFromHistory"
  >;

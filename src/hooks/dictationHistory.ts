import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/features/storage";
import {
  addActiveDay,
  addDictationCount,
  addLifetimeWords,
  appendDictationHistory,
  clearUserDictationHistory,
  markDictationPasted,
  removeDictationEntry,
  isLiveMilestone,
  toMilestoneUnlock,
  type DictationActiveDays,
  type DictationCelebratedMilestones,
  type DictationCounts,
  type DictationEntry,
  type DictationLifetimeWords,
  type PendingMilestone,
} from "./dictationHistoryEntries";

export type { DictationEntry } from "./dictationHistoryEntries";
export {
  getActiveDays,
  getDictationCount,
  getLifetimeWords,
} from "./dictationHistoryEntries";
export type { PendingMilestone } from "./dictationHistoryEntries";

interface DictationHistoryStore {
  entries: DictationEntry[];
  /** Words dictated per user — see DictationLifetimeWords. */
  lifetimeWords?: DictationLifetimeWords;
  /**
   * Day keys each user dictated on. Held separately for the same reason as
   * lifetimeWords: `entries` is capped, and evicting entries must not erase a
   * streak or blank out days in the month grid.
   */
  activeDays?: DictationActiveDays;
  /** Milestones each user has been congratulated for — see the type. */
  celebratedMilestones?: DictationCelebratedMilestones;
  /**
   * Milestones crossed but not yet celebrated, per user. Held in the store
   * rather than shown on the spot: crossing one mid-dictation would put a modal
   * in front of the text the user is still waiting to have pasted. The
   * dictation stats card shows it the next time that screen is open, and
   * persisting it means quitting first doesn't swallow the moment.
   */
  pendingMilestones?: Record<string, PendingMilestone>;
  /** Spoken dictations per user; survives deletes and clears. */
  dictationCounts?: DictationCounts;
  addEntry: (entry: Omit<DictationEntry, "id"> & { id: string }) => void;
  setPasteResult: (result: { id: string; pasted: boolean }) => void;
  clearPendingMilestone: (userId: string) => void;
  removeEntry: (id: string) => void;
  /** Removes every entry of one user; their stats are kept. */
  clearEntries: (userId: string) => void;
}

export const useDictationHistory = create(
  persist<DictationHistoryStore>(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => {
          const entries = appendDictationHistory(state.entries, entry);
          const lifetimeWords = addLifetimeWords(state, entry);
          // A rung the ladder has since dropped is not holding the slot: it
          // can never be shown, so waiting for it would cost the user every
          // milestone after it.
          const ownPending = getPendingMilestone(state, entry.userId);
          const unlock = toMilestoneUnlock(
            state,
            entry,
            lifetimeWords[entry.userId] ?? 0,
            ownPending !== undefined,
          );
          return {
            entries,
            lifetimeWords,
            activeDays: addActiveDay(state, entry),
            celebratedMilestones: {
              ...state.celebratedMilestones,
              [entry.userId]: unlock.celebrated,
            },
            // An unseen milestone is not overwritten by a later one: the user
            // gets the first they earned, and the next is picked up by the
            // dictation after that one is cleared.
            pendingMilestones: unlock.pending
              ? { ...state.pendingMilestones, [entry.userId]: unlock.pending }
              : state.pendingMilestones,
            dictationCounts: addDictationCount(state, entry),
          };
        }),
      setPasteResult: (result) =>
        set((state) => ({
          entries: markDictationPasted(state.entries, result),
        })),
      clearPendingMilestone: (userId) =>
        set((state) => {
          const pendingMilestones = { ...state.pendingMilestones };
          delete pendingMilestones[userId];
          return { pendingMilestones };
        }),
      removeEntry: (id) => set((state) => removeDictationEntry(state, id)),
      clearEntries: (userId) =>
        set((state) => clearUserDictationHistory(state, userId)),
    }),
    {
      name: "dictation-history",
      storage: createJSONStorage(() => storage),
    },
  ),
);

export const addDictationEntry = (
  entry: Omit<DictationEntry, "id"> & { id: string },
) => useDictationHistory.getState().addEntry(entry);

export const clearPendingMilestone = (userId: string) =>
  useDictationHistory.getState().clearPendingMilestone(userId);

/**
 * This user's waiting card, if they have one the ladder still has. A rung
 * dropped since it was stored reads as nothing waiting, and the next crossing
 * writes over it.
 */
export const getPendingMilestone = (
  state: { pendingMilestones?: Record<string, PendingMilestone> },
  userId: string | undefined,
): PendingMilestone | undefined => {
  const pending = userId ? state.pendingMilestones?.[userId] : undefined;
  return pending && isLiveMilestone(pending) ? pending : undefined;
};

export const setDictationPasteResult = (result: {
  id: string;
  pasted: boolean;
}) => useDictationHistory.getState().setPasteResult(result);

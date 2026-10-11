import { storage } from "@/features/storage";
import type { DictationEntry } from "@/hooks/dictationHistoryEntries";
import { Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  adoptServerShows,
  hasNewerServerShows,
  markNudgeShown,
  type NudgeShows,
} from "./schedule";

export type AssistantDictationEntry = Pick<
  DictationEntry,
  "kind" | "pasted" | "pastedApp"
>;

interface AssistantPasteMark {
  userId: string;
  at: number;
}

export interface DictationAssistantNudgeStore<Nudge extends NudgeShows, Offer> {
  byUser: Record<string, Nudge>;
  lastPaste: AssistantPasteMark | null;
  offer: Offer | null;

  recordDictation: (
    entry: Pick<DictationEntry, "userId" | "kind" | "pasted" | "pastedApp">,
  ) => void;
  markShown: (userId: string, now: number) => void;
  syncServerSeen: (userId: string, shows: NudgeShows) => void;
  setOffer: (offer: Offer | null) => void;
}

interface DictationAssistantNudgeStoreConfig<Nudge extends NudgeShows> {
  /** Persisted storage key, also the logger name. */
  name: string;
  empty: Nudge;
  /** The state after one more dictation, or null when this one changes nothing. */
  record: (prev: Nudge, entry: AssistantDictationEntry) => Nudge | null;
  isOwed: (nudge: Nudge, now: number) => boolean;
  describeMilestone: (nudge: Nudge) => string;
}

export function createDictationAssistantNudgeStore<
  Nudge extends NudgeShows,
  Offer,
>(config: DictationAssistantNudgeStoreConfig<Nudge>) {
  const logger = new Logger(config.name);

  return create<DictationAssistantNudgeStore<Nudge, Offer>>()(
    persist(
      (set, get) => {
        const updateUser = (userId: string, next: Nudge) =>
          set({ byUser: { ...get().byUser, [userId]: next } });

        return {
          byUser: {},
          lastPaste: null,
          offer: null,

          recordDictation: ({ userId, ...entry }) => {
            if (!isDesktop || !userId) return;

            const prev = get().byUser[userId] ?? config.empty;
            const next = config.record(prev, entry);
            if (!next) return;

            const now = Date.now();
            updateUser(userId, next);
            set({ lastPaste: { userId, at: now } });

            if (!config.isOwed(next, now) || config.isOwed(prev, now)) return;

            logger.info(config.describeMilestone(next));
          },

          markShown: (userId, now) => {
            const prev = get().byUser[userId] ?? config.empty;
            updateUser(userId, markNudgeShown(prev, now));
          },

          syncServerSeen: (userId, shows) => {
            const prev = get().byUser[userId] ?? config.empty;
            if (!hasNewerServerShows(prev, shows)) return;

            updateUser(userId, adoptServerShows(prev, shows));
          },

          setOffer: (offer) => set({ offer }),
        };
      },
      {
        name: config.name,
        storage: createJSONStorage(() => storage),
        version: 1,
        partialize: (state) => ({ byUser: state.byUser }),
      },
    ),
  );
}

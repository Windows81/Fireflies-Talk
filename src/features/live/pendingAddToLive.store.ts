import { create } from "zustand";

/** How long to show the "Notetaker will join shortly" banner before giving up. */
export const PENDING_ADD_TO_LIVE_TTL_MS = 2 * 60 * 1000;

export interface PendingAddToLive {
  /** Stable key — the created meeting id when known, otherwise the url. */
  id: string;
  url: string;
  meetingId?: string;
  createdAt: number;
}

interface PendingAddToLiveState {
  pending: PendingAddToLive[];
  add: (entry: { id: string; url: string; meetingId?: string }) => void;
  remove: (id: string) => void;
}

// Per-entry auto-expiry timers, kept outside the store so they don't trigger
// renders. Cleared when an entry is removed (resolved or replaced).
const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

const clearTimer = (id: string) => {
  const timer = expiryTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    expiryTimers.delete(id);
  }
};

export const usePendingAddToLiveStore = create<PendingAddToLiveState>(
  (set, get) => ({
    pending: [],
    add: ({ id, url, meetingId }) => {
      clearTimer(id);
      expiryTimers.set(
        id,
        setTimeout(() => get().remove(id), PENDING_ADD_TO_LIVE_TTL_MS),
      );
      set((state) => ({
        pending: [
          ...state.pending.filter((entry) => entry.id !== id),
          { id, url, meetingId, createdAt: Date.now() },
        ],
      }));
    },
    remove: (id) => {
      clearTimer(id);
      set((state) => ({
        pending: state.pending.filter((entry) => entry.id !== id),
      }));
    },
  }),
);

/** Imperative access for non-React callers (mutation success handlers). */
export const pendingAddToLiveApi = {
  add: (entry: { id: string; url: string; meetingId?: string }) =>
    usePendingAddToLiveStore.getState().add(entry),
  remove: (id: string) => usePendingAddToLiveStore.getState().remove(id),
};

import { create } from "zustand";
import type { FredJoinedMeetingData } from "@/features/desktop-notifications/useRealtimeNotifications";

/**
 * How long a real-time "Fred joined" signal stays valid. Long enough to cover a
 * meeting, after which the entry is dropped so the store doesn't grow unbounded
 * (the banner itself is already bounded by the event's live window).
 */
export const BOT_JOINED_TTL_MS = 4 * 60 * 60 * 1000;

export interface BotJoinedMeeting {
  meetingId: string;
  title?: string | null;
  joinedAt: number;
}

interface BotJoinedState {
  joined: BotJoinedMeeting[];
  add: (data: FredJoinedMeetingData) => void;
  remove: (meetingId: string) => void;
}

// Per-entry auto-expiry timers kept outside the store so they don't trigger
// renders. Cleared when an entry is replaced or removed.
const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

const clearTimer = (meetingId: string) => {
  const timer = expiryTimers.get(meetingId);
  if (timer) {
    clearTimeout(timer);
    expiryTimers.delete(meetingId);
  }
};

export const useBotJoinedStore = create<BotJoinedState>((set, get) => ({
  joined: [],
  add: (data) => {
    if (!data.meetingId) return;
    clearTimer(data.meetingId);
    expiryTimers.set(
      data.meetingId,
      setTimeout(() => get().remove(data.meetingId), BOT_JOINED_TTL_MS),
    );
    set((state) => ({
      joined: [
        ...state.joined.filter((entry) => entry.meetingId !== data.meetingId),
        { meetingId: data.meetingId, title: data.title, joinedAt: Date.now() },
      ],
    }));
  },
  remove: (meetingId) => {
    clearTimer(meetingId);
    set((state) => ({
      joined: state.joined.filter((entry) => entry.meetingId !== meetingId),
    }));
  },
}));

/** Imperative access for non-React callers (the SSE notification handler). */
export const botJoinedApi = {
  add: (data: FredJoinedMeetingData) => useBotJoinedStore.getState().add(data),
  remove: (meetingId: string) => useBotJoinedStore.getState().remove(meetingId),
};

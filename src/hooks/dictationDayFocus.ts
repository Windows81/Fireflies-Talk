import { create } from "zustand";

interface DictationDayFocusStore {
  /** Day key ("yyyy-MM-dd") the history list should scroll to, once. */
  requestedDay: string | null;
  requestDay: (dayKey: string) => void;
  clearRequest: () => void;
}

/**
 * Lets the streak grid point the history list at a day. The two live in
 * separate cards, so the request travels through here rather than through the
 * screen that renders both.
 */
export const useDictationDayFocus = create<DictationDayFocusStore>((set) => ({
  requestedDay: null,
  requestDay: (dayKey) => set({ requestedDay: dayKey }),
  clearRequest: () => set({ requestedDay: null }),
}));

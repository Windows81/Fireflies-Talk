import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";

interface RealRecordingsCountStoreValue {
  count: number;
  increment: () => void;
}

// Tracks completed real (non-demo) recordings. This is a fresh persisted key,
// so it starts at 0 for every install — including existing users — letting
// features gated on "at least N real recordings" apply retroactively with no
// separate migration.
export const realRecordingsCountStore = create(
  persist<RealRecordingsCountStoreValue>(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: "realRecordingsCount",
      storage: createJSONStorage(() => storage),
    },
  ),
);

export function incrementRealRecordingsCount(): void {
  realRecordingsCountStore.getState().increment();
}

export function getRealRecordingsCount(): number {
  return realRecordingsCountStore.getState().count;
}

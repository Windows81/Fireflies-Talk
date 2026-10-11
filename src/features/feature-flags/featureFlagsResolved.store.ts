import { create } from "zustand";

interface FeatureFlagsResolvedStore {
  resolvedUserId: string | null;
  setResolvedUserId: (userId: string | null) => void;
}

export const useFeatureFlagsResolved = create<FeatureFlagsResolvedStore>(
  (set) => ({
    resolvedUserId: null,
    setResolvedUserId: (userId) => set({ resolvedUserId: userId }),
  }),
);

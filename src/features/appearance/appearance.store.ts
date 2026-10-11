import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";

export type AppearancePreference = "system" | "light" | "dark";

interface AppearanceStoreValue {
  preference: AppearancePreference;
  setPreference(preference: AppearancePreference): void;
}

/** Device-local on purpose: each device keeps its own theme instead of syncing through the account. */
export const useAppearanceStore = create(
  persist<AppearanceStoreValue>(
    (set) => ({
      preference: "system",
      setPreference(preference: AppearancePreference) {
        set({ preference });
      },
    }),
    {
      name: "appearance-preference",
      storage: createJSONStorage(() => storage),
    },
  ),
);

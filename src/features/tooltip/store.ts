import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "../storage";

interface TooltipStore {
  shownTooltips: string[];
  isTooltipShown: (key: string) => boolean;
  markTooltipAsShown: (key: string) => void;
}

export const useTooltip = create<TooltipStore>()(
  persist(
    (set, get) => ({
      shownTooltips: [],
      isTooltipShown: (key: string) => {
        return get().shownTooltips.includes(key);
      },
      markTooltipAsShown: (key: string) => {
        set((state) => ({
          shownTooltips: state.shownTooltips.includes(key)
            ? state.shownTooltips
            : [...state.shownTooltips, key],
        }));
      },
    }),
    {
      name: "tooltip-store",
      storage: createJSONStorage(() => storage),
    },
  ),
);

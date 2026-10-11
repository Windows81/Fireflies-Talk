import { storage } from "@/features/storage";
import { useTooltip } from "@/features/tooltip";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HOME_WALKTHROUGH_STEPS } from "./steps";

const RECORD_BUTTON_TOOLTIP_KEY = "record-button-intro";

interface HomeScreenWalkthroughStore {
  completed: boolean;
  currentStepIndex: number;
  isActive: boolean;
  start: () => void;
  next: () => void;
  dismiss: () => void;
  reset: () => void;
}

export const useHomeScreenWalkthrough = create<HomeScreenWalkthroughStore>()(
  persist(
    (set, get) => ({
      completed: false,
      currentStepIndex: 0,
      isActive: false,

      start: () => {
        if (get().completed || get().isActive) return;
        useTooltip.getState().markTooltipAsShown(RECORD_BUTTON_TOOLTIP_KEY);
        set({ isActive: true, currentStepIndex: 0 });
      },

      next: () => {
        const nextIndex = get().currentStepIndex + 1;
        if (nextIndex >= HOME_WALKTHROUGH_STEPS.length) {
          set({ isActive: false, completed: true, currentStepIndex: 0 });
          return;
        }
        // Briefly hide the overlay so the previous step's Modal can animate
        // closed before the next step's Modal mounts. Two RN Modals
        // transitioning simultaneously can race and leave the next step
        // un-measured / invisible (notably on the header "+" target).
        set({ isActive: false, currentStepIndex: nextIndex });
        setTimeout(() => {
          if (get().completed) return;
          set({ isActive: true });
        }, 350);
      },

      dismiss: () => {
        set({ isActive: false, completed: true, currentStepIndex: 0 });
      },

      reset: () => {
        set({ completed: false, currentStepIndex: 0, isActive: false });
      },
    }),
    {
      name: "home-screen-walkthrough",
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ completed: state.completed }),
    },
  ),
);

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage as localStorageOrMemory } from "@/features/storage";

export interface WalkthroughStore {
  completed: boolean;
  currentStep: number;
  isVisible: boolean;
  start: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  dismiss: () => void;
  reset: () => void;
  totalSteps: number;
}

type WalkthroughHook = UseBoundStore<StoreApi<WalkthroughStore>>;

const stores = new Map<string, WalkthroughHook>();

function getOrCreateStore(name: string, totalSteps: number) {
  const existing = stores.get(name);
  if (existing) return existing;

  const store = create<WalkthroughStore>()(
    persist(
      (set, get) => ({
        completed: false,
        currentStep: 0,
        isVisible: false,
        totalSteps,

        start: () => {
          if (get().completed) return;
          set({ isVisible: true });
        },

        nextStep: () => {
          const { currentStep } = get();
          if (currentStep >= totalSteps - 1) {
            set({ isVisible: false, completed: true, currentStep: 0 });
          } else {
            set({ currentStep: currentStep + 1 });
          }
        },

        prevStep: () => {
          const { currentStep } = get();
          if (currentStep > 0) {
            set({ currentStep: currentStep - 1 });
          }
        },

        goToStep: (step: number) => {
          if (step >= totalSteps) {
            set({ isVisible: false, completed: true, currentStep: 0 });
          } else {
            set({ currentStep: Math.max(0, step) });
          }
        },

        dismiss: () => {
          set({ isVisible: false, completed: true, currentStep: 0 });
        },

        reset: () => {
          set({ completed: false, currentStep: 0, isVisible: false });
        },
      }),
      {
        name: `walkthrough-${name}`,
        storage: createJSONStorage(() => localStorageOrMemory),
        partialize: (state) => ({
          completed: state.completed,
          currentStep: state.currentStep,
        }),
      },
    ),
  );

  stores.set(name, store);
  return store;
}

export function useWalkthrough(name: string, totalSteps: number) {
  return getOrCreateStore(name, totalSteps)();
}

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";

export interface DesktopLifecycleState {
  /** Whether the app has been opened at least once (false = fresh install) */
  firstOpenCompleted: boolean;
  /** The last known app version (for detecting updates) */
  lastKnownVersion: string | null;
  /** Whether an auto-update was downloaded and pending install */
  pendingAutoUpdate: boolean;
  /** Epoch ms of the app's first open; null on installs predating this field */
  installedAt: number | null;
  installRef: string | null;
}

export interface DesktopLifecycleStore extends DesktopLifecycleState {
  setFirstOpenCompleted: (value: boolean) => void;
  setLastKnownVersion: (version: string) => void;
  setPendingAutoUpdate: (value: boolean) => void;
  setInstalledAt: (value: number) => void;
  setInstallRef: (value: string) => void;
}

const defaultState: DesktopLifecycleState = {
  firstOpenCompleted: false,
  lastKnownVersion: null,
  pendingAutoUpdate: false,
  installedAt: null,
  installRef: null,
};

export const useDesktopLifecycleStore = create(
  persist<DesktopLifecycleStore>(
    (set) => ({
      ...defaultState,
      setFirstOpenCompleted: (value: boolean) =>
        set({ firstOpenCompleted: value }),
      setLastKnownVersion: (version: string) =>
        set({ lastKnownVersion: version }),
      setPendingAutoUpdate: (value: boolean) =>
        set({ pendingAutoUpdate: value }),
      setInstalledAt: (value: number) => set({ installedAt: value }),
      setInstallRef: (value: string) => set({ installRef: value }),
    }),
    {
      name: "desktop-lifecycle",
      storage: createJSONStorage(() => storage),
    },
  ),
);

export const getDesktopLifecycleState = () => {
  return useDesktopLifecycleStore.getState();
};

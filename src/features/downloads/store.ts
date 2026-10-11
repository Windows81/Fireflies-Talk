import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";
import type { DownloadEntry, DownloadSettings } from "./types";
import { DownloadStatus, MediaDownloadMode } from "./types";

export * from "./types";

const DEFAULT_SETTINGS: DownloadSettings = {
  autoDownloadEnabled: false,
  maxCacheBytes: 500e6, // 512 MB
  wifiMode: MediaDownloadMode.VIDEO,
  cellularMode: MediaDownloadMode.OFF,
};

interface DownloadsStore {
  settings: DownloadSettings;
  index: DownloadEntry[];
  updateSettings: (update: Partial<DownloadSettings>) => void;
  upsert: (entry: DownloadEntry) => void;
  remove: (meetingId: string) => void;
  find: (meetingId: string) => DownloadEntry | undefined;

  // Refreshes the retention clock of entries still seen by the scan.
  markSeen: (meetingIds: string[], now: number) => void;

  // Size of all complete downloads, for display, in bytes
  getTotalMediaSize: () => number;

  // Size of completed cache (automatic downloaded) meetings, for display, in bytes.
  getCachedMediaSize: () => number;

  // Size of the manual downloads, for display, in bytes.
  getDownloadedMediaSize: () => number;

  reset: () => void;
}

// Downloads deliberately survive logout (no per-user scoping): auto entries age
// out via the retention sweep, manual ones only by explicit user delete.
export const useDownloads = create(
  persist<DownloadsStore>(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      index: [],
      updateSettings: (update) => {
        set({ settings: { ...get().settings, ...update } });
      },
      upsert: (entry) => {
        const rest = get().index.filter((e) => e.meetingId !== entry.meetingId);
        set({ index: [...rest, entry] });
      },
      remove: (meetingId) => {
        set({ index: get().index.filter((e) => e.meetingId !== meetingId) });
      },
      find: (meetingId) => {
        return get().index.find((e) => e.meetingId === meetingId);
      },
      markSeen: (meetingIds, now) => {
        const seen = new Set(meetingIds);
        set({
          index: get().index.map((e) =>
            seen.has(e.meetingId) ? { ...e, lastSeenAt: now } : e,
          ),
        });
      },
      getTotalMediaSize: () => {
        return get().index.reduce(
          (sum, e) =>
            e.status.state === DownloadStatus.COMPLETE
              ? sum + e.status.sizeBytes
              : sum,
          0,
        );
      },
      getCachedMediaSize: () => {
        return get().index.reduce(
          (sum, e) =>
            e.status.state === DownloadStatus.COMPLETE && !e.isManual
              ? sum + e.status.sizeBytes
              : sum,
          0,
        );
      },
      getDownloadedMediaSize: () => {
        return get().index.reduce(
          (sum, e) =>
            e.status.state === DownloadStatus.COMPLETE && e.isManual
              ? sum + e.status.sizeBytes
              : sum,
          0,
        );
      },
      reset: () => set({ index: [] }),
    }),
    {
      name: "downloads",
      storage: createJSONStorage(() => storage),
      version: 3,
      // pre-release resets: v1 persisted numeric enum values, v2 entries lack
      // the userId owner scoping — reset rather than remap in both cases
      migrate: (persistedState, version) => {
        const state = persistedState as DownloadsStore;
        if (version < 3) {
          return { ...state, settings: DEFAULT_SETTINGS, index: [] };
        }
        return state;
      },
    },
  ),
);

export const downloadsApi: Pick<
  DownloadsStore,
  | "updateSettings"
  | "upsert"
  | "remove"
  | "find"
  | "markSeen"
  | "getTotalMediaSize"
  | "getCachedMediaSize"
  | "getDownloadedMediaSize"
  | "reset"
> = useDownloads.getState();

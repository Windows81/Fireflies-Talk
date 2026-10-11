import { getMimeType } from "@/utils/mime";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";
import type { RecordingContext } from "./types";

export type LocalRecordingContext = Omit<RecordingContext, "fileUri"> & {
  fileUris: string[];
  durationMillis?: number;
  uploaded: boolean | "unknown";
  streamed: boolean | "unknown";
  mimeType: string;
  /**
   * Audio sampling rate in Hz (e.g., 16000, 44100, 48000).
   * @default 16000
   */
  audioSamplingRate?: number;
};

interface LocalRecordStore {
  recordings: LocalRecordingContext[];
  add: (recording: LocalRecordingContext) => void;
  removeByUri: (uri: string) => void;
  findByUri: (uri: string) => LocalRecordingContext | undefined;
  findByMeetingId: (meetingId: string) => LocalRecordingContext | undefined;
  updateByUri: (uri: string, update: Partial<LocalRecordingContext>) => void;
  updateByMeetingId: (
    meetingId: string,
    update: Partial<LocalRecordingContext>,
  ) => void;
}

/**
 * Keep track of unuploaded recordings
 */
export const useLocalRecordStore = create(
  persist<LocalRecordStore>(
    (set, get) => ({
      recordings: [],
      add: (recording) => {
        set({
          recordings: [...get().recordings, recording],
        });
      },
      removeByUri: (uri) => {
        set({
          recordings: get().recordings.filter(
            (r) => !r.fileUris?.some((u) => u === uri),
          ),
        });
      },
      findByUri: (uri) => {
        return get().recordings.find((r) => r.fileUris?.some((u) => u === uri));
      },
      findByMeetingId: (meetingId) => {
        return get().recordings.find((r) => r.meetingId === meetingId);
      },
      updateByUri: (uri, update) => {
        set({
          recordings: get().recordings.map((r) => {
            if (r.fileUris?.some((u) => u === uri)) {
              return { ...r, ...update };
            }
            return r;
          }),
        });
      },
      updateByMeetingId: (meetingId, update) => {
        set({
          recordings: get().recordings.map((r) => {
            if (r.meetingId === meetingId) {
              return { ...r, ...update };
            }
            return r;
          }),
        });
      },
    }),
    {
      name: "local-record",
      storage: createJSONStorage(() => storage),
      version: 2,
      migrate: (_persistedState, version) => {
        const persistedState = _persistedState as LocalRecordStore;

        if (version <= 0) {
          return {
            ...persistedState,
            recordings: persistedState?.recordings?.map((r) => ({
              ...r,
              // assume past recordings are uploaded
              uploaded: r.uploaded ?? "unknown",
            })),
          };
        }
        if (version <= 1) {
          // Add mimeType to recordings
          return {
            ...persistedState,
            recordings: persistedState?.recordings?.map((r) => ({
              ...r,
              mimeType:
                r.mimeType ||
                // Get the first available mimeType from fileUris, prefering the last one
                [...r.fileUris]
                  .reverse()
                  .map((uri) => getMimeType(uri))
                  .find((mimeType) => mimeType) ||
                "",
            })),
          };
        }
        return persistedState;
      },
    },
  ),
);

export const localRecordStoreApi = useLocalRecordStore.getState() as Pick<
  LocalRecordStore,
  | "add"
  | "removeByUri"
  | "findByUri"
  | "updateByUri"
  | "updateByMeetingId"
  | "findByMeetingId"
>;

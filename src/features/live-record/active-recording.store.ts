import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";
import { reconcileAbandonedRecording } from "./reconcile-abandoned-recording";
import type { RecordingContext, RecordingStates } from "./types";

/** A local recording that has a server meeting but no successful stop yet. */
export interface ActiveRecording {
  meetingId: string;
  /** Recorded (unpaused) time in ms at the last persist. */
  activeMs: number;
}

interface ActiveRecordingStore {
  recordings: ActiveRecording[];
}

export const useActiveRecordingStore = create(
  persist<ActiveRecordingStore>(
    () => ({
      recordings: [],
    }),
    {
      name: "active-recording",
      storage: createJSONStorage(() => storage),
      version: 1,
      // Nothing shipped with the pre-list shape, so any older payload can be
      // dropped wholesale.
      migrate: () => ({ recordings: [] }),
    },
  ),
);

export const activeRecordingStoreApi = {
  list: () => useActiveRecordingStore.getState().recordings,
  upsert: (recording: ActiveRecording) =>
    useActiveRecordingStore.setState((state) => ({
      recordings: state.recordings.some(
        (existing) => existing.meetingId === recording.meetingId,
      )
        ? state.recordings.map((existing) =>
            existing.meetingId === recording.meetingId ? recording : existing,
          )
        : [...state.recordings, recording],
    })),
  remove: (meetingId: string) =>
    useActiveRecordingStore.setState((state) => ({
      recordings: state.recordings.filter(
        (recording) => recording.meetingId !== meetingId,
      ),
    })),
};

const CHECKPOINT_INTERVAL_MS = 30_000;
let lastPersistAt = 0;

/**
 * Claim a record for a new recording. Records left by a previous launch (and
 * naming other meetings) belong to recordings nobody stopped, so they are
 * reconciled first — reconcile swallows its own errors and unresolved records
 * stay in the list.
 */
export async function claimActiveRecording(meetingId: string): Promise<void> {
  if (
    activeRecordingStoreApi
      .list()
      .some((recording) => recording.meetingId !== meetingId)
  ) {
    await reconcileAbandonedRecording();
  }
  lastPersistAt = Date.now();
  activeRecordingStoreApi.upsert({ meetingId, activeMs: 0 });
}

/**
 * Persist the recorded duration at most every CHECKPOINT_INTERVAL_MS while a
 * transcript-only recording runs, so a force-quit leaves a recent activeMs.
 */
export function checkpointActiveRecording(
  status: RecordingStates,
  context: RecordingContext | null,
): void {
  if (!context?.transcriptOnly || !context.meetingId) return;
  if (status.state !== "recording") return;

  const now = Date.now();
  if (now - lastPersistAt < CHECKPOINT_INTERVAL_MS) return;

  lastPersistAt = now;
  activeRecordingStoreApi.upsert({
    meetingId: context.meetingId,
    activeMs: status.durationMillis ?? 0,
  });
}

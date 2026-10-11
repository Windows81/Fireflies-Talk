import { apolloClient, UploadManualNotesDocument } from "@/graphql";
import { Logger } from "@/logger";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { type ManualNotesEntry, useManualNotesStore } from "./store";

const logger = new Logger("ManualNotesUpload");

const inFlightUploads = new Map<string, Promise<boolean>>();

const lastUploaded = new Map<string, ManualNotesEntry>();

interface UploadOptions {
  clearOnSuccess?: boolean;
}

const isUnchangedSinceLastUpload = (
  meetingId: string,
  entry: ManualNotesEntry,
): boolean => {
  const last = lastUploaded.get(meetingId);
  return (
    last !== undefined &&
    last.notes === entry.notes &&
    last.shouldMerge === entry.shouldMerge
  );
};

const finaliseLocalDraft = (meetingId: string) => {
  useManualNotesStore.getState().clearMeeting(meetingId);
  lastUploaded.delete(meetingId);
};

export const forgetUploadedSnapshot = (meetingId: string) => {
  lastUploaded.delete(meetingId);
};

/**
 * Upload the persisted manual-notes draft for `meetingId` to the dashboard
 * `uploadManualNotes` mutation.
 *
 * - Skips the network round-trip when the current draft is identical to the
 *   last successfully uploaded state (notes + shouldMerge match by value),
 *   so idle meetings produce no traffic on the 60s periodic schedule.
 * - Concurrent callers share a single in-flight request, so the meeting-end
 *   transition and the window-close handler can't double-fire.
 * - `clearOnSuccess` (default `true`) removes the local draft on success.
 *   When the dedup short-circuit fires under `clearOnSuccess: true`, the
 *   draft is still cleared because the snapshot's invariant guarantees the
 *   server already has this exact content (see `lastUploaded` above).
 */
export const uploadManualNotesForMeeting = async (
  meetingId: string,
  { clearOnSuccess = true }: UploadOptions = {},
): Promise<boolean> => {
  if (!meetingId) return false;

  const entry = useManualNotesStore.getState().byMeetingId[meetingId];
  if (!entry || !entry.notes.trim()) return false;

  if (isUnchangedSinceLastUpload(meetingId, entry)) {
    if (clearOnSuccess) {
      finaliseLocalDraft(meetingId);
    }
    return true;
  }

  let promise = inFlightUploads.get(meetingId);
  if (!promise) {
    promise = (async () => {
      try {
        const { data } = await apolloClient.mutate({
          mutation: UploadManualNotesDocument,
          variables: {
            meetingId,
            notes: entry.notes,
            shouldMerge: entry.shouldMerge,
          },
        });
        const ok = Boolean(data?.uploadManualNotes);
        if (ok) {
          // Fire the analytics event on the FIRST confirmed upload for
          // this meeting in this session — `lastUploaded` is our
          // session-scoped marker, and a missing entry at this point
          // means we haven't sent an upload for this meetingId yet.
          // Subsequent periodic / merge-toggle / final flushes for the
          // same meeting all see an existing entry and stay silent.
          const isFirstUploadForMeeting = !lastUploaded.has(meetingId);
          lastUploaded.set(meetingId, {
            notes: entry.notes,
            shouldMerge: entry.shouldMerge,
          });
          if (isFirstUploadForMeeting) {
            tracker.track(TRACKING_EVENTS.MANUAL_NOTES_UPLOADED, {
              meetingId,
            });
          }
        }
        return ok;
      } catch (error) {
        logger.error("Failed to upload manual notes", { meetingId, error });
        return false;
      } finally {
        inFlightUploads.delete(meetingId);
      }
    })();
    inFlightUploads.set(meetingId, promise);
  }

  const ok = await promise;
  if (ok && clearOnSuccess) {
    finaliseLocalDraft(meetingId);
  }
  return ok;
};

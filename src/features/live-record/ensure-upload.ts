import {
  adoptRecordingNotes,
  uploadManualNotesForMeeting,
} from "@/features/manual-notes";
import { createMeetingForUpload, UPLOAD_CLIENT_KEYS } from "@/features/upload";
import { isDesktop } from "@/utils/device";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import { localRecordStoreApi } from "./local-record.store";

export interface PendingRecording {
  fileUri: string;
  meetingId?: string;
  title?: string;
  notesPrivacy?: MeetingNotesPrivacy;
  language?: string;
  startTime?: number;
  endTime?: number;
}

const inflight = new Map<string, Promise<string>>();

/**
 * Recordings started offline have no meeting yet. Creates it on the first
 * upload attempt and persists the id, so a later retry reuses the same meeting
 * instead of creating a duplicate.
 * Single-flighted per file and re-read from the store: stop and the reconnect
 * scan can hit one file at once, and the scan's snapshot may predate the id.
 */
export async function ensureRecordingMeetingId(
  recording: PendingRecording,
): Promise<string> {
  const knownId =
    recording.meetingId ??
    localRecordStoreApi.findByUri(recording.fileUri)?.meetingId;
  if (knownId) return knownId;

  const pending = inflight.get(recording.fileUri);
  if (pending) return pending;

  const creating = createRecordingMeeting(recording).finally(() => {
    inflight.delete(recording.fileUri);
  });
  inflight.set(recording.fileUri, creating);

  return creating;
}

async function createRecordingMeeting(
  recording: PendingRecording,
): Promise<string> {
  const meeting = await createMeetingForUpload({
    title: recording.title || "Recording",
    notesPrivacy: recording.notesPrivacy,
    ...(recording.language && { customLanguage: recording.language }),
    ...(recording.startTime && { startTime: new Date(recording.startTime) }),
    ...(recording.endTime && { endTime: new Date(recording.endTime) }),
    client: isDesktop
      ? UPLOAD_CLIENT_KEYS.DESKTOP_RECORD
      : UPLOAD_CLIENT_KEYS.MOBILE_RECORD,
  });

  localRecordStoreApi.updateByUri(recording.fileUri, {
    meetingId: meeting.id,
  });

  // Notes typed while the recording had no meeting were kept under its file
  // uri; this is the first moment they have somewhere to go.
  adoptRecordingNotes(recording.fileUri, meeting.id);
  void uploadManualNotesForMeeting(meeting.id);

  return meeting.id;
}

import { useUpload } from "@/features/upload";
import { localRecordStoreApi } from "./local-record.store";

/**
 * Returns true if the local record for this meetingId is already
 * marked as successfully uploaded (persisted flag).
 */
export function isAlreadyUploaded(meetingId: string): boolean {
  return localRecordStoreApi.findByMeetingId(meetingId)?.uploaded === true;
}

/**
 * Returns true if the upload store has a non-failed task for this
 * meetingId (i.e. uploading or finalizing).
 */
export function hasActiveUploadForMeeting(meetingId: string): boolean {
  return useUpload
    .getState()
    .uploads.some((u) => u.id === meetingId && u.status !== "failed");
}

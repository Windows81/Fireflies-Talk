import { isAfter } from "date-fns";
import type { DesktopNotepadMeeting } from "../../types";

/**
 * Whether running out of storage is what locks this meeting. Only recordings
 * that landed after the team went over are withheld — earlier meetings were
 * already paid for and stay readable. Mirrors dashboard-ff's notepad check,
 * which likewise blocks nothing until the team has a limit-hit date.
 */
export function isRecordedAfterStorageLimit(
  meeting: Pick<DesktopNotepadMeeting, "startTime" | "endTime">,
  storageLimitHitDate: Date | string | null | undefined,
): boolean {
  // FeedMeeting carries no createdAt: end time is when the recording landed in
  // storage, with start time covering meetings still in progress.
  const recordedAt = meeting.endTime ?? meeting.startTime;
  if (!storageLimitHitDate || !recordedAt) return false;
  return isAfter(new Date(recordedAt), new Date(storageLimitHitDate));
}

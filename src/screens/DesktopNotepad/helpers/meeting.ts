import { RouteNames } from "@/constants";
import { MEETING_SOURCE } from "@/features/meeting";
import { isMainDesktopWindow } from "@/utils/device";
import { format, isValid } from "date-fns";
import { NOTEPAD_FROM_RECORDING_REF } from "../constants";
import type { DesktopNotepadMeeting } from "../types";

export function hasPlayableMedia(
  meeting: Pick<DesktopNotepadMeeting, "addedBy" | "video_url" | "audio_url">,
): boolean {
  return (
    meeting.addedBy !== MEETING_SOURCE.DESKTOP_RECORD &&
    (!!meeting.video_url || !!meeting.audio_url)
  );
}

export function isAudioOnly(
  meeting: Pick<DesktopNotepadMeeting, "addedBy" | "video_url" | "audio_url">,
): boolean {
  return hasPlayableMedia(meeting) && !meeting.video_url;
}

export function getNotepadTitle(
  meeting: Pick<DesktopNotepadMeeting, "title" | "startTime">,
): string {
  return meeting.title?.trim() || getDefaultMeetingTitle(meeting.startTime);
}

// Title-less meetings read as their start date/time (e.g. "Jul 20, 03:32 PM")
// instead of a bare "Untitled", matching the recording default.
function getDefaultMeetingTitle(
  startTime: DesktopNotepadMeeting["startTime"],
): string {
  const date = startTime == null ? null : new Date(startTime);
  return date && isValid(date)
    ? format(date, "MMM dd, hh:mm aa")
    : "Untitled meeting";
}

export function getMeetingLanguageCode(
  meeting: Pick<
    DesktopNotepadMeeting,
    "audioService_metadata" | "customLanguage"
  >,
): string | null {
  return (
    meeting.audioService_metadata?.languageCode ||
    meeting.customLanguage ||
    null
  );
}

// Mirrors the server's ownership rule: the meeting's owner id (user id or
// legacy notebookId) or its organizer email must match the signed-in user.
export function isMeetingOwner(
  meeting: Pick<DesktopNotepadMeeting, "owner" | "organizerEmail">,
  user: { id?: string; notebookId?: string; email?: string } | null | undefined,
): boolean {
  if (!user) return false;
  if (
    meeting.owner &&
    (meeting.owner === user.id || meeting.owner === user.notebookId)
  ) {
    return true;
  }
  return !!user.email && meeting.organizerEmail === user.email;
}

export function getParticipantsLabel(
  meeting: Pick<
    DesktopNotepadMeeting,
    "organizer" | "organizerEmail" | "attendees"
  >,
): string {
  const host = meeting.organizer?.name?.split(" ")[0] || meeting.organizerEmail;
  // Attendees include the host, so the count of "others" excludes them.
  const others = meeting.attendees?.length ? meeting.attendees.length - 1 : 0;
  return others > 0 ? `${host}, +${others}` : host;
}

/** Opens the in-app notepad on main after a recording ends. */
export async function openDesktopNotepadFromRecording(
  meetingId: string,
): Promise<void> {
  window.electron?.navigateMainToRoute?.(
    `/${RouteNames.DesktopNotepad}/${meetingId}?ref=${NOTEPAD_FROM_RECORDING_REF}`,
  );

  if (!isMainDesktopWindow()) {
    await window.electron?.window?.closeAndFocusMain?.({
      skipNavigateHome: true,
    });
  }
}

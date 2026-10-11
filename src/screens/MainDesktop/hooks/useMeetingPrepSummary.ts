import { useMemo } from "react";
import type { MeetingStatusData } from "@/graphql";
import { useGetMeetingPrepOutputQuery, type CalendarEvents } from "@/graphql";

export interface MeetingPrepAvatarProfile {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

export interface MeetingPrepSummary {
  summaryText: string;
  truncatedSummary: string;
  isTruncated: boolean;
  taskCount: number;
  participants: MeetingPrepAvatarProfile[];
  /** True when there is prep content worth showing (summary or action items). */
  hasContent: boolean;
}

const DEFAULT_CHAR_LIMIT = 90;
/**
 * Derives "In the last meeting" prep content for a calendar event.
 * Prefers fresh data from the AI Apps meeting prep query and falls back to the
 * lastMeeting attached to the calendar event. Shared by the desktop home
 * upcoming banner, the sidebar hover card, and the realtime panel notes banner.
 *
 * `meetingIdOverride` lets callers that already hold a meeting id (e.g. the
 * live realtime panel) drive the prep query directly without a calendar event.
 */
export function useMeetingPrepSummary(
  event: CalendarEvents | undefined,
  liveMeeting: MeetingStatusData | undefined,
  charLimit: number = DEFAULT_CHAR_LIMIT,
  meetingIdOverride?: string,
): MeetingPrepSummary {
  const meetingId =
    meetingIdOverride || event?.meetingId || liveMeeting?.objectId;
  const { data: prepData } = useGetMeetingPrepOutputQuery({
    skip: !meetingId,
    variables: { input: { meetingId: meetingId || "" } },
  });

  return useMemo(() => {
    const pastNotes = prepData?.getMeetingPrepOutput?.pastNotes;
    const eventLastMeeting = event?.lastMeeting;

    const summaryText =
      pastNotes?.bulletGist?.map((b) => b.sentence).join(" ") ||
      pastNotes?.overview ||
      eventLastMeeting?.brief?.gist ||
      eventLastMeeting?.brief?.overview ||
      eventLastMeeting?.summary?.map((s) => s.sentence).join(" ") ||
      "";

    const isTruncated = summaryText.length > charLimit;
    const truncatedSummary = isTruncated
      ? `${summaryText.slice(0, charLimit).trimEnd()}...`
      : summaryText;

    const taskCount =
      pastNotes?.tasks?.length ?? eventLastMeeting?.tasks?.length ?? 0;

    // Prefer unique task owners (people who have action items); fall back to the
    // past meeting's participants when no tasks carry owner info.
    const owners = new Map<string, MeetingPrepAvatarProfile>();
    for (const task of pastNotes?.tasks ?? []) {
      const email = task.ownerEmail ?? "";
      const name = task.generatedOwnerName ?? "";
      if (!email && !name) continue;
      const key = email || name;
      if (!owners.has(key)) owners.set(key, { email, name });
    }
    const taskOwners = Array.from(owners.values());
    const participants =
      taskOwners.length > 0
        ? taskOwners
        : (eventLastMeeting?.participantsProfiles ?? []);
    return {
      summaryText,
      truncatedSummary,
      isTruncated,
      taskCount,
      participants,
      hasContent: Boolean(summaryText) || taskCount > 0,
    };
  }, [prepData, event?.lastMeeting, charLimit]);
}

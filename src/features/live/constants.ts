import { MEETING_PUPPET_STATUS } from "@/constants/meeting";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";

export enum LiveMeetingEvents {
  LIVE_MEETING_ACTIVITY_BROADCAST_EVENT = "live.meeting.activity.broadcast.event",
  LIVE_TRANSCRIPT_BROADCAST_EVENT = "transcription.broadcast.event",
  LIVE_MEETING_ACTIVITY_DELETED_EVENT = "live.meeting.activity.deleted.event",
  REALTIME_NOTE_BROADCAST = "realtime.note.broadcast.event",
  REALTIME_NOTE_CHAPTERS_BROADCAST = "realtime.chapters.broadcast.event",
  REALTIME_ACTION_ITEMS_BROADCAST = "realtime.action.items.broadcast.event",
  REALTIME_ACTION_ITEMS_UPDATE = "realtime.action.items.update.event",
  REALTIME_ACTION_ITEMS_UPDATE_BROADCAST = "realtime.action.items.update.broadcast.event",
  REALTIME_ASSIST_BROADCAST = "realtime-assist.broadcast.event",
  INSTANT_SUMMARY_BROADCAST = "instant.summary.broadcast.event",
  MEETING_ENDED_BROADCAST = "meeting.ended.broadcast.event",
  NO_AI_CREDITS_LEFT_BROADCAST = "no.ai.credits.left.broadcast.event",
  SPEAKER_INSIGHT_BROADCAST = "speaker.insight.broadcast.event",
  ENTITIES_DETECTED_BROADCAST_EVENT = "entities-detected.broadcast.event",
}

export const isLiveMeeting = (meeting?: Pick<Meeting, "status">) =>
  meeting?.status === MEETING_PUPPET_STATUS.ACTIVE ||
  meeting?.status === MEETING_PUPPET_STATUS.PAUSED;

export enum TabName {
  Notes = "notes",
  ManualNotes = "manual-notes",
  Transcript = "transcript",
  Bookmarks = "bookmarks",
  Prep = "prep",
}

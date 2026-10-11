import type {
  LiveActionItem,
  LiveNote,
  LiveTranscriptItem,
  MeetingNoteComment,
  WaveMark,
} from "@/graphql";
import type { Socket } from "socket.io-client";
import type { LiveMeetingEvents } from "./constants";
import type { RealtimeLiveAssist } from "@/features/ask-fred";

export interface RealtimeNoteRequest {
  meetingId: string;
  startTime: number;
  endTime: number;
  email: string;
}

export interface UpdateActionItem {
  id: string;
  meetingId: string;
  checked: boolean;
  actionItem: string;
  actionItemTimestamp: number;
  parseId: string;
  personName: string;
}

export interface LiveMeetingCaption {
  id: string;
  sentence: string;
  speaker_id: number;
  time: number;
  endTime: number;
  speaker_name?: string | null;
  // moode whether it is "async" transcript or not
  // if not async, we need to merge on frontend
  // TODO: maybe can convince to move that logic to backend?
  // https://firefliesapp.slack.com/archives/C01G1RBF4T1/p1727668974897339?thread_ts=1727663668.718579&cid=C01G1RBF4T1
  mode?: string;
}

export type LiveMeetingActivity = WaveMark | MeetingNoteComment;

export type DeleteLiveMeetingActivityEvent = Pick<
  LiveMeetingActivity,
  "_id" | "meetingId"
>;

export interface MeetingEndedBroadcastEvent {
  meetingId: string;
  message: string;
}

export interface ClientSpeakerInsight {
  meetingId: string;
  speakerName: string;
  type: "SPEAKING_TOO_FAST" | "SPEAKING_TOO_SLOW" | "SPEAKING_TOO_LONG";
  timestamp: number;
  windowStart: number;
  windowEnd: number;
  metrics: {
    wpm?: number;
    totalWords?: number;
    speakingPercent?: number;
    totalSpeakingTime?: number;
  };
  message: string;
}

export enum DetectedEntityType {
  QUESTIONS = "questions",
}

export interface EntitiesDetectedPayload {
  entityType: DetectedEntityType;
  count: number;
  timestamp: number;
}

type ServerToClientEvents = {
  [LiveMeetingEvents.LIVE_MEETING_ACTIVITY_BROADCAST_EVENT]: (
    data: LiveMeetingActivity,
  ) => void;
  [LiveMeetingEvents.LIVE_TRANSCRIPT_BROADCAST_EVENT]: (
    data: LiveTranscriptItem,
  ) => void;
  [LiveMeetingEvents.REALTIME_NOTE_BROADCAST]: (data: LiveNote) => void;
  [LiveMeetingEvents.REALTIME_NOTE_CHAPTERS_BROADCAST]: (
    data: Record<string, LiveNote[]>,
  ) => void;
  [LiveMeetingEvents.REALTIME_ACTION_ITEMS_BROADCAST]: (
    data: LiveActionItem[],
  ) => void;
  [LiveMeetingEvents.REALTIME_ACTION_ITEMS_UPDATE_BROADCAST]: (
    data: UpdateActionItem,
  ) => void;
  [LiveMeetingEvents.LIVE_MEETING_ACTIVITY_DELETED_EVENT]: (
    data: DeleteLiveMeetingActivityEvent,
  ) => void;
  [LiveMeetingEvents.REALTIME_ASSIST_BROADCAST]: (
    data: RealtimeLiveAssist[],
  ) => void;
  [LiveMeetingEvents.INSTANT_SUMMARY_BROADCAST]: (data: {
    type: string;
    section?: string;
    delta?: string;
    content?: string;
    variant?: string;
    error?: string;
  }) => void;
  [LiveMeetingEvents.MEETING_ENDED_BROADCAST]: (
    data: MeetingEndedBroadcastEvent,
  ) => void;
  [LiveMeetingEvents.NO_AI_CREDITS_LEFT_BROADCAST]: () => void;
  [LiveMeetingEvents.SPEAKER_INSIGHT_BROADCAST]: (
    data: ClientSpeakerInsight,
  ) => void;
  [LiveMeetingEvents.ENTITIES_DETECTED_BROADCAST_EVENT]: (
    data: EntitiesDetectedPayload,
  ) => void;
};

type ClientToServerEvents = never;

export type LiveMeetingSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export type EventEmitterEventMaps = {
  tabChange: string;
};

export const ASSIST_MODES = {
  SALES: "sales-assist",
  GENERAL: "general-assist",
} as const;

export type AssistMode = (typeof ASSIST_MODES)[keyof typeof ASSIST_MODES];

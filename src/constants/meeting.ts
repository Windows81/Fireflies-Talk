export enum PROCESS_MEETING_STATUS {
  NOT_STARTED = "not_started",
  STARTED = "started",
  COMPLETED = "completed",
  FAILED = "failed",
}

/** Filter-only `computedStatus` value: no status filter, every meeting is tagged individually */
export const COMPUTED_MEETING_STATUS_FILTER_ALL = "all";

/** Status computed server side by meeting-service, returned as `computedStatus` */
export enum COMPUTED_MEETING_STATUS {
  ACTIVE = "active",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CONNECTION_FAILED = "connection_failed",
  IN_WAITING_ROOM = "in_waiting_room",
}

/** Arrives on `status` like a puppet status, but the API sets it from the cancelled meeting */
export const MEETING_STATUS_CANCELLED = "cancelled";

export enum MEETING_PUPPET_STATUS {
  STARTED = "started",
  ACTIVE = "active",
  PAUSED = "paused",
  PROCESSING = "processing",
  CONNECT_FAIL = "connectfail",
  ENDED = "ended",
  DELAYED = "delayed",
  FAILED = "failed",
}

export enum SKIP_SUMMARY_REASONS {
  TRANSCRIPTION_FROM_CHROME_EXTENSION = "Meeting was transcribed using Chrome Extension",
  TRANSCRIPTION_FROM_MOBILE = "Meeting was transcribed using Mobile App",
  UNLIMITED_TRANSCRIPTION_SHARE_ALL = "User is on unlimited transcriptions because of share all setting",
  NOT_ENOUGH_CAPTIONS = "Summary not processed because it did not match the minimum",
  NO_ACTIVE_EXTENSIONS = "No active extensions found for this user",
}

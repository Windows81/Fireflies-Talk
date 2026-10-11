export { useDesktopAssistUIState } from "./hooks/useDesktopAssistUIState";
export {
  useLiveMeetings,
  type UseLiveMeetingsOptions,
} from "./useLiveMeetings";
export type { UseLiveMeetingsResult } from "./useLiveMeetings";
export { useLiveMeetingsStore, liveMeetingsApi } from "./live-meetings.store";
export {
  usePendingAddToLiveStore,
  pendingAddToLiveApi,
  PENDING_ADD_TO_LIVE_TTL_MS,
  type PendingAddToLive,
} from "./pendingAddToLive.store";
export {
  useBotJoinedStore,
  botJoinedApi,
  BOT_JOINED_TTL_MS,
  type BotJoinedMeeting,
} from "./botJoined.store";

// Constants
export { LiveMeetingEvents, isLiveMeeting, TabName } from "./constants";

// Types
export type {
  RealtimeNoteRequest,
  UpdateActionItem,
  LiveMeetingCaption,
  LiveMeetingActivity,
  DeleteLiveMeetingActivityEvent,
  MeetingEndedBroadcastEvent,
  ClientSpeakerInsight,
  EntitiesDetectedPayload,
  LiveMeetingSocket,
  EventEmitterEventMaps,
} from "./types";
export { DetectedEntityType } from "./types";

// Utils
export { getElapsedDuration } from "./utils";
export { openLiveDestination } from "./helpers/openLiveDestination";
export {
  isLiveSessionOver,
  shouldProbeMeetingLiveness,
  type LivenessProbe,
} from "./helpers/livenessProbe";
export {
  MAX_IDLE_SOCKET_RECONNECTS,
  shouldReconnectIdleSocket,
} from "./helpers/idleSocketPolicy";
export {
  MAX_TOKEN_FETCH_RETRIES,
  REALTIME_SOCKET_ERRORS,
  TOKEN_REFRESH_COOLDOWN_MS,
  resolveConnectErrorAction,
  resolveTokenRetryDelayMs,
  type ConnectErrorAction,
} from "./helpers/realtimeSocketErrors";

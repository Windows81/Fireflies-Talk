// Component exports
// (LiveRecordController is imported by path — its floating card renders the
// Record screen's RecordLiveView, which imports this barrel; exporting it
// here would create an import cycle.)
export { useIsRecordingSilent } from "./components/LiveRecordInterruptListener";
export {
  LocalRecordingsDialog,
  LocalRecordingsList,
} from "./components/LocalRecordings";
export {
  RecordUploadModal,
  RecordUploadModalContext,
  useRecordUploadModalContext,
} from "./components/RecordUploadModal";
export { SilentRecordingDialog } from "./components/SilentRecordingDialog";
export { UnuploadedRecordingBanner } from "./components/UnuploadedRecordingBanner";
export { RecordControls } from "./components/RecordControls";
export { RecordAudioView } from "./components/RecordAudioView";
export { RecordingWaveform } from "./components/RecordingWaveform";
export { AnnounceNewsCard } from "./components/AnnounceNewsCard";
export { RecordStartForm } from "./components/RecordStartForm";
export { WebLeavePageWarning } from "./components/WebLeavePageWarning";
export { CompactAudioView } from "./components/LiveRecordCompactView";
export { RecordControlsPill } from "./components/RecordControlsPill";
export { RecordPausedHint } from "./components/RecordPausedHint";
export {
  isTransitionalPhase,
  recordPhaseApi,
  useRecordPhase,
} from "./record-phase.store";
export { useSaveRecordingTitle } from "./useSaveRecordingTitle";

// Store exports
export {
  LocalRecordingContext,
  localRecordStoreApi,
  useLocalRecordStore,
} from "./local-record.store";
export { useRecordPreferencesStore } from "./record-preference.store";
export {
  patchRecordingContext,
  recorderApi,
  StartRecordingOptions,
  useRecorder,
  useRecordListeners,
} from "./record.store";
export {
  realRecordingsCountStore,
  incrementRealRecordingsCount,
  getRealRecordingsCount,
} from "./real-recordings-count.store";

// Recording-notice policy: detects a meeting filmed through a camera that shows
// no badge. `useCameraRecordingEnforcement` reports it from the window that owns
// the recorder; the Live views read the verdict to show the warning.
export {
  useCameraRecordingPolicy,
  useCameraNoticeBannerDismissed,
  dismissCameraNoticeBanner,
} from "./camera-policy.store";
export { useCameraRecordingEnforcement } from "./useCameraRecordingEnforcement";
export {
  describeCameraNotice,
  type CameraRecordingPolicy,
} from "./camera-recording-policy";

// Type and utility exports
export type {
  RecordingContext,
  RecordingSource,
  RecordingStates,
} from "./types";
export {
  isRecordSessionActive,
  type RecordSessionSnapshot,
} from "./record-session";
export { useIsRecordSessionActive } from "./useIsRecordSessionActive";
export { RECORDING_DIRECTORY } from "./constants";
export { getRecordingTitleFromSource } from "./recordingTitle";
export {
  CALENDAR_EVENT_OVERRUN_GRACE_MS,
  isRecordingWithinCalendarEvent,
  toRecordingSourceAttendees,
  toRecordingSourceCalendarWindow,
} from "./calendarAttendees";
export { AudioInputUnavailableError } from "./errors";
export { useExperimentalRecordConfig } from "./use-experimental-record-config";
export {
  getRecordingErrorSentryFingerprint,
  permissionDeniedCanAskAgainError,
  permissionDeniedError,
  requestMicrophonePermissionOrFail,
  isPendingStreaming,
} from "./utils";
export { recordEventEmitter, type RecordEventMaps } from "./events";
export { initStreamingTokenProvider } from "./streaming-token-provider";

// Context export
export {
  RecordActionsContextProvider,
  useRecordActionsContext,
} from "./RecordActionsContext";
export type { StartInputs } from "./RecordActionsContext";
export { useAutoUploadRecords } from "./useAutoUploadRecords";
export { useReconcileAbandonedRecording } from "./useReconcileAbandonedRecording";
export { useAutoStartNotesOnMicDetection } from "./useAutoStartNotesOnMicDetection";
export { useAutoStartNotesUpsell } from "./useAutoStartNotesUpsell";
export { useAutoStopRecordingOnMicRelease } from "./useAutoStopRecordingOnMicRelease";
export { useDesktopTrayMenuListener } from "./useDesktopTrayMenuListener";

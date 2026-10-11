export enum RecordingState {
  INACTIVE = "inactive",
  PAUSED = "paused",
  RECORDING = "recording",
}

export enum StreamingState {
  INACTIVE = "inactive",
  CONNECTING = "connecting",
  STREAMING = "streaming",
}

/**
 * Codes carried by the `streamFailed` event so the UI can explain a terminal
 * streaming failure instead of showing the raw error.
 */
export const STREAM_FAILURE_CODE = {
  generic: "E_STREAM_FAILED",
  authFailed: "E_STREAM_AUTH_FAILED",
  disconnected: "E_STREAM_DISCONNECTED",
} as const;

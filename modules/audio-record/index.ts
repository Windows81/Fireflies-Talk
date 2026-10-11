// Import the native module. On web, it will be resolved to ExpoAudioRecord.web.ts
// and on native platforms to ExpoAudioRecord.ts
import AudioRecordModule from "./AudioRecordModule";

export const addEventListener =
  AudioRecordModule.addListener.bind(AudioRecordModule);

export const startForegroundService =
  AudioRecordModule.startForegroundService?.bind(AudioRecordModule) ??
  (async () => {});

export const startRecording =
  AudioRecordModule.startRecording.bind(AudioRecordModule);

export const stopRecording =
  AudioRecordModule.stopRecording.bind(AudioRecordModule);

export const pauseRecording =
  AudioRecordModule.pauseRecording.bind(AudioRecordModule);

export const resumeRecording =
  AudioRecordModule.resumeRecording.bind(AudioRecordModule);

export const startUpload =
  AudioRecordModule.startUpload.bind(AudioRecordModule);

export const getStatus = AudioRecordModule.getStatus.bind(AudioRecordModule);

export const getContext = AudioRecordModule.getContext.bind(AudioRecordModule);

export const setContext = AudioRecordModule.setContext.bind(AudioRecordModule);

export const setStreamingError =
  AudioRecordModule.setStreamingError.bind(AudioRecordModule);

export const release = AudioRecordModule.release.bind(AudioRecordModule);

export const setSystemAudioStreamOverride = (
  AudioRecordModule as unknown as {
    setSystemAudioStreamOverride?: (stream: MediaStream | null) => void;
  }
).setSystemAudioStreamOverride?.bind(AudioRecordModule);

// [Desktop] Selects the microphone input device (live-switches an
// in-progress recording). Undefined on native, where callers should guard.
export const setInputDevice = (
  AudioRecordModule as unknown as {
    setInputDevice?: (deviceId: string) => Promise<void> | void;
  }
).setInputDevice?.bind(AudioRecordModule);

// [Desktop] Reports that the meeting is on a camera carrying no recording
// notice, so the state reaches the heartbeat. A no-op on native, which has no
// virtual camera.
export const setCameraNotice =
  (
    AudioRecordModule as unknown as {
      setCameraNotice?: (state: {
        missing: boolean;
        detail: string;
        silenceAudio: boolean;
      }) => void;
    }
  ).setCameraNotice?.bind(AudioRecordModule) ?? (() => {});

// [Desktop] Gates the meeting microphone alone while the user's voice goes to
// Talk dictation; system audio keeps recording. A no-op on native, where the
// two never share a device.
export const setMicrophoneMuted =
  (
    AudioRecordModule as unknown as {
      setMicrophoneMuted?: (muted: boolean) => void;
    }
  ).setMicrophoneMuted?.bind(AudioRecordModule) ?? (() => {});

export const requestRecordingPermissions =
  AudioRecordModule.requestRecordingPermissions.bind(AudioRecordModule);

export { WebRecordingStorage } from "./web/web-recording-storage";

export { STREAM_FAILURE_CODE } from "./web/constants";

export type {
  AudioRecordModuleEvents,
  DataChangeEvent,
  ErrorEvent,
  RecordingContext,
  RecordingOptions,
  RecordingStatus,
} from "./types";

export const AudioRecordErrorCode = {
  ErrNoPermission: AudioRecordModule.ERR_NO_PERMISSION as string,
  ErrNoInProgressRecording:
    AudioRecordModule.ERR_NO_IN_PROGRESS_RECORDING as string,
  ErrInProgressRecording: AudioRecordModule.ERR_IN_PROGRESS_RECORDING as string,
  ErrAudioInputUnavailable:
    AudioRecordModule.ERR_AUDIO_INPUT_UNAVAILABLE as string,
  ErrInternal: AudioRecordModule.ERR_INTERNAL as string,
};

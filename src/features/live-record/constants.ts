import type * as AudioRecord from "@/modules/audio-record";
import { Paths } from "expo-file-system";
import { Platform } from "react-native";

export const PCM_RECORDING_OPTIONS = {
  bitDepth: 16,
  channels: 1,
  sampleRate: 16000,
  bitRate: 128000,
  container: "wav",
  mimeType: "audio/wav",
  meetingId: "",
  socketUrl: "",
  socketAuthToken: "",
} satisfies Omit<AudioRecord.RecordingOptions, "fileUri">;

export const MP3_RECORDING_OPTIONS = {
  bitDepth: 16,
  channels: 1,
  sampleRate: 44100,
  bitRate: 128000,
  container: "mp3",
  mimeType: "audio/mpeg",
  meetingId: "",
  socketUrl: "",
  socketAuthToken: "",
} satisfies Omit<AudioRecord.RecordingOptions, "fileUri">;

export const MP4_RECORDING_OPTIONS = {
  bitDepth: 16,
  channels: 1,
  sampleRate: 44100,
  bitRate: 128000,
  container: "mp4",
  mimeType: "audio/mp4",
  meetingId: "",
  socketUrl: "",
  socketAuthToken: "",
} satisfies Omit<AudioRecord.RecordingOptions, "fileUri">;

export const WEBM_RECORDING_OPTIONS = {
  bitDepth: 16,
  channels: 1,
  sampleRate: 48000, // Let browser decide - native hardware rate is most efficient
  bitRate: 96000, // 96kbps Opus - excellent quality with minimal CPU usage
  container: "webm",
  mimeType: "audio/webm",
  meetingId: "",
  socketUrl: "",
  socketAuthToken: "",
} satisfies Omit<AudioRecord.RecordingOptions, "fileUri">;

export const OGG_RECORDING_OPTIONS = {
  bitDepth: 16,
  channels: 1,
  sampleRate: 48000,
  bitRate: 128000,
  container: "ogg",
  mimeType: "audio/ogg",
  meetingId: "",
  socketUrl: "",
  socketAuthToken: "",
} satisfies Omit<AudioRecord.RecordingOptions, "fileUri">;

export const MIME_TYPE_RECORDING_OPTIONS_MAP: Record<
  string,
  Omit<AudioRecord.RecordingOptions, "fileUri"> | undefined
> = {
  "audio/mpeg": MP3_RECORDING_OPTIONS,
  "audio/wav": PCM_RECORDING_OPTIONS,
  "audio/webm": WEBM_RECORDING_OPTIONS,
  "audio/ogg": OGG_RECORDING_OPTIONS,
};

export const RECORDING_DIRECTORY = `${Platform.OS === "web" ? "fireflies://" : Paths.document.uri}recordings/`;

export type RecordingFileExtensionInfo =
  | {
      isRaw: true;
      containedExtension: string;
      extension: string;
    }
  | {
      isRaw: false;
      extension: string;
    };

export const RECORDING_FILE_EXTENSIONS: RecordingFileExtensionInfo[] = [
  {
    extension: ".m4a",
    isRaw: false,
  },
  {
    extension: ".mp3",
    isRaw: false,
  },
  {
    extension: ".webm",
    isRaw: false,
  },
  {
    extension: ".weba",
    isRaw: false,
  },
  {
    extension: ".ogg",
    isRaw: false,
  },
  {
    extension: ".m4a.pcm",
    containedExtension: ".m4a",
    isRaw: true,
  },
  {
    extension: ".m4a.caf",
    containedExtension: ".m4a",
    isRaw: true,
  },
  {
    extension: ".wav",
    isRaw: false,
  },
  {
    extension: ".wav.tmp",
    containedExtension: ".wav",
    isRaw: true,
  },
  {
    extension: ".wav.pcm",
    containedExtension: ".wav",
    isRaw: true,
  },
  {
    extension: ".wav.caf",
    containedExtension: ".wav",
    isRaw: true,
  },
  {
    extension: ".unknown",
    isRaw: false,
  },
];

/** Maximum recording duration in milliseconds (4 hours wall clock). */
export const MAX_RECORDING_DURATION_MS = 4 * 60 * 60 * 1000;

export const RECORD_HQ_AUDIO_STORAGE_KEY: string = "recordHQAudio";
export const RECORD_USE_STREAMING_STORAGE_KEY: string = "recordUseStreaming";

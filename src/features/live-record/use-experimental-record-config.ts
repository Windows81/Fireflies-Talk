import { useFeatureValue } from "@growthbook/growthbook-react";
import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import { FEATURE_FLAGS } from "../feature-flags";
import { storage } from "../storage";
import {
  RECORD_HQ_AUDIO_STORAGE_KEY,
  RECORD_USE_STREAMING_STORAGE_KEY,
} from "./constants";
import { selectOptimalWebAudioMime } from "./utils";
import { isDesktop } from "@/utils/device";

// These configs are not meant to be exposed to the users, but rather for internal use only.
// We currently do expose some of these configs to the users (e.g. MP3 toggle), but we will be removing
// them in the future.
/** The `mobile-ff.record.config` feature value (a type, not an interface, to satisfy GrowthBook's JSONValue). */
type RecordConfig = {
  defaultMimeType: string;
  enableStreaming: boolean;
  /** Desktop and website: render the recording with the "playback" AudioContext latency hint. */
  playbackLatencyHint?: boolean;
};

export const useExperimentalRecordConfig = () => {
  const defaultRecordConfig = useFeatureValue<RecordConfig>(
    FEATURE_FLAGS.MOBILE_RECORD_CONFIG,
    {
      defaultMimeType: "audio/wav",
      enableStreaming: false,
    },
  );
  // The fallback above only applies when the whole feature is missing; a
  // config value that predates the key leaves it undefined.
  const playbackLatencyHint = defaultRecordConfig.playbackLatencyHint === true;

  const [recordHQAudio, _setRecordHQAudio] = useState<undefined | boolean>(
    () => {
      const recordHQAudio = storage.getItem(RECORD_HQ_AUDIO_STORAGE_KEY);
      if (typeof recordHQAudio === "string") {
        return recordHQAudio === "true";
      }
      return undefined;
    },
  );

  const setRecordHQAudio = useCallback((value: boolean) => {
    _setRecordHQAudio(value);
    storage.setItem(RECORD_HQ_AUDIO_STORAGE_KEY, value ? "true" : "false");
  }, []);

  const mimeType = useMemo(() => {
    // We only support mp3 on web
    if (Platform.OS === "web") {
      return selectOptimalWebAudioMime({ preferMp4: false }) ?? "audio/mp4";
    }
    if (typeof recordHQAudio === "boolean") {
      return recordHQAudio ? "audio/mpeg" : defaultRecordConfig.defaultMimeType;
    }
    return defaultRecordConfig.defaultMimeType;
  }, [defaultRecordConfig.defaultMimeType, recordHQAudio]);

  const [recordUseStreaming, _setRecordUseStreaming] = useState<
    undefined | boolean
  >(() => {
    const recordUseStreaming = storage.getItem(
      RECORD_USE_STREAMING_STORAGE_KEY,
    );
    if (typeof recordUseStreaming === "string") {
      return recordUseStreaming === "true";
    }
    return undefined;
  });

  const setRecordUseStreaming = useCallback((value: boolean) => {
    _setRecordUseStreaming(value);
    storage.setItem(RECORD_USE_STREAMING_STORAGE_KEY, value ? "true" : "false");
  }, []);

  const enableStreaming = useMemo(() => {
    if (typeof recordUseStreaming === "boolean") {
      return recordUseStreaming;
    }

    return isDesktop || defaultRecordConfig.enableStreaming;
  }, [defaultRecordConfig.enableStreaming, recordUseStreaming]);

  return useMemo(
    () => ({
      recordHQAudio,
      setRecordHQAudio,
      recordUseStreaming,
      setRecordUseStreaming,
      mimeType,
      enableStreaming,
      playbackLatencyHint,
    }),
    [
      recordHQAudio,
      mimeType,
      enableStreaming,
      playbackLatencyHint,
      setRecordHQAudio,
      recordUseStreaming,
      setRecordUseStreaming,
    ],
  );
};

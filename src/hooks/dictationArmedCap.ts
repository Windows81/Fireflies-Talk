import { storage } from "@/features/storage";
import { MAX_DICTATION_AUDIO_SECONDS } from "./dictationPcm";
import {
  DICTATION_ARMED_MAX_SECONDS_KEY,
  parseArmedDictationMaxSeconds,
} from "./dictationAutoStop";

export function writeArmedDictationMaxSeconds(maxSeconds: number): void {
  storage.setItem(DICTATION_ARMED_MAX_SECONDS_KEY, String(maxSeconds));
}

export function readArmedDictationMaxSeconds(
  fallback = MAX_DICTATION_AUDIO_SECONDS,
): number {
  return parseArmedDictationMaxSeconds(
    storage.getItem(DICTATION_ARMED_MAX_SECONDS_KEY),
    fallback,
  );
}

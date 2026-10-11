import { FEATURE_FLAGS, useFeature } from "@/features/feature-flags";
import {
  assignedDictationTranscriptionProvider,
  effectiveDictationTranscriptionProvider,
  type DictationTranscriptionProvider,
} from "./dictationTranscriptionProvider";
import { useLocalSettings } from "./useLocalSettings";

/** Resolves the transcription provider from the experiment and language hints. */
export function useDictationTranscriptionProvider(): {
  value: DictationTranscriptionProvider;
} {
  const feature = useFeature(FEATURE_FLAGS.MOBILE_TRANSCRIPTION_PROVIDER);
  const experimentValue = assignedDictationTranscriptionProvider(feature);
  const { dictationTranscriptionProvider, dictationLanguageHints } =
    useLocalSettings();

  return {
    value: effectiveDictationTranscriptionProvider({
      stored: dictationTranscriptionProvider,
      experimentValue,
      languageHints: dictationLanguageHints,
    }),
  };
}

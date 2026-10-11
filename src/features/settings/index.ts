export { useSaveOptions } from "./useSaveOptions";
export { useUpdateOptionsAutoJoin } from "./useUpdateOptionsAutoJoin";
export { useUpdateOptionsLanguage } from "./useUpdateOptionsLanguage";
export { useUpdateOptionsSendNotesTo } from "./useUpdateOptionsSendNotesTo";
export {
  useLocalSettings,
  getLocalSettings,
  getDictationLanguageHints,
  setLaunchAtStartupSilently,
  setDictationMicrophoneSilently,
} from "./useLocalSettings";
export type {
  LocalSettings,
  LocalSettingsStore,
  UpcomingMeetingNotification,
  NotificationPersistence,
} from "./useLocalSettings";
export type { DictationTranscriptionProvider } from "./dictationTranscriptionProvider";
export {
  isSystemDefaultMicrophone,
  normalizeDictationMicrophoneSelection,
  SYSTEM_DEFAULT_MICROPHONE,
} from "./dictationMicrophoneSelection";
export type { DictationMicrophoneSelection } from "./dictationMicrophoneSelection";
export { useDictationTranscriptionProvider } from "./useDictationTranscriptionProvider";
export { useDictationLanguageHints } from "./useDictationLanguageHints";
export {
  ASSEMBLY_SYNC_LANGUAGE_CODES,
  DEFAULT_DICTATION_LANGUAGE_HINTS,
  DICTATION_LANGUAGE_OPTIONS,
  getDictationLanguageOptions,
  MAX_DICTATION_LANGUAGE_HINTS,
  normalizeDictationLanguageHints,
  toDictationApiLanguageCodes,
  toDictationLanguageHint,
  toIso6391DictationCode,
  toProcessDictationLanguages,
} from "./dictationLanguages";
export { isEdgeBrowserAvailable, openInEdgeBrowser } from "./edgeBrowserUtils";
export { syncLaunchAtStartup } from "./launchAtStartup";
export {
  useIsTalkActionModeFlagOn,
  useSyncTalkActionMode,
} from "./useTalkActionMode";
export {
  useIsTalkPolishActionFlagOn,
  useSyncTalkPolishAction,
} from "./useTalkPolishAction";

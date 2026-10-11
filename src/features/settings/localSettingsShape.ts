import {
  defaultDictationBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";
import { defaultActionBinding } from "electron/src/dictation/action-binding";
import {
  defaultPolishBinding,
  type PolishBinding,
} from "electron/src/dictation/polish-binding";
import type { DictationTranscriptionProvider } from "./dictationTranscriptionProvider";
import { DEFAULT_DICTATION_LANGUAGE_HINTS } from "./dictationLanguages";
import {
  SYSTEM_DEFAULT_MICROPHONE,
  type DictationMicrophoneSelection,
} from "./dictationMicrophoneSelection";
import type { UpcomingMeetingNotification } from "./upcomingMeetingNotification";

export type NotificationPersistence = "timed" | "persistent";

export interface LocalSettings {
  // Notification settings
  autoDetectMeetings: boolean;
  autoStartNotes: boolean;
  upcomingMeetingNotification: UpcomingMeetingNotification;
  meetingPrepNotification: boolean;
  dailyBriefNotification: boolean;
  notetakerJoinedNotification: boolean;
  notificationPersistence: NotificationPersistence;

  // Preference settings
  launchAtStartup: boolean;
  hideFloatingDockWhenScreenSharing: boolean;
  useEdgeBrowserForOutlookLogin: boolean;
  /** Beta: names in Google Meet transcripts come from who Meet shows talking. */
  meetSpeakerNamesBeta: boolean;

  // Dictation settings
  // On by default: reads the frontmost app/window's name, title, page URL
  // (in a browser), and visible on-screen text (which can include message
  // other people's names, e.g. a Slack conversation) when a dictation
  // starts, to help get names/emails right — see dictation-screen-context.ts
  // and DictationSettingsUseScreenContext.tsx for the full disclosure shown
  // to the user. Local-only — never synced to the user's account.
  useScreenContextForDictation: boolean;
  /**
   * Speech-to-text provider. `null` follows the transcription-provider
   * experiment. ElevenLabs uses `/token` + Scribe + `/format`. AssemblyAI
   * uses `/start` + `/process`.
   */
  dictationTranscriptionProvider: DictationTranscriptionProvider | null;
  /** ISO-639-3 Scribe language hints. Empty means auto-detect. Default English. */
  dictationLanguageHints: string[];
  /** Pause system Now Playing while dictating, then resume. On by default. */
  dictationPauseMediaEnabled: boolean;
  /** Which mic dictation records through. Empty ids follow the system default. */
  dictationMicrophone: DictationMicrophoneSelection;
  /** Push-to-talk shortcut. Fn on Mac, Ctrl+Win on Windows by default. */
  dictationShortcut: DictationBinding;
  /** Dedicated action-mode shortcut. Alt+Win on Windows, Fn+Shift on Mac by default. */
  actionShortcut: DictationBinding | null;
  /** Dedicated hands-free dictation shortcut. Unassigned by default; the double-tap of the dictation shortcut always works. */
  handsFreeShortcut: DictationBinding | null;
  /** Master switch for action mode. Off disables both action-mode shortcuts. */
  dictationActionModeEnabled: boolean;
  /** Fn or modifier chord that rewrites the selected text. Mac only, Fn + 1 by default. */
  polishShortcut: PolishBinding | null;
  /** Show the floating dictation pill. On by default. Hotkey still works when off. */
  showDictationPill: boolean;
  /** Rest the pill as a slim nub. Off rests it as a pill bearing the mark. */
  minimizeDictationPill: boolean;
  /** Short cues as dictation starts, stops, cancels, or goes hands-free. On by default. */
  dictationSoundEffects: boolean;

  // App exclusion lists (display names of apps to skip)
  excludedAppsForNotification: string[];
  excludedAppsForAutoStart: string[];

  // Shortcut settings
  quickNoteShortcutEnabled: boolean;
  quickNoteShortcutKey: string;
  // Upsell tracking
  takeNotesClickCount: number;

  // Audio consent
  audioConsentEnabled: boolean;

  /** Whether the one-time consent setup modal has already been shown. */
  consentSetupSeen: boolean;
}

export interface LocalSettingsStore extends LocalSettings {
  setAutoDetectMeetings: (value: boolean) => void;
  setAutoStartNotes: (value: boolean) => void;
  setUpcomingMeetingNotification: (value: UpcomingMeetingNotification) => void;
  setMeetingPrepNotification: (value: boolean) => void;
  setDailyBriefNotification: (value: boolean) => void;
  setNotetakerJoinedNotification: (value: boolean) => void;
  setNotificationPersistence: (value: NotificationPersistence) => void;
  setLaunchAtStartup: (value: boolean) => void;
  setHideFloatingDockWhenScreenSharing: (value: boolean) => void;
  setUseEdgeBrowserForOutlookLogin: (value: boolean) => void;
  setMeetSpeakerNamesBeta: (value: boolean) => void;
  setUseScreenContextForDictation: (value: boolean) => void;
  setDictationTranscriptionProvider: (
    value: DictationTranscriptionProvider,
  ) => void;
  setDictationLanguageHints: (value: string[]) => void;
  setDictationPauseMediaEnabled: (value: boolean) => void;
  setDictationMicrophone: (value: DictationMicrophoneSelection) => void;
  setDictationShortcut: (value: DictationBinding) => void;
  setActionShortcut: (value: DictationBinding | null) => void;
  setHandsFreeShortcut: (value: DictationBinding | null) => void;
  setDictationActionModeEnabled: (value: boolean) => void;
  setPolishShortcut: (value: PolishBinding | null) => void;
  setShowDictationPill: (value: boolean) => void;
  setMinimizeDictationPill: (value: boolean) => void;
  setDictationSoundEffects: (value: boolean) => void;
  setExcludedAppsForNotification: (value: string[]) => void;
  setExcludedAppsForAutoStart: (value: string[]) => void;
  setQuickNoteShortcutEnabled: (value: boolean) => void;
  setQuickNoteShortcutKey: (value: string) => void;
  setTakeNotesClickCount: (value: number) => void;
  setAudioConsentEnabled: (value: boolean) => void;
  setConsentSetupSeen: (value: boolean) => void;
}

export const defaultLocalSettings: LocalSettings = {
  autoDetectMeetings: true,
  autoStartNotes: false,
  upcomingMeetingNotification: "2_minutes",
  meetingPrepNotification: true,
  dailyBriefNotification: true,
  notetakerJoinedNotification: true,
  notificationPersistence: "timed",
  launchAtStartup: false,
  hideFloatingDockWhenScreenSharing: false,
  useEdgeBrowserForOutlookLogin: false,
  meetSpeakerNamesBeta: false,
  useScreenContextForDictation: true,
  dictationTranscriptionProvider: null,
  dictationLanguageHints: [...DEFAULT_DICTATION_LANGUAGE_HINTS],
  dictationPauseMediaEnabled: true,
  dictationMicrophone: SYSTEM_DEFAULT_MICROPHONE,
  dictationShortcut: defaultDictationBinding(
    typeof window !== "undefined" && window.electron?.platform
      ? window.electron.platform
      : "darwin",
  ),
  actionShortcut: defaultActionBinding(
    typeof window !== "undefined" && window.electron?.platform
      ? window.electron.platform
      : "darwin",
  ),
  handsFreeShortcut: null,
  dictationActionModeEnabled: true,
  polishShortcut: defaultPolishBinding(
    typeof window !== "undefined" && window.electron?.platform
      ? window.electron.platform
      : "darwin",
  ),
  showDictationPill: true,
  minimizeDictationPill: true,
  dictationSoundEffects: true,
  excludedAppsForNotification: [],
  excludedAppsForAutoStart: [],
  quickNoteShortcutEnabled: true,
  quickNoteShortcutKey: "N",
  takeNotesClickCount: 0,
  audioConsentEnabled: false,
  consentSetupSeen: false,
};

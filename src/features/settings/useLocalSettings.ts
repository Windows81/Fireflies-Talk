import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isMainDesktopWindow } from "@/utils/device";
import { createOwnerOnlyStorage } from "./ownerOnlyStorage";
import { syncRehydratedSettingsToElectron } from "./rehydrateElectronSync";
import {
  formatDictationBindingLabel,
  normalizeDictationBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";
import {
  formatActionBindingLabel,
  normalizeActionBinding,
} from "electron/src/dictation/action-binding";
import {
  formatHandsFreeBindingLabel,
  handsFreeSharesKey,
  normalizeHandsFreeBinding,
} from "electron/src/dictation/hands-free-binding";
import { shortcutAlreadyInUse } from "electron/src/dictation/shortcut-conflict";
import {
  formatPolishBindingLabel,
  normalizePolishBinding,
  type PolishBinding,
} from "electron/src/dictation/polish-binding";
import {
  normalizeDictationTranscriptionProvider,
  type DictationTranscriptionProvider,
} from "./dictationTranscriptionProvider";
import { normalizeDictationLanguageHints } from "./dictationLanguages";
import {
  normalizeDictationMicrophoneSelection,
  type DictationMicrophoneSelection,
} from "./dictationMicrophoneSelection";
import {
  LOCAL_SETTINGS_VERSION,
  migrateLocalSettings,
} from "./localSettingsMigrations";
import {
  defaultLocalSettings,
  type LocalSettings,
  type LocalSettingsStore,
  type NotificationPersistence,
} from "./localSettingsShape";
import {
  normalizeUpcomingMeetingNotification,
  type UpcomingMeetingNotification,
} from "./upcomingMeetingNotification";

export type {
  LocalSettings,
  LocalSettingsStore,
  NotificationPersistence,
  UpcomingMeetingNotification,
};

type SettingName = keyof LocalSettings;
type SettingValue = string | boolean;

/** Main desktop owns local-settings writes. Overlay windows only read. */
const isLocalSettingsPersistOwner = (): boolean => {
  if (!globalThis.window?.electron) return true;
  return isMainDesktopWindow();
};

const trackSettingChange = (settingName: SettingName, value: SettingValue) => {
  tracker.track(TRACKING_EVENTS.DESKTOP_SETTING_CHANGED, {
    settingName,
    value,
  });
};

const handsFreeConflictsWith = (
  handsFree: DictationBinding | null,
  dictation: DictationBinding,
  action: DictationBinding | null,
): boolean =>
  handsFree !== null &&
  (shortcutAlreadyInUse(handsFree, dictation) ||
    shortcutAlreadyInUse(handsFree, action) ||
    handsFreeSharesKey(handsFree, dictation, action));

/**
 * Writes launchAtStartup without emitting a setting-change event, for syncing
 * the store with the OS login item (not a user-initiated change). A function
 * declaration so the rehydrate callback, which runs synchronously inside
 * create(), can reference it before this module finishes evaluating.
 */
export function setLaunchAtStartupSilently(value: boolean) {
  useLocalSettings.setState({ launchAtStartup: value });
}

/**
 * Re-saves the chosen mic under a fresh id once it has been matched by name
 * or hardware group. Not a user choice, so no setting-change event.
 */
export function setDictationMicrophoneSilently(
  value: DictationMicrophoneSelection,
) {
  useLocalSettings.setState({
    dictationMicrophone: normalizeDictationMicrophoneSelection(value),
  });
}

export const useLocalSettings = create(
  persist<LocalSettingsStore>(
    (set, get) => ({
      ...defaultLocalSettings,
      setAutoDetectMeetings: (value: boolean) => {
        trackSettingChange("autoDetectMeetings", value);
        set({ autoDetectMeetings: value });
      },
      setAutoStartNotes: (value: boolean) => {
        trackSettingChange("autoStartNotes", value);
        set({ autoStartNotes: value });
      },
      setExcludedAppsForNotification: (value: string[]) => {
        set({ excludedAppsForNotification: value });
      },
      setExcludedAppsForAutoStart: (value: string[]) => {
        set({ excludedAppsForAutoStart: value });
      },
      setQuickNoteShortcutEnabled: (value: boolean) => {
        trackSettingChange("quickNoteShortcutEnabled", value);
        set({ quickNoteShortcutEnabled: value });
      },
      setQuickNoteShortcutKey: (value: string) => {
        trackSettingChange("quickNoteShortcutKey", value);
        set({ quickNoteShortcutKey: value });
      },
      setTakeNotesClickCount: (value: number) => {
        set({ takeNotesClickCount: value });
      },
      setAudioConsentEnabled: (value: boolean) => {
        trackSettingChange("audioConsentEnabled", value);
        set({ audioConsentEnabled: value });
      },
      setConsentSetupSeen: (value: boolean) => {
        set({ consentSetupSeen: value });
      },
      setUpcomingMeetingNotification: (value: UpcomingMeetingNotification) => {
        trackSettingChange("upcomingMeetingNotification", value);
        set({ upcomingMeetingNotification: value });
      },
      setMeetingPrepNotification: (value: boolean) => {
        trackSettingChange("meetingPrepNotification", value);
        set({ meetingPrepNotification: value });
      },
      setDailyBriefNotification: (value: boolean) => {
        trackSettingChange("dailyBriefNotification", value);
        set({ dailyBriefNotification: value });
      },
      setNotetakerJoinedNotification: (value: boolean) => {
        trackSettingChange("notetakerJoinedNotification", value);
        set({ notetakerJoinedNotification: value });
      },
      setNotificationPersistence: (value: NotificationPersistence) => {
        trackSettingChange("notificationPersistence", value);
        set({ notificationPersistence: value });
      },
      setLaunchAtStartup: (value: boolean) => {
        trackSettingChange("launchAtStartup", value);
        set({ launchAtStartup: value });
      },
      setHideFloatingDockWhenScreenSharing: (value: boolean) => {
        trackSettingChange("hideFloatingDockWhenScreenSharing", value);
        set({ hideFloatingDockWhenScreenSharing: value });
      },
      setMeetSpeakerNamesBeta: (value: boolean) => {
        trackSettingChange("meetSpeakerNamesBeta", value);
        set({ meetSpeakerNamesBeta: value });
      },
      setUseEdgeBrowserForOutlookLogin: (value: boolean) => {
        trackSettingChange("useEdgeBrowserForOutlookLogin", value);
        set({ useEdgeBrowserForOutlookLogin: value });
      },
      setUseScreenContextForDictation: (value: boolean) => {
        trackSettingChange("useScreenContextForDictation", value);
        set({ useScreenContextForDictation: value });
      },
      setDictationTranscriptionProvider: (
        value: DictationTranscriptionProvider,
      ) => {
        const provider = normalizeDictationTranscriptionProvider(value);
        trackSettingChange("dictationTranscriptionProvider", provider);
        set({ dictationTranscriptionProvider: provider });
      },
      setDictationLanguageHints: (value: string[]) => {
        const languageHints = normalizeDictationLanguageHints(value);
        trackSettingChange("dictationLanguageHints", languageHints.join(","));
        set({ dictationLanguageHints: languageHints });
      },
      setDictationPauseMediaEnabled: (value: boolean) => {
        trackSettingChange("dictationPauseMediaEnabled", value);
        set({ dictationPauseMediaEnabled: value });
      },
      setDictationMicrophone: (value: DictationMicrophoneSelection) => {
        const selection = normalizeDictationMicrophoneSelection(value);
        // Device ids and names identify the person's hardware; analytics only
        // learn whether they left the default alone.
        trackSettingChange(
          "dictationMicrophone",
          selection.deviceId ? "custom" : "system-default",
        );
        set({ dictationMicrophone: selection });
      },
      setDictationShortcut: (value: DictationBinding) => {
        const platform = window.electron?.platform ?? "darwin";
        const binding = normalizeDictationBinding(value, platform);
        const handsFree = normalizeHandsFreeBinding(
          get().handsFreeShortcut,
          platform,
        );
        const action = normalizeActionBinding(get().actionShortcut, platform);
        trackSettingChange(
          "dictationShortcut",
          formatDictationBindingLabel(binding, {
            isMac: platform === "darwin",
          }),
        );
        set({
          dictationShortcut: binding,
          handsFreeShortcut: handsFreeConflictsWith(handsFree, binding, action)
            ? null
            : handsFree,
        });
      },
      setActionShortcut: (value: DictationBinding | null) => {
        const platform = window.electron?.platform ?? "darwin";
        const binding = normalizeActionBinding(value, platform);
        const handsFree = normalizeHandsFreeBinding(
          get().handsFreeShortcut,
          platform,
        );
        const dictation = normalizeDictationBinding(
          get().dictationShortcut,
          platform,
        );
        trackSettingChange(
          "actionShortcut",
          formatActionBindingLabel(binding, {
            isMac: platform === "darwin",
          }),
        );
        set({
          actionShortcut: binding,
          handsFreeShortcut: handsFreeConflictsWith(
            handsFree,
            dictation,
            binding,
          )
            ? null
            : handsFree,
        });
      },
      setHandsFreeShortcut: (value: DictationBinding | null) => {
        const platform = window.electron?.platform ?? "darwin";
        const binding = normalizeHandsFreeBinding(value, platform);
        trackSettingChange(
          "handsFreeShortcut",
          formatHandsFreeBindingLabel(binding, {
            isMac: platform === "darwin",
          }),
        );
        set({ handsFreeShortcut: binding });
      },
      setDictationActionModeEnabled: (value: boolean) => {
        trackSettingChange("dictationActionModeEnabled", value);
        set({ dictationActionModeEnabled: value });
      },
      setPolishShortcut: (value: PolishBinding | null) => {
        const platform = window.electron?.platform ?? "darwin";
        const binding = normalizePolishBinding(value, platform);
        trackSettingChange("polishShortcut", formatPolishBindingLabel(binding));
        set({ polishShortcut: binding });
      },
      setShowDictationPill: (value: boolean) => {
        trackSettingChange("showDictationPill", value);
        set({ showDictationPill: value });
      },
      setMinimizeDictationPill: (value: boolean) => {
        trackSettingChange("minimizeDictationPill", value);
        set({ minimizeDictationPill: value });
      },
      setDictationSoundEffects: (value: boolean) => {
        trackSettingChange("dictationSoundEffects", value);
        set({ dictationSoundEffects: value });
      },
    }),
    {
      name: "local-settings",
      version: LOCAL_SETTINGS_VERSION,
      storage: createJSONStorage(() =>
        createOwnerOnlyStorage(storage, isLocalSettingsPersistOwner),
      ),
      migrate: (persistedState, version) =>
        migrateLocalSettings(persistedState, version) as LocalSettingsStore,
      onRehydrateStorage: () => (state, error) => {
        // A failed hydrate must not push defaults into Electron over the
        // user's saved native dictation settings.
        if (error || !state) {
          console.error("[LOCAL_SETTINGS] Failed to rehydrate:", error);
          return;
        }

        state.upcomingMeetingNotification =
          normalizeUpcomingMeetingNotification(
            state.upcomingMeetingNotification,
          );
        state.dictationTranscriptionProvider =
          state.dictationTranscriptionProvider == null
            ? null
            : normalizeDictationTranscriptionProvider(
                state.dictationTranscriptionProvider,
              );
        state.dictationLanguageHints = normalizeDictationLanguageHints(
          state.dictationLanguageHints,
        );
        state.dictationMicrophone = normalizeDictationMicrophoneSelection(
          state.dictationMicrophone,
        );

        // Overlay windows share this store. Only the main window may push
        // bindings into Electron, or a late default hydrate resets the pill.
        syncRehydratedSettingsToElectron(state, {
          pushBindings: isLocalSettingsPersistOwner(),
          syncLaunchAtStartupPreference: setLaunchAtStartupSilently,
        });
      },
    },
  ),
);

export const getLocalSettings = () => {
  return useLocalSettings.getState();
};

export const getDictationLanguageHints = () =>
  normalizeDictationLanguageHints(getLocalSettings().dictationLanguageHints);

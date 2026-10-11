import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";

interface RecordPreferenceStoreValue {
  language: string;
  /** True once the user picks a recording language themselves. Until then `language` follows the account's preferredLanguage. */
  hasExplicitLanguage: boolean;
  hasDismissedWidgetAnnouncement: boolean;
  /** Preferred audio input device id. Switches the live recording and applies on the next recording start. */
  audioInputDeviceId: string | null;
  setLanguage(language: string): void;
  /** Follows the account's preferredLanguage while the user has not picked a recording language themselves. */
  syncLanguageFromAccount(language: string): void;
  setAudioInputDeviceId(audioInputDeviceId: string | null): void;
  dismissWidgetAnnouncement(): void;
}

export const useRecordPreferencesStore = create(
  persist<RecordPreferenceStoreValue>(
    (set, get) => ({
      language: "en",
      hasExplicitLanguage: false,
      hasDismissedWidgetAnnouncement: false,
      audioInputDeviceId: null,
      setLanguage(language: string) {
        set({ language, hasExplicitLanguage: true });
      },
      syncLanguageFromAccount(language: string) {
        if (get().hasExplicitLanguage || get().language === language) return;
        set({ language });
      },
      setAudioInputDeviceId(audioInputDeviceId: string | null) {
        set({ audioInputDeviceId });
      },
      dismissWidgetAnnouncement() {
        set({ hasDismissedWidgetAnnouncement: true });
      },
    }),
    {
      name: "record-preferences",
      storage: createJSONStorage(() => storage),
      version: 1,
      // Devices persisted before `hasExplicitLanguage` existed: a stored
      // language other than the old "en" default can only come from the user
      // picking one, so keep it pinned. A stored "en" is indistinguishable
      // from the default and falls back to the account language.
      migrate(persisted, version) {
        const state = persisted as Partial<RecordPreferenceStoreValue>;
        if (version >= 1) return state as RecordPreferenceStoreValue;
        return {
          ...state,
          hasExplicitLanguage: !!state.language && state.language !== "en",
        } as RecordPreferenceStoreValue;
      },
    },
  ),
);

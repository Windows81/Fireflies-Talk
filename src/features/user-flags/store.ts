import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";

export interface LocalUserFlags {
  "record.language-select-prompt.shown": boolean;
  "desktop.first-time-demo-and-record.shown": boolean;
  "desktop.intro-video.seen": boolean;
  "desktop.greeting-intro.dismissed": boolean;
  "personal-assistant.trial-banner.dismissed": boolean;
  "desktop.welcome-modal.shown": boolean;
  "desktop.recap-email-prompt.shown": boolean;
  "desktop.consent-chat-banner.seen": boolean;
  "desktop.speaker-labels-announcement.seen": boolean;
  "offline-mode.announcement.seen": boolean;
  "desktop.dictation-onboarding.completed": boolean;
  "desktop.talk-pill-teaser.dismissed": boolean;
  "desktop.talk-intro-banner.dismissed": boolean;
}

export interface LocalUserFlagsStoreValue {
  flags: Partial<LocalUserFlags>;
  setFlag: <K extends keyof LocalUserFlags>(
    key: K,
    value: LocalUserFlags[K],
  ) => void;
  clearFlag: <K extends keyof LocalUserFlags>(key: K) => void;
}

export const userLocalUserFlagsStore = create(
  persist<LocalUserFlagsStoreValue>(
    (set) => ({
      flags: {},
      setFlag: (key: string, value: boolean) =>
        set((state) => ({
          flags: { ...state.flags, [key]: value },
        })),
      clearFlag: (key: string) =>
        set((state) => {
          const flags = { ...state.flags };
          delete flags[key as keyof LocalUserFlags];
          return { flags };
        }),
    }),
    {
      name: "localUserFlags",
      storage: createJSONStorage(() => storage),
    },
  ),
);

export function setLocalUserFlag<K extends keyof LocalUserFlags>(
  key: K,
  value: LocalUserFlags[K],
) {
  userLocalUserFlagsStore.getState().setFlag(key, value);
}

export function getLocalUserFlag<K extends keyof LocalUserFlags>(
  key: K,
): LocalUserFlags[K] | undefined {
  return userLocalUserFlagsStore.getState().flags[key];
}

export function clearLocalUserFlag<K extends keyof LocalUserFlags>(
  key: K,
): void {
  userLocalUserFlagsStore.getState().clearFlag(key);
}

/** Flag key for "desktop first-time demo and record" shown state. */
export const DESKTOP_FIRST_TIME_DEMO_FLAG_KEY =
  "desktop.first-time-demo-and-record.shown" as const;

/** Flag key for "desktop intro video shown once before login". */
export const DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY =
  "desktop.intro-video.seen" as const;

/** Flag key for "greeting intro banner (Welcome Aboard) dismissed". */
export const DESKTOP_GREETING_INTRO_DISMISSED_FLAG_KEY =
  "desktop.greeting-intro.dismissed" as const;

/**
 * Flag key for "Personal Assistant trial banner dismissed" — only relevant for
 * the access-end stage of the trial, where users can opt to hide the banner
 * once they've decided not to re-enable.
 */
export const PERSONAL_ASSISTANT_TRIAL_BANNER_DISMISSED_FLAG_KEY =
  "personal-assistant.trial-banner.dismissed" as const;

/** Flag key for "desktop welcome modal shown on first app startup". */
export const DESKTOP_WELCOME_MODAL_SHOWN_FLAG_KEY =
  "desktop.welcome-modal.shown" as const;

/**
 * Three-state flag for the recap email nudge tooltip:
 *   undefined → never triggered (don't show)
 *   false     → attendees synced, tooltip pending (show once)
 *   true      → tooltip already shown/dismissed (don't show again)
 *
 * Consumers must use strict equality (`=== false`) — a truthy/falsy check
 * would incorrectly treat `undefined` as "show".
 */
export const DESKTOP_RECAP_EMAIL_PROMPT_SHOWN_FLAG_KEY =
  "desktop.recap-email-prompt.shown" as const;

/**
 * Flag key for "Keep Everyone in the Loop" consent-chat banner having been
 * acted on (Enable or Skip) — shown at most once, after the user's first
 * real (non-demo) recording.
 */
export const CONSENT_CHAT_BANNER_SEEN_FLAG_KEY =
  "desktop.consent-chat-banner.seen" as const;

/**
 * Flag key for the "speaker labels in your transcript" announcement having
 * been acted on (Turn on or Not now). Shown at most once on desktop.
 */
export const SPEAKER_LABELS_ANNOUNCEMENT_SEEN_FLAG_KEY =
  "desktop.speaker-labels-announcement.seen" as const;

/** Flag key for "offline mode announcement modal shown once" (mobile only). */
export const OFFLINE_MODE_ANNOUNCEMENT_SEEN_FLAG_KEY =
  "offline-mode.announcement.seen" as const;

/** Flag key for "dictation tab onboarding completed". */
export const DESKTOP_DICTATION_ONBOARDING_COMPLETED_FLAG_KEY =
  "desktop.dictation-onboarding.completed" as const;

/** Flag key for the pill's "Try Talk" card having been closed or tried. */
export const DESKTOP_TALK_PILL_TEASER_DISMISSED_FLAG_KEY =
  "desktop.talk-pill-teaser.dismissed" as const;

/** Flag key for "Notetaker tab Talk intro banner dismissed". */
export const DESKTOP_TALK_INTRO_BANNER_DISMISSED_FLAG_KEY =
  "desktop.talk-intro-banner.dismissed" as const;

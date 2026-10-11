import {
  defaultDictationBinding,
  normalizeDictationBinding,
} from "electron/src/dictation/dictation-binding";
import {
  resolveOverlayPreferenceAction,
  resolvePersistedActionBinding,
} from "electron/src/dictation/action-binding";
import { defaultPolishBinding } from "electron/src/dictation/polish-binding";
import {
  DEFAULT_DICTATION_TRANSCRIPTION_PROVIDER,
  migrateDictationTranscriptionProviderOverride,
} from "./dictationTranscriptionProvider";
import { DEFAULT_DICTATION_LANGUAGE_HINTS } from "./dictationLanguages";
import { normalizeDictationMicrophoneSelection } from "./dictationMicrophoneSelection";
import { normalizeUpcomingMeetingNotification } from "./upcomingMeetingNotification";

/** Bump together with the newest `version < N` step below. */
export const LOCAL_SETTINGS_VERSION = 26;

/**
 * Brings a persisted `local-settings` blob from `version` up to
 * LOCAL_SETTINGS_VERSION, one step at a time. The result is still untyped:
 * useLocalSettings normalizes it again on rehydrate.
 */
export function migrateLocalSettings(
  persistedState: unknown,
  version: number,
): unknown {
  if (
    typeof persistedState !== "object" ||
    persistedState === null ||
    !("upcomingMeetingNotification" in persistedState)
  ) {
    return persistedState;
  }

  let state = persistedState as Record<string, unknown>;

  if (version < 1) {
    state = {
      ...state,
      upcomingMeetingNotification: normalizeUpcomingMeetingNotification(
        state.upcomingMeetingNotification,
      ),
    };
  }

  // v2: reset takeNotesClickCount so the auto-start upsell shows for all users
  if (version < 2) {
    state = { ...state, takeNotesClickCount: 0 };
  }

  // v3: split globalShortcutsEnabled into per-shortcut settings
  if (version < 3) {
    const wasEnabled =
      (state as Record<string, unknown>).globalShortcutsEnabled ?? true;
    state = {
      ...state,
      quickNoteShortcutEnabled: wasEnabled,
      quickNoteShortcutKey: "N",
    };
  }

  // v4: Daily Digest renamed to Daily Brief — carry the opt-out over
  if (version < 4) {
    state = {
      ...state,
      dailyBriefNotification: state.dailyDigestNotification ?? true,
    };
  }

  // v5: dictation post-processing (defaults to on)
  if (version < 5) {
    state = { ...state, dictationPostProcessingEnabled: true };
  }

  // v6: ElevenLabs-only dictation — drop the whisper/elevenlabs toggle
  if (version < 6) {
    delete state.dictationTranscriptionProvider;
  }

  // v7: dictation-branch stores were already at v6 without the daily-brief rename
  if (version < 7 && "dailyDigestNotification" in state) {
    state = {
      ...state,
      dailyBriefNotification: state.dailyDigestNotification ?? true,
    };
  }

  // v8: pause media during dictation (defaults to off)
  if (version < 8) {
    state = { ...state, dictationPauseMediaEnabled: false };
  }

  // v9: dictation microphone (empty = system default)
  if (version < 9) {
    state = { ...state, dictationMicrophoneDeviceId: "" };
  }

  // v10: customizable dictation push-to-talk shortcut
  if (version < 10) {
    state = {
      ...state,
      dictationShortcut: defaultDictationBinding(
        window.electron?.platform ?? "darwin",
      ),
    };
  }

  // v11: screen context for dictation (defaults to on)
  if (version < 11) {
    state = { ...state, useScreenContextForDictation: true };
  }

  // v12: AssemblyAI vs ElevenLabs transcription (defaults to ElevenLabs)
  if (version < 12) {
    state = {
      ...state,
      dictationTranscriptionProvider: DEFAULT_DICTATION_TRANSCRIPTION_PROVIDER,
    };
  }

  // v13: post-processing is always on — drop the toggle
  if (version < 13) {
    delete state.dictationPostProcessingEnabled;
  }

  // v14: show dictation pill (defaults to on)
  if (version < 14) {
    state = { ...state, showDictationPill: true };
  }

  // v15: follow the transcription-provider experiment until the user picks
  if (version < 15) {
    state = {
      ...state,
      dictationTranscriptionProvider:
        migrateDictationTranscriptionProviderOverride(
          state.dictationTranscriptionProvider,
        ),
    };
  }

  // v16: Scribe language hints (defaults to English)
  if (version < 16) {
    state = {
      ...state,
      dictationLanguageHints: [...DEFAULT_DICTATION_LANGUAGE_HINTS],
    };
  }

  // v18: rest the pill minimized (the shape everyone already had)
  if (version < 18) {
    state = { ...state, minimizeDictationPill: true };
  }

  // v17: dedicated action shortcut + optional Shift overlay
  if (version < 17) {
    const platform = window.electron?.platform ?? "darwin";
    state = {
      ...state,
      actionShortcut: resolvePersistedActionBinding(
        platform === "darwin" ? null : undefined,
        normalizeDictationBinding(state.dictationShortcut, platform),
        platform,
      ),
    };
  }

  // v19: action-mode master switch + recordable polish shortcut
  if (version < 19) {
    const platform = window.electron?.platform ?? "darwin";
    state = {
      ...state,
      dictationActionModeEnabled: true,
      polishShortcut: defaultPolishBinding(platform),
    };
  }

  // v20: Fn + Shift became a real action-mode binding, replacing the
  // separate "also use Shift" preference.
  if (version < 20) {
    const platform = window.electron?.platform ?? "darwin";
    const usedOverlay = state.actionModeShiftOverlay !== false;
    delete state.actionModeShiftOverlay;
    state = {
      ...state,
      actionShortcut: resolveOverlayPreferenceAction(
        state.actionShortcut,
        normalizeDictationBinding(state.dictationShortcut, platform),
        usedOverlay,
        platform,
      ),
    };
  }

  // v21: the seeded default was Fn+1 with an implicit F1 alias. Stamp
  // only that shape. Recorded Fn+F1 was never the default.
  if (version < 21) {
    const polish = state.polishShortcut;
    if (
      polish &&
      typeof polish === "object" &&
      (polish as { type?: unknown }).type === "darwin-fn" &&
      (polish as { key?: unknown }).key === "1" &&
      (polish as { functionRowAlias?: unknown }).functionRowAlias == null
    ) {
      state = {
        ...state,
        polishShortcut: { ...polish, functionRowAlias: true },
      };
    }
  }

  // v22: the mic keeps its name and hardware group so a stale id can
  // be matched back to the same device instead of dropping to default.
  if (version < 22) {
    const deviceId = state.dictationMicrophoneDeviceId;
    delete state.dictationMicrophoneDeviceId;
    state = {
      ...state,
      dictationMicrophone: normalizeDictationMicrophoneSelection({
        deviceId: typeof deviceId === "string" ? deviceId : "",
      }),
    };
  }

  // v23: dictation sound effects (defaults to on)
  if (version < 23) {
    state = { ...state, dictationSoundEffects: true };
  }

  // v24: optional hands-free shortcut (unassigned by default)
  if (version < 24) {
    state = { ...state, handsFreeShortcut: null };
  }

  // v25: pause media during dictation is now on by default
  if (version < 25) {
    state = { ...state, dictationPauseMediaEnabled: true };
  }

  // v26: beta Meet speaker names, off until the user opts in
  if (version < 26) {
    state = { ...state, meetSpeakerNamesBeta: false };
  }

  return state;
}

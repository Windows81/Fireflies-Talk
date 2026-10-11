import { normalizeDictationBinding } from "electron/src/dictation/dictation-binding";
import { resolvePersistedActionBinding } from "electron/src/dictation/action-binding";
import { normalizePolishBinding } from "electron/src/dictation/polish-binding";
import { resolvePersistedHandsFreeBinding } from "electron/src/dictation/hands-free-binding";
import { syncLaunchAtStartup } from "./launchAtStartup";
import type { LocalSettings } from "./useLocalSettings";

export interface RehydrateElectronSyncOptions {
  /** Only the main window may push bindings; overlays share the store. */
  pushBindings: boolean;
  syncLaunchAtStartupPreference: (value: boolean) => void;
}

const logRehydrateError = (what: string) => (error: unknown) => {
  console.error(`[LOCAL_SETTINGS] Failed to ${what} on rehydration:`, error);
};

/**
 * Applies the rehydrated settings to Electron on app start. Normalizes the
 * persisted dictation bindings in place so the store and Electron agree.
 */
export function syncRehydratedSettingsToElectron(
  state: LocalSettings,
  { pushBindings, syncLaunchAtStartupPreference }: RehydrateElectronSyncOptions,
): void {
  const electron = window.electron;

  electron?.window
    ?.setContentProtection?.(state.hideFloatingDockWhenScreenSharing)
    ?.catch(logRehydrateError("apply content protection"));

  if (pushBindings) {
    void electron?.app
      ?.setQuickNoteShortcut?.(
        state.quickNoteShortcutEnabled,
        state.quickNoteShortcutKey,
      )
      ?.catch(logRehydrateError("apply quick note shortcut"));
  }

  electron?.dictation?.setPauseMediaEnabled?.(state.dictationPauseMediaEnabled);

  const platform = electron?.platform ?? "darwin";
  state.dictationShortcut = normalizeDictationBinding(
    state.dictationShortcut,
    platform,
  );
  state.actionShortcut = resolvePersistedActionBinding(
    state.actionShortcut,
    state.dictationShortcut,
    platform,
  );
  state.polishShortcut = normalizePolishBinding(state.polishShortcut, platform);
  state.handsFreeShortcut = resolvePersistedHandsFreeBinding(
    state.handsFreeShortcut,
    state.dictationShortcut,
    state.actionShortcut,
    state.polishShortcut,
    platform,
  );

  if (pushBindings) {
    void electron?.dictation
      ?.setShortcut?.(state.dictationShortcut)
      ?.catch(logRehydrateError("apply dictation shortcut"));
    void electron?.dictation
      ?.setActionShortcut?.(state.actionShortcut)
      ?.catch(logRehydrateError("apply action shortcut"));
    void electron?.dictation
      ?.setPolishShortcut?.(state.polishShortcut)
      ?.catch(logRehydrateError("apply polish shortcut"));
    void electron?.dictation
      ?.setHandsFreeShortcut?.(state.handsFreeShortcut)
      ?.catch(logRehydrateError("apply hands-free shortcut"));
  }

  // Pill visibility is owned by useDictationPillVisibility (flag-gated).
  electron?.dictation?.setPillMinimized?.(
    state.minimizeDictationPill !== false,
  );

  // Re-register the login item on app start when Windows lost it (an app
  // update can drop the registry entry). Never disables it, so a
  // default-false store value can't undo an externally configured entry.
  syncLaunchAtStartup({
    launchAtStartup: state.launchAtStartup,
    syncPreference: syncLaunchAtStartupPreference,
  }).catch(logRehydrateError("sync launch at startup"));
}

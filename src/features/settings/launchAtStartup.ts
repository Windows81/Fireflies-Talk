import { getActualPlatform } from "@/utils/device";

export interface LaunchAtStartupPreference {
  launchAtStartup: boolean;
  /** Writes the preference without tracking it — this isn't a user action. */
  syncPreference: (value: boolean) => void;
}

/**
 * Reconciles the "Launch at start up" preference with the OS login item.
 *
 * A login item enabled outside the app is adopted into the preference. When the
 * OS entry is missing, only Windows re-registers it: an app update rewrites the
 * registry Run entry and the app then never launches at login even though the
 * setting reads on. Elsewhere a missing entry is an intentional opt-out (e.g.
 * macOS System Settings → Login Items), so the preference follows the OS.
 *
 * Never removes an entry, so a default-false preference can't undo a login item
 * configured by the installer.
 */
export async function syncLaunchAtStartup(
  preference: LaunchAtStartupPreference,
): Promise<void> {
  const appApi = window.electron?.app;
  if (!appApi?.getLoginItemSettings || !appApi.setLoginItemSettings) return;

  const enabledInOs = await appApi.getLoginItemSettings();
  if (enabledInOs === preference.launchAtStartup) return;

  if (enabledInOs) {
    preference.syncPreference(true);
    return;
  }

  if (getActualPlatform() === "win32") {
    await appApi.setLoginItemSettings(true);
    return;
  }

  preference.syncPreference(false);
}

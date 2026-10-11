import { useAuth } from "@/features/auth";
import { useLocalSettings } from "@/features/settings";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { useIsDictationAvailable } from "./useIsDictationAvailable";
import { shouldBindDictationRuntime } from "./dictationRuntimeHost";
import { dictationEnableLock } from "./dictationRuntimeLock";
import { closeDictationStreamClient } from "./dictationStreamClient";
import { useEffect } from "react";

/**
 * The dictation pill is a standalone Electron window created in the main
 * process. Keep it and the dictation hotkey off until a user is signed in
 * and Fireflies Talk is available here, and tear both down on logout or when
 * the flag turns off. The Fn/Globe HID tap is installed only then. Logout
 * also closes the dictation stream socket, which belongs to the old user.
 */
export function useDictationPillVisibility(): void {
  const isSignedIn = Boolean(useAuth((s) => s.user));
  const isDictationAvailable = useIsDictationAvailable();
  const showDictationPill = useLocalSettings((s) => s.showDictationPill);

  useEffect(() => {
    if (
      !shouldBindDictationRuntime({
        isDesktop,
        hasDictationApi: Boolean(window.electron?.dictation),
        isMainWindow: isMainDesktopWindow(),
      })
    ) {
      return;
    }

    const enabled = isSignedIn && isDictationAvailable;

    return dictationEnableLock.acquire((on) => {
      window.electron?.dictation?.setEnabled(on);
    }, enabled);
  }, [isSignedIn, isDictationAvailable]);

  useEffect(() => {
    if (
      !shouldBindDictationRuntime({
        isDesktop,
        hasDictationApi: Boolean(window.electron?.dictation),
        isMainWindow: isMainDesktopWindow(),
      })
    ) {
      return;
    }

    if (!isSignedIn || !isDictationAvailable) return;

    window.electron?.dictation?.setPillVisible?.(showDictationPill);
  }, [isSignedIn, isDictationAvailable, showDictationPill]);

  useEffect(() => {
    if (!isSignedIn) closeDictationStreamClient();
  }, [isSignedIn]);
}

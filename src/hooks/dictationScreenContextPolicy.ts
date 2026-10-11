import type { DictationMode, DictationScreenContext } from "electron/src/types";

/**
 * Whether a dictation may read the screen. Command mode reads it even with the
 * setting off, since the spoken command can be about what is on screen. An
 * admin turning screen context off covers every mode.
 */
export const shouldReadDictationScreenContext = ({
  disabledByAdmin,
  enabledByUser,
  mode,
}: {
  disabledByAdmin: boolean;
  enabledByUser: boolean;
  mode: DictationMode;
}): boolean => !disabledByAdmin && (mode === "command" || enabledByUser);

/**
 * The screen capture a dictation may still use. An admin can turn screen
 * context off after the read started, so this is checked where the capture is
 * used, and again once it resolves.
 */
export function usableScreenContext(
  capture: Promise<DictationScreenContext | null> | null,
  isDisabledByAdmin: () => boolean,
): Promise<DictationScreenContext | null> | null {
  if (!capture || isDisabledByAdmin()) return null;
  return capture.then((context) => (isDisabledByAdmin() ? null : context));
}

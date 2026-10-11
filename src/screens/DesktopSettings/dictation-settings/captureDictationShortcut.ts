import {
  bindingFromModifiersAndKey,
  keyTokenFromMacVirtualKey,
  validateCapturedBinding,
  type DictationBinding,
  type ModifierId,
  type ModifierKeyId,
} from "electron/src/dictation/dictation-binding";
import {
  type CaptureModifierFlags,
  modifiersFromCaptureFlags,
} from "electron/src/dictation/shortcut-capture-modifiers";
import {
  applyCaptureKeyDown,
  applyCaptureMouse,
  applyCaptureWin,
  commitHeldMouseBinding,
  initialCapturePeakState,
  strongerCaptureBinding,
  type CapturePeakState,
} from "electron/src/dictation/shortcut-capture-peak";
import {
  mouseButtonFromDomButton,
  shouldInterceptMouseCapture,
} from "electron/src/dictation/hotkey-mouse";
import { getActualPlatform } from "@/utils/device";
import {
  finishCapturePeak,
  type CaptureResult,
} from "./captureDictationShortcutHelpers";

const CAPTURE_TIMEOUT_MS = 12_000;

const MODIFIER_KEYS = new Set(["Alt", "Control", "Meta", "Shift"]);

const MODIFIER_KEY_BY_CODE: Record<string, ModifierKeyId> = {
  AltLeft: "alt-left",
  AltRight: "alt-right",
  ControlLeft: "ctrl-left",
  ControlRight: "ctrl-right",
  MetaLeft: "meta-left",
  MetaRight: "meta-right",
  ShiftLeft: "shift-left",
  ShiftRight: "shift-right",
};

function flagsFromEvent(event: KeyboardEvent | MouseEvent): {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
} {
  return {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  };
}

function keyTokenFromEvent(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;
  const { code } = event;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-2])$/.test(code)) return code;
  if (code === "Space") return "Space";
  if (code === "Backquote") return "Backquote";
  return null;
}

// A non-modifier key pressed with nothing else held (a letter, Tab, Caps
// Lock...) is ignored so the recorder keeps listening.
const isBareKey = (
  event: KeyboardEvent,
  flags: CaptureModifierFlags,
  state: CapturePeakState,
): boolean =>
  !MODIFIER_KEYS.has(event.key) &&
  modifiersFromCaptureFlags(flags, state.captureWinHeld).length === 0 &&
  !state.fnHeld;

/**
 * Captures a shortcut from the focused settings window.
 * Fn chords come from the native listener, since macOS never delivers Fn to
 * the page. Side mouse buttons come from the native hook (and DOM as fallback)
 * so Mouse 4 / 5 record even when the cursor is outside this window.
 */
export function captureDictationShortcut(options?: {
  /** Accept Fn on its own. Polish needs a key alongside Fn. */
  allowBareFn?: boolean;
  /**
   * Fires as keys go down and up with the combination held so far, so callers
   * can show a chord building up. Partial holds are reported even when they
   * would not validate on their own.
   */
  onProgress?: (inProgress: DictationBinding | null) => void;
  signal?: AbortSignal;
}): Promise<CaptureResult> {
  return new Promise((resolve) => {
    let settled = false;
    const platform = getActualPlatform();
    let capture = initialCapturePeakState(platform);
    let pendingMouse: DictationBinding | null = null;
    let fnHeld = false;
    // Modifiers seen at any point during the Fn hold, so Fn + Shift still
    // registers when Shift is released before Fn.
    let fnModifiers = new Set<ModifierId>();

    const onAbort = () => finish({ error: "Cancelled." });

    const report = () => {
      if (!options?.onProgress) return;
      if (fnHeld) {
        options.onProgress({
          modifiers: [...fnModifiers],
          type: "darwin-fn",
        });
        return;
      }
      options.onProgress(
        capture.peak ??
          bindingFromModifiersAndKey(
            modifiersFromCaptureFlags(
              capture.lastFlags,
              capture.captureWinHeld,
            ),
            capture.lastKey,
            capture.lastMouse,
            capture.fnHeld,
            capture.lastModifierKey,
          ),
      );
    };

    const finish = (result: { binding?: DictationBinding; error?: string }) => {
      if (settled) return;
      settled = true;
      options?.signal?.removeEventListener("abort", onAbort);
      stopCaptureWin?.();
      stopCaptureFn?.();
      stopCaptureFnChord?.();
      stopCaptureMouse?.();
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("mouseup", onMouseUp, true);
      window.removeEventListener("auxclick", onAuxClick, true);
      clearTimeout(timeout);
      resolve(result);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;
      // The native listener owns the key half of an Fn chord and swallows it.
      // Modifiers are not swallowed, so collect them here.
      if (fnHeld && event.key !== "Escape") {
        noteFnModifiers(event);
        report();
        return;
      }
      if (event.key === "Escape") {
        finish({ error: "Cancelled." });
        return;
      }
      const key = keyTokenFromEvent(event);
      const flags = flagsFromEvent(event);
      if (isBareKey(event, flags, capture)) {
        return;
      }
      capture = applyCaptureKeyDown(
        capture,
        flags,
        key,
        platform === "darwin" ? MODIFIER_KEY_BY_CODE[event.code] : undefined,
      );
      report();
      if (MODIFIER_KEYS.has(event.key)) return;
      if (!key) {
        finish({
          error:
            "That key can't be used. Try Shift, Control, Option/Alt, Command/Win, or a supported key combination.",
        });
        return;
      }
      const error = validateCapturedBinding(capture.peak, platform);
      if (error || !capture.peak) return;
      finish({ binding: capture.peak });
    };

    const noteFnModifiers = (event: KeyboardEvent) => {
      if (event.shiftKey || event.key === "Shift") fnModifiers.add("shift");
      if (event.ctrlKey) fnModifiers.add("ctrl");
      if (event.altKey) fnModifiers.add("alt");
      if (event.metaKey) fnModifiers.add("meta");
    };

    const onKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (fnHeld) {
        noteFnModifiers(event);
        report();
        return;
      }
      const key = keyTokenFromEvent(event);
      const flags = flagsFromEvent(event);
      if (isBareKey(event, flags, capture)) {
        return;
      }
      capture = applyCaptureKeyDown(capture, flags, key);
      report();
      if (!MODIFIER_KEYS.has(event.key)) return;
      finishCapturePeak(capture, platform, finish);
    };

    const applyMouseButton = (
      button: 4 | 5,
      down: boolean,
      flags: {
        altKey: boolean;
        ctrlKey: boolean;
        metaKey: boolean;
        shiftKey: boolean;
      },
    ) => {
      capture = applyCaptureMouse(capture, flags, button, down);
      report();

      const binding = bindingFromModifiersAndKey(
        modifiersFromCaptureFlags(capture.lastFlags, capture.captureWinHeld),
        undefined,
        button,
        capture.fnHeld,
      );

      const error = validateCapturedBinding(binding, platform);

      if (down) {
        if (error || !binding) {
          finish({ error: error ?? "Couldn't capture that shortcut." });
          return;
        }
        pendingMouse = strongerCaptureBinding(
          binding,
          capture.peak?.type === "chord" && capture.peak.mouseButton === button
            ? capture.peak
            : null,
          platform,
        );

        return;
      }

      const saved = commitHeldMouseBinding(
        pendingMouse,
        capture.peak,
        button,
        platform,
      );
      if (saved) finish({ binding: saved });
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!shouldInterceptMouseCapture(event.button)) return;
      event.preventDefault();
      event.stopPropagation();
      const mapped = mouseButtonFromDomButton(event.button);
      if (mapped === null) return;
      applyMouseButton(mapped, true, flagsFromEvent(event));
    };

    const onMouseUp = (event: MouseEvent) => {
      if (!shouldInterceptMouseCapture(event.button)) return;
      event.preventDefault();
      event.stopPropagation();
      const mapped = mouseButtonFromDomButton(event.button);
      if (mapped === null) return;
      applyMouseButton(mapped, false, flagsFromEvent(event));
    };

    const onAuxClick = (event: MouseEvent) => {
      if (!shouldInterceptMouseCapture(event.button)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const timeout = setTimeout(() => {
      if (capture.peak && !validateCapturedBinding(capture.peak, platform)) {
        finish({ binding: capture.peak });
        return;
      }
      finish({ error: "Timed out. Try recording again." });
    }, CAPTURE_TIMEOUT_MS);

    const stopCaptureWin = window.electron?.dictation?.onCaptureWin?.(
      (down) => {
        capture = applyCaptureWin(capture, down);
        report();

        if (capture.lastMouse && pendingMouse) {
          const binding = bindingFromModifiersAndKey(
            modifiersFromCaptureFlags(
              capture.lastFlags,
              capture.captureWinHeld,
            ),
            undefined,
            capture.lastMouse,
            capture.fnHeld,
          );

          pendingMouse = strongerCaptureBinding(
            pendingMouse,
            binding,
            platform,
          );
        }

        if (!down) finishCapturePeak(capture, platform, finish);
      },
    );

    const stopCaptureMouse = window.electron?.dictation?.onCaptureMouse?.(
      (button, down, flags) => {
        applyMouseButton(button, down, flags ?? capture.lastFlags);
      },
    );

    const stopCaptureFn = window.electron?.dictation?.onCaptureFn?.((down) => {
      fnHeld = down;
      if (down) {
        fnModifiers = new Set(
          modifiersFromCaptureFlags(capture.lastFlags, capture.captureWinHeld),
        );
        report();
        return;
      }
      if (fnModifiers.size > 0) {
        const binding: DictationBinding = {
          modifiers: [...fnModifiers],
          type: "darwin-fn",
        };
        const error = validateCapturedBinding(binding, platform);
        finish(error ? { error } : { binding });
        return;
      }
      finish(
        options?.allowBareFn
          ? { binding: { type: "darwin-fn" } }
          : {
              error:
                "Fn on its own can't be used here. Hold Fn and press another key as well.",
            },
      );
    });

    const stopCaptureFnChord = window.electron?.dictation?.onCaptureFnChord?.(
      (keyCode) => {
        if (fnModifiers.size > 0) {
          finish({
            error:
              "Fn plus a modifier can't also take another key. Try Fn + Shift, or Fn and a key.",
          });
          return;
        }
        const key = keyTokenFromMacVirtualKey(keyCode);
        if (!key) {
          finish({
            error:
              "That key can't be used with Fn. Try a letter, a number, or F1–F12.",
          });
          return;
        }
        finish({ binding: { key, type: "darwin-fn" } });
      },
    );

    if (options?.signal?.aborted) {
      finish({ error: "Cancelled." });
      return;
    }
    options?.signal?.addEventListener("abort", onAbort);

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("mouseup", onMouseUp, true);
    window.addEventListener("auxclick", onAuxClick, true);
  });
}

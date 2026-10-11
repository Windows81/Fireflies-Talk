import type { CaptureModifierFlags } from "./shortcut-capture-modifiers";

export const ALLOWED_MOUSE_BUTTONS = new Set([4, 5]);
const DISALLOWED_MOUSE_BUTTONS = new Set([0, 1, 2, 3]);

export const formatMouseLabel = (mouseButton: number): string => {
  if (mouseButton === 4) return "Mouse 4 - Back";
  if (mouseButton === 5) return "Mouse 5 - Forward";
  return `Mouse ${mouseButton}`;
};

export const formatCustomShortcutOption = (label: string): string =>
  `Custom - ${label}`;

/** Chromium: 0 left, 1 middle, 2 right, 3 back, 4 forward. */
export const mouseButtonFromDomButton = (button: number): 4 | 5 | null => {
  if (button === 3) return 4;
  if (button === 4) return 5;
  return null;
};

/** Electron app-command for XButtons when Chromium maps them to history. */
export const mouseButtonFromAppCommand = (command: string): 4 | 5 | null => {
  if (command === "browser-backward") return 4;
  if (command === "browser-forward") return 5;
  return null;
};

function captureMouseToken(
  token: string,
): { button: 4 | 5; down: boolean } | null {
  if (token === "MOUSE4_DOWN") return { button: 4, down: true };
  if (token === "MOUSE4_UP") return { button: 4, down: false };
  if (token === "MOUSE5_DOWN") return { button: 5, down: true };
  if (token === "MOUSE5_UP") return { button: 5, down: false };
  return null;
}

export const parseCaptureMouseLine = (
  line: string,
): {
  button: 4 | 5;
  down: boolean;
  flags?: CaptureModifierFlags;
} | null => {
  const [token, bits] = line.split(" ");
  const parsed = captureMouseToken(token);
  if (!parsed) return null;
  if (!bits || bits.length < 4) return parsed;

  return {
    ...parsed,
    flags: {
      altKey: bits[1] === "1",
      ctrlKey: bits[0] === "1",
      metaKey: bits[3] === "1",
      shiftKey: bits[2] === "1",
    },
  };
};

/** Only side buttons are captured. preventDefault on left/right/middle
 * leaves Chromium mouse capture stuck, so other apps stop receiving clicks. */
export const shouldInterceptMouseCapture = (button: number): boolean =>
  mouseButtonFromDomButton(button) !== null;

export const normalizeMouseButton = (value: unknown): 4 | 5 | undefined => {
  if (value === 4 || value === 5) return value;
  return undefined;
};

export const mouseButtonCaptureError = (button: unknown): string | null => {
  const numeric =
    typeof button === "number"
      ? button
      : typeof button === "string"
        ? Number(button)
        : Number.NaN;
  if (DISALLOWED_MOUSE_BUTTONS.has(numeric)) {
    return "Use a side mouse button (Mouse 4 or Mouse 5), not the main buttons.";
  }
  if (!Number.isFinite(numeric) || !ALLOWED_MOUSE_BUTTONS.has(numeric)) {
    return "Unsupported mouse button. Use Mouse 4 or Mouse 5.";
  }
  return null;
};

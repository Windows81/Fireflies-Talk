"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mouseButtonCaptureError = exports.normalizeMouseButton = exports.shouldInterceptMouseCapture = exports.parseCaptureMouseLine = exports.mouseButtonFromAppCommand = exports.mouseButtonFromDomButton = exports.formatCustomShortcutOption = exports.formatMouseLabel = exports.ALLOWED_MOUSE_BUTTONS = void 0;
exports.ALLOWED_MOUSE_BUTTONS = new Set([4, 5]);
const DISALLOWED_MOUSE_BUTTONS = new Set([0, 1, 2, 3]);
const formatMouseLabel = (mouseButton) => {
    if (mouseButton === 4)
        return "Mouse 4 - Back";
    if (mouseButton === 5)
        return "Mouse 5 - Forward";
    return `Mouse ${mouseButton}`;
};
exports.formatMouseLabel = formatMouseLabel;
const formatCustomShortcutOption = (label) => `Custom - ${label}`;
exports.formatCustomShortcutOption = formatCustomShortcutOption;
/** Chromium: 0 left, 1 middle, 2 right, 3 back, 4 forward. */
const mouseButtonFromDomButton = (button) => {
    if (button === 3)
        return 4;
    if (button === 4)
        return 5;
    return null;
};
exports.mouseButtonFromDomButton = mouseButtonFromDomButton;
/** Electron app-command for XButtons when Chromium maps them to history. */
const mouseButtonFromAppCommand = (command) => {
    if (command === "browser-backward")
        return 4;
    if (command === "browser-forward")
        return 5;
    return null;
};
exports.mouseButtonFromAppCommand = mouseButtonFromAppCommand;
function captureMouseToken(token) {
    if (token === "MOUSE4_DOWN")
        return { button: 4, down: true };
    if (token === "MOUSE4_UP")
        return { button: 4, down: false };
    if (token === "MOUSE5_DOWN")
        return { button: 5, down: true };
    if (token === "MOUSE5_UP")
        return { button: 5, down: false };
    return null;
}
const parseCaptureMouseLine = (line) => {
    const [token, bits] = line.split(" ");
    const parsed = captureMouseToken(token);
    if (!parsed)
        return null;
    if (!bits || bits.length < 4)
        return parsed;
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
exports.parseCaptureMouseLine = parseCaptureMouseLine;
/** Only side buttons are captured. preventDefault on left/right/middle
 * leaves Chromium mouse capture stuck, so other apps stop receiving clicks. */
const shouldInterceptMouseCapture = (button) => (0, exports.mouseButtonFromDomButton)(button) !== null;
exports.shouldInterceptMouseCapture = shouldInterceptMouseCapture;
const normalizeMouseButton = (value) => {
    if (value === 4 || value === 5)
        return value;
    return undefined;
};
exports.normalizeMouseButton = normalizeMouseButton;
const mouseButtonCaptureError = (button) => {
    const numeric = typeof button === "number"
        ? button
        : typeof button === "string"
            ? Number(button)
            : Number.NaN;
    if (DISALLOWED_MOUSE_BUTTONS.has(numeric)) {
        return "Use a side mouse button (Mouse 4 or Mouse 5), not the main buttons.";
    }
    if (!Number.isFinite(numeric) || !exports.ALLOWED_MOUSE_BUTTONS.has(numeric)) {
        return "Unsupported mouse button. Use Mouse 4 or Mouse 5.";
    }
    return null;
};
exports.mouseButtonCaptureError = mouseButtonCaptureError;
//# sourceMappingURL=hotkey-mouse.js.map
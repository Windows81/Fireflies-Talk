"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifiersFromCaptureFlags = modifiersFromCaptureFlags;
exports.isCaptureFullyReleased = isCaptureFullyReleased;
/** Win is swallowed during recording, so Chromium may not set metaKey. */
function modifiersFromCaptureFlags(flags, captureWinHeld) {
    const modifiers = [];
    if (flags.ctrlKey)
        modifiers.push("ctrl");
    if (flags.altKey)
        modifiers.push("alt");
    if (flags.shiftKey)
        modifiers.push("shift");
    if (flags.metaKey || captureWinHeld)
        modifiers.push("meta");
    return modifiers;
}
function isCaptureFullyReleased(flags, captureWinHeld, fnHeld = false) {
    return (!flags.ctrlKey &&
        !flags.altKey &&
        !flags.shiftKey &&
        !flags.metaKey &&
        !captureWinHeld &&
        !fnHeld);
}
//# sourceMappingURL=shortcut-capture-modifiers.js.map
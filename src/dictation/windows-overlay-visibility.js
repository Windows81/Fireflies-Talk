"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRescueWindowsOverlay = shouldRescueWindowsOverlay;
exports.shouldFlipParentToClearOwner = shouldFlipParentToClearOwner;
exports.isDetachFlipCandidate = isDetachFlipCandidate;
/**
 * Windows hides owned always-on-top windows when the owner is hidden or
 * minimized. Electron then reports the overlay as not visible / not topmost,
 * even though we still mean it to stay on screen (tray / other apps).
 *
 * It can also leave the overlay's topmost style intact while stacking it
 * below ordinary windows, which Electron cannot see; `demoted` is the addon's
 * reading of the real Z order.
 */
function shouldRescueWindowsOverlay(input) {
    if (input.platform !== "win32")
        return false;
    if (!input.intendedVisible)
        return false;
    return !input.windowVisible || !input.alwaysOnTop || input.demoted;
}
/**
 * Electron skips `setParentWindow(null)` when it already thinks there is no
 * parent, so Chromium's implicit owner stays. Flip through another window
 * first so the native clear actually runs.
 */
function shouldFlipParentToClearOwner(input) {
    return input.platform === "win32" && input.hasOtherWindow;
}
function isDetachFlipCandidate(input) {
    return !input.isSelf && !input.isDestroyed && !input.isOwnedByTarget;
}
//# sourceMappingURL=windows-overlay-visibility.js.map
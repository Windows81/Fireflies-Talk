"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDictationMode = resolveDictationMode;
exports.shouldUpgradeToCommandMode = shouldUpgradeToCommandMode;
exports.nextDictationModeForState = nextDictationModeForState;
exports.shouldShowCommandChrome = shouldShowCommandChrome;
exports.canBeginDictation = canBeginDictation;
/** Bare hotkey = dictate. Extra Shift (when it is not part of the chord) = command. */
function resolveDictationMode(shiftHeld, bindingRequiresShift, overlayEnabled = true, forceDictate = false) {
    if (forceDictate || !overlayEnabled)
        return "dictate";
    return !bindingRequiresShift && shiftHeld ? "command" : "dictate";
}
/**
 * Shift often arrives a few milliseconds after the hotkey down — on Windows
 * Ctrl+Win completes first, then Shift; on macOS Globe/Fn does the same.
 * If a push-to-talk recording has already started as dictate, a later Shift
 * should still switch to command mode while the hotkey is held. Hands-free
 * (latched) sessions and the pending double-tap window stay on the mode
 * chosen at start.
 */
function shouldUpgradeToCommandMode(params) {
    return ((params.overlayEnabled ?? true) &&
        params.recording &&
        params.shiftDown &&
        params.hotkeyHeld &&
        !params.bindingRequiresShift &&
        !params.latched);
}
/** Idle is not a session, so leftover command mode must not stick for hover. */
function nextDictationModeForState(state, currentMode) {
    switch (state) {
        case "idle":
            return "dictate";
        case "recording":
        case "processing":
            return currentMode;
        default: {
            const _exhaustive = state;
            return _exhaustive;
        }
    }
}
/** Purple ring belongs on the main capsule while a command session is active. */
function shouldShowCommandChrome(mode, state) {
    return mode === "command" && state !== "idle";
}
/** A new session must not start until the last one has finished pasting. */
function canBeginDictation(state, sessionBusy = false) {
    return state !== "processing" && !sessionBusy;
}
//# sourceMappingURL=dictation-mode.js.map
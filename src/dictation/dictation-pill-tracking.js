"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dictationPillWorkArea = dictationPillWorkArea;
exports.resolveDictationPillDisplay = resolveDictationPillDisplay;
exports.dictationPillNeedsMove = dictationPillNeedsMove;
exports.recordDictationPillPlacement = recordDictationPillPlacement;
exports.startDictationPillTracking = startDictationPillTracking;
exports.stopDictationPillTracking = stopDictationPillTracking;
const electron_1 = require("electron");
const dictation_pill_dock_strip_1 = require("./dictation-pill-dock-strip");
const dictation_pill_dock_watcher_1 = require("./dictation-pill-dock-watcher");
const dictation_pill_screen_1 = require("./dictation-pill-screen");
const dictation_pill_settled_1 = require("./dictation-pill-settled");
/**
 * The live inputs the pill's placement depends on while it is shown: where the
 * macOS Dock is right now and the frame the OS last applied. Reset whenever
 * the pill is hidden.
 */
let dockStrip = null;
let placement = null;
let stopWatchingDisplays = null;
let stopWatchingDock = null;
// The pill's work area tracks where the Dock actually is right now, which the
// OS work area does not while an auto-hidden Dock is shown or in fullscreen.
function dictationPillWorkArea(display) {
    return (0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, dockStrip);
}
// The pill always sits on the display the cursor is on.
function resolveDictationPillDisplay() {
    return electron_1.screen.getDisplayNearestPoint(electron_1.screen.getCursorScreenPoint());
}
function dictationPillNeedsMove(current, next) {
    return (0, dictation_pill_settled_1.pillNeedsMove)(current, next, placement);
}
function recordDictationPillPlacement(requested, applied) {
    placement = { requested, applied };
}
/**
 * Re-places the pill as soon as a display or the Dock changes, instead of
 * waiting for the next reposition tick. Idempotent while tracking is active.
 */
function startDictationPillTracking(onDisplaysChanged, onDockChanged) {
    stopWatchingDisplays ?? (stopWatchingDisplays = (0, dictation_pill_screen_1.watchDictationPillDisplays)(onDisplaysChanged));
    stopWatchingDock ?? (stopWatchingDock = (0, dictation_pill_dock_watcher_1.watchDockStrip)((strip) => {
        dockStrip = strip;
        onDockChanged();
    }));
}
function stopDictationPillTracking() {
    stopWatchingDisplays?.();
    stopWatchingDisplays = null;
    stopWatchingDock?.();
    stopWatchingDock = null;
    placement = null;
}
//# sourceMappingURL=dictation-pill-tracking.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DICTATION_PILL_MAC_WINDOW_LEVEL = void 0;
exports.raiseDictationPillAboveDock = raiseDictationPillAboveDock;
exports.watchDictationPillDisplays = watchDictationPillDisplays;
const electron_1 = require("electron");
/**
 * `alwaysOnTop` alone puts a window at the floating level, and the macOS Dock
 * sits above that: an auto-hidden Dock sliding out covers a pill resting along
 * the bottom edge until the pill has moved out of its way. "status" is the
 * level of menu-bar extras — above the Dock, below pop-up menus and the
 * screen saver — so the pill stays visible during that hand-off.
 */
exports.DICTATION_PILL_MAC_WINDOW_LEVEL = "status";
function raiseDictationPillAboveDock(win) {
    if (process.platform !== "darwin")
        return;
    win.setAlwaysOnTop(true, exports.DICTATION_PILL_MAC_WINDOW_LEVEL);
}
/**
 * Re-places the pill the moment the Dock or taskbar shows, hides or changes
 * side, a display is plugged in or removed, or its resolution changes, rather
 * than waiting for the next reposition tick.
 */
function watchDictationPillDisplays(onChange) {
    electron_1.screen.on("display-metrics-changed", onChange);
    electron_1.screen.on("display-added", onChange);
    electron_1.screen.on("display-removed", onChange);
    return () => {
        electron_1.screen.off("display-metrics-changed", onChange);
        electron_1.screen.off("display-added", onChange);
        electron_1.screen.off("display-removed", onChange);
    };
}
//# sourceMappingURL=dictation-pill-screen.js.map
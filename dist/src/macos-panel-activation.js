"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepMacPanelFromActivating = keepMacPanelFromActivating;
const macos_panel_native_1 = require("./macos-panel-native");
/**
 * Keeps clicks on a non-focusable floating panel (the Talk pill, its cards,
 * the action orbs) from activating Fireflies. On macOS 27 such a click made
 * Fireflies the active app and brought the main window over whatever the user
 * was dictating into. The macOS counterpart of `keepWindowsOverlayClickable`.
 * No-op on other platforms.
 */
function keepMacPanelFromActivating(win) {
    if (process.platform !== "darwin" || win.isDestroyed())
        return;
    (0, macos_panel_native_1.loadPanelNative)()?.preventActivation(win.getNativeWindowHandle());
}
//# sourceMappingURL=macos-panel-activation.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepWindowOnActiveSpace = keepWindowOnActiveSpace;
const macos_panel_native_1 = require("./macos-panel-native");
/**
 * Keeps floating macOS windows (dictation pill, cards, notifications, live
 * compact bar...) on the Space the user is looking at.
 *
 * Electron forces every `type: "panel"` window to join all Spaces. A window
 * that is present on every Space is a candidate for "topmost window" while
 * macOS switches Spaces, so Fireflies became the active app on Spaces where the
 * user was working in another app, and could later pull them back to the Space
 * holding the main window. Following the active Space instead makes the window
 * belong to one Space at a time: macOS finishes the switch and picks the active
 * app first, then the window is re-ordered onto the new Space.
 */
const followingWindows = new Set();
// Windows can be destroyed without firing `closed` (callers may
// `removeAllListeners()` first), so destroyed entries are pruned whenever the
// set is visited and the observer is stopped once nothing is tracked.
function pruneDestroyedWindows() {
    for (const win of followingWindows) {
        if (win.isDestroyed())
            followingWindows.delete(win);
    }
    if (followingWindows.size === 0)
        (0, macos_panel_native_1.loadPanelNative)()?.stopActiveSpaceObserver();
}
function reorderOntoActiveSpace(spaces, win) {
    const handle = win.getNativeWindowHandle();
    if (!win.isVisible() || spaces.isOnActiveSpace(handle))
        return;
    spaces.followActiveSpace(handle);
    // Ordering the NSWindow out/in natively leaves Chromium believing the web
    // contents are hidden, so RAF and Reanimated animations in the pill stop.
    // Electron's hide/show path re-shows the window on the active Space while
    // keeping the web contents visible.
    win.hide();
    win.showInactive();
}
function moveFollowingWindowsToActiveSpace() {
    pruneDestroyedWindows();
    const spaces = (0, macos_panel_native_1.loadPanelNative)();
    if (!spaces)
        return;
    for (const win of followingWindows) {
        reorderOntoActiveSpace(spaces, win);
    }
}
function trackWindow(spaces, win) {
    pruneDestroyedWindows();
    if (followingWindows.size === 0) {
        spaces.startActiveSpaceObserver(moveFollowingWindowsToActiveSpace);
    }
    followingWindows.add(win);
    win.once("closed", () => {
        followingWindows.delete(win);
        pruneDestroyedWindows();
    });
}
/**
 * Makes a floating window visible on the active Space (including full-screen
 * Spaces) on macOS. Replaces `setVisibleOnAllWorkspaces(true)`, which is only
 * used as a fallback when the native addon is missing (e.g. a dev checkout
 * without `npm run build:macos-modules`). No-op on other platforms.
 */
function keepWindowOnActiveSpace(win) {
    if (process.platform !== "darwin" || win.isDestroyed())
        return;
    const spaces = (0, macos_panel_native_1.loadPanelNative)();
    if (!spaces) {
        win.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true,
            skipTransformProcessType: true,
        });
        return;
    }
    // Electron re-adds the all-Spaces flag whenever it touches the panel's
    // collection behavior, so the native call re-applies the follow behavior on
    // every invocation as well as on each Space change.
    if (!followingWindows.has(win))
        trackWindow(spaces, win);
    spaces.followActiveSpace(win.getNativeWindowHandle());
}
//# sourceMappingURL=macos-spaces.js.map
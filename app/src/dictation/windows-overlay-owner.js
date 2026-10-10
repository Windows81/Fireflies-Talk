"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adoptWindowsOverlay = adoptWindowsOverlay;
exports.raiseWindowsOverlay = raiseWindowsOverlay;
exports.rescueWindowsOverlayWindow = rescueWindowsOverlayWindow;
const electron_1 = require("electron");
const windows_overlay_activation_1 = require("./windows-overlay-activation");
const windows_overlay_visibility_1 = require("./windows-overlay-visibility");
const OWNER_BOUNDS = { x: -32000, y: -32000, width: 1, height: 1 };
const OVERLAY_LEVEL = "screen-saver";
let overlayOwner = null;
function getWindowsOverlayOwner() {
    if (overlayOwner && !overlayOwner.isDestroyed()) {
        return keepWindowsOverlayOwnerShown(overlayOwner);
    }
    overlayOwner = new electron_1.BrowserWindow({
        ...OWNER_BOUNDS,
        show: false,
        frame: false,
        skipTaskbar: true,
        transparent: true,
        focusable: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        hasShadow: false,
        backgroundColor: "#00000000",
    });
    overlayOwner.setFocusable(false);
    overlayOwner.setIgnoreMouseEvents(true);
    overlayOwner.setBounds(OWNER_BOUNDS);
    overlayOwner.on("closed", () => {
        overlayOwner = null;
    });
    // Once, on creation. Re-parenting the owner later drags every window it
    // owns along in the Z order — into the band of whichever window it is
    // flipped through — while they keep their topmost style, so Electron still
    // reports them as always on top and nothing puts them back.
    detachImplicitWindowsOwner(overlayOwner);
    return keepWindowsOverlayOwnerShown(overlayOwner);
}
function keepWindowsOverlayOwnerShown(owner) {
    if (!owner.isVisible()) {
        owner.showInactive();
    }
    return owner;
}
function detachImplicitWindowsOwner(win) {
    if (win.isDestroyed())
        return;
    const other = electron_1.BrowserWindow.getAllWindows().find((candidate) => (0, windows_overlay_visibility_1.isDetachFlipCandidate)({
        isSelf: candidate === win,
        isDestroyed: candidate.isDestroyed(),
        isOwnedByTarget: candidate.getParentWindow() === win,
    }));
    if (!other ||
        !(0, windows_overlay_visibility_1.shouldFlipParentToClearOwner)({
            platform: process.platform,
            hasOtherWindow: true,
        })) {
        return;
    }
    win.setParentWindow(other);
    win.setParentWindow(null);
}
/**
 * Chromium gives new Windows BrowserWindows the last focused HWND as owner
 * without Electron tracking it. Hiding the main app then hides the overlay.
 * Reparent onto a window that stays shown so the pill can outlive the app
 * window.
 */
function adoptWindowsOverlay(win) {
    if (process.platform !== "win32" || win.isDestroyed())
        return;
    const owner = getWindowsOverlayOwner();
    if (win === owner || owner.isDestroyed())
        return;
    if (win.getParentWindow() !== owner) {
        win.setParentWindow(owner);
    }
    raiseWindowsOverlay(win);
}
/**
 * Puts an overlay back at the top of the topmost band.
 *
 * Windows can leave a window with its topmost style intact but stacked below
 * ordinary windows — an owner chain being re-linked does it — and Electron,
 * which reads the style, then considers it already on top. Moving the window
 * to the top re-inserts it, and a window that carries the topmost style lands
 * at the top of the topmost band. The level is never dropped on the way: making
 * an owned window non-topmost demotes its owner and every sibling it owns too.
 */
function raiseWindowsOverlay(win) {
    if (process.platform !== "win32" || !win || win.isDestroyed())
        return;
    if (!win.isVisible())
        return;
    win.setAlwaysOnTop(true, OVERLAY_LEVEL);
    win.moveTop();
}
/**
 * Puts an overlay back if Windows hid it, took its topmost style, or stacked it
 * below ordinary windows behind that style. Cheap enough to run on the pill's
 * reposition tick: the Z-order walk stops at the first ordinary window or at
 * the overlay itself, whichever comes first.
 */
function rescueWindowsOverlayWindow(win, intendedVisible) {
    if (!win || win.isDestroyed())
        return;
    if (!(0, windows_overlay_visibility_1.shouldRescueWindowsOverlay)({
        platform: process.platform,
        intendedVisible,
        windowVisible: win.isVisible(),
        alwaysOnTop: win.isAlwaysOnTop(),
        demoted: intendedVisible && (0, windows_overlay_activation_1.isWindowsOverlayDemoted)(win),
    })) {
        return;
    }
    // Shown first: raising skips a hidden window, so a pill that Windows had
    // hidden would come back without its place in the topmost band.
    if (!win.isVisible()) {
        win.showInactive();
    }
    adoptWindowsOverlay(win);
}
//# sourceMappingURL=windows-overlay-owner.js.map
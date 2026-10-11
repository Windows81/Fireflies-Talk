"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldGuardWindowsOverlayActivation = shouldGuardWindowsOverlayActivation;
exports.keepWindowsOverlayClickable = keepWindowsOverlayClickable;
exports.isWindowsOverlayDemoted = isWindowsOverlayDemoted;
exports.hasWindowsOverlayNative = hasWindowsOverlayNative;
exports.readWindowsScreenLuminance = readWindowsScreenLuminance;
const electron_log_1 = __importDefault(require("electron-log"));
const secure_require_1 = require("../secure-require");
let overlayNative;
function shouldGuardWindowsOverlayActivation(input) {
    return input.platform === "win32" && !input.destroyed;
}
function getOverlayNative() {
    if (overlayNative !== undefined)
        return overlayNative;
    try {
        const addon = (0, secure_require_1.secureRequire)("native-overlay-windows");
        overlayNative = addon.isAvailable() ? addon : null;
        if (!overlayNative) {
            electron_log_1.default.warn("[OverlayNative] Windows addon unavailable; overlay clicks may stop after the main window activates");
        }
    }
    catch (error) {
        electron_log_1.default.warn("[OverlayNative] Failed to load Windows addon:", error);
        overlayNative = null;
    }
    return overlayNative;
}
/**
 * Keeps a non-focusable overlay clickable on Windows.
 *
 * Once another window of this process has been activated while the overlay was
 * on screen, Windows asks the overlay with WM_MOUSEACTIVATE on every press and
 * Chromium's reply for a non-focusable window eats the button-down, so the
 * renderer only ever sees pointerup. The addon answers MA_NOACTIVATE for this
 * HWND, which lets the press through without activating the overlay, so the
 * app being dictated into keeps focus. No-op off Windows or without the addon.
 */
function keepWindowsOverlayClickable(win) {
    if (!shouldGuardWindowsOverlayActivation({
        platform: process.platform,
        destroyed: win.isDestroyed(),
    })) {
        return;
    }
    const native = getOverlayNative();
    if (!native)
        return;
    const handle = win.getNativeWindowHandle();
    if (!native.attach(handle)) {
        electron_log_1.default.warn("[OverlayNative] Could not attach to overlay window");
        return;
    }
    win.once("closed", () => {
        native.detach(handle);
    });
}
/**
 * Whether an overlay has fallen out of the topmost band: a visible window
 * without the topmost style sits above it in the real Z order. Electron cannot
 * tell — it reads the window's own style, which such a window still carries —
 * so the addon walks the Z order. False off Windows or without the addon.
 */
function isWindowsOverlayDemoted(win) {
    if (!shouldGuardWindowsOverlayActivation({
        platform: process.platform,
        destroyed: win.isDestroyed(),
    })) {
        return false;
    }
    const native = getOverlayNative();
    if (!native)
        return false;
    return native.isBelowOrdinaryWindow(win.getNativeWindowHandle());
}
/** Whether the addon is loaded, so a screen read is worth attempting at all. */
function hasWindowsOverlayNative() {
    return process.platform === "win32" && getOverlayNative() !== null;
}
/**
 * Mean brightness (0..1) of a screen region given in physical pixels, read
 * with one small blit off the screen DC — cheap enough to poll. Null off
 * Windows, without the addon, or when the region cannot be read.
 */
function readWindowsScreenLuminance(rect) {
    if (process.platform !== "win32")
        return null;
    const native = getOverlayNative();
    if (!native)
        return null;
    return native.sampleScreenLuminance(rect.x, rect.y, rect.width, rect.height);
}
//# sourceMappingURL=windows-overlay-activation.js.map
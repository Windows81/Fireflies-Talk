"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyListenerLine = applyListenerLine;
exports.getWindowsPasteTargetHwnd = getWindowsPasteTargetHwnd;
exports.clearWindowsPasteTargetHwnd = clearWindowsPasteTargetHwnd;
const electron_1 = require("electron");
const capture_mouse_broadcast_1 = require("./capture-mouse-broadcast");
const hotkey_mouse_1 = require("./hotkey-mouse");
let lastForegroundHwnd;
function broadcastCaptureWin(down) {
    for (const win of electron_1.BrowserWindow.getAllWindows()) {
        if (win.isDestroyed())
            continue;
        win.webContents.send("dictation:capture-win", down);
    }
}
function isFirefliesHwnd(hwnd) {
    return electron_1.BrowserWindow.getAllWindows().some((win) => {
        if (win.isDestroyed())
            return false;
        try {
            const handle = win.getNativeWindowHandle();
            const value = handle.length >= 8
                ? handle.readBigUInt64LE(0).toString()
                : handle.readUInt32LE(0).toString();
            return value === hwnd;
        }
        catch {
            return false;
        }
    });
}
/** Routes one stdout line from the helper to the dictation callbacks. */
function applyListenerLine(trimmed, callbacks) {
    switch (trimmed) {
        case "READY":
            return "ready";
        case "PING":
            return "heartbeat";
        case "KEY_DOWN":
            callbacks?.onDown();
            return "event";
        case "KEY_UP":
            callbacks?.onUp();
            return "event";
        case "ACTION_DOWN":
            callbacks?.onActionDown?.();
            return "event";
        case "ACTION_UP":
            callbacks?.onActionUp?.();
            return "event";
        case "HANDSFREE_DOWN":
            callbacks?.onHandsFreeDown?.();
            return "event";
        case "HANDSFREE_UP":
            return "event";
        case "SHIFT_DOWN":
            callbacks?.onShiftChange(true);
            return "event";
        case "SHIFT_UP":
            callbacks?.onShiftChange(false);
            return "event";
        case "KEY_INTERRUPTED":
            callbacks?.onInterrupted();
            return "event";
        case "WIN_DOWN":
            callbacks?.onCaptureWin?.(true);
            broadcastCaptureWin(true);
            return "event";
        case "WIN_UP":
            callbacks?.onCaptureWin?.(false);
            broadcastCaptureWin(false);
            return "event";
        default:
            break;
    }
    const mouse = (0, hotkey_mouse_1.parseCaptureMouseLine)(trimmed);
    if (mouse) {
        (0, capture_mouse_broadcast_1.broadcastCaptureMouse)(mouse.button, mouse.down, mouse.flags);
        return "event";
    }
    if (!trimmed.startsWith("FOREGROUND "))
        return "unknown";
    const hwnd = trimmed.slice("FOREGROUND ".length);
    if (hwnd && !isFirefliesHwnd(hwnd))
        lastForegroundHwnd = hwnd;
    return "event";
}
/** HWND of the last non-Fireflies app that was focused. */
function getWindowsPasteTargetHwnd() {
    return lastForegroundHwnd;
}
function clearWindowsPasteTargetHwnd() {
    lastForegroundHwnd = undefined;
}
//# sourceMappingURL=windows-listener-lines.js.map
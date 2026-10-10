"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDictationLifecycleRecovery = setupDictationLifecycleRecovery;
const electron_1 = require("electron");
const windowing_1 = require("../windowing");
const dictation_shortcut_1 = require("./dictation-shortcut");
const armed = new WeakSet();
function isMainWindowContents(contents) {
    return (windowing_1.mainWindow != null &&
        !windowing_1.mainWindow.isDestroyed() &&
        electron_1.BrowserWindow.fromWebContents(contents) === windowing_1.mainWindow);
}
/**
 * A reload or crash of the main renderer discards any dictation it was
 * processing, so the main process must not keep waiting for it.
 */
function watchRendererLifecycle(contents) {
    if (armed.has(contents))
        return;
    armed.add(contents);
    contents.on("did-finish-load", () => {
        if (isMainWindowContents(contents)) {
            (0, dictation_shortcut_1.recoverDictationHotkey)("renderer load", "renderer");
        }
    });
    contents.on("render-process-gone", () => {
        if (isMainWindowContents(contents)) {
            (0, dictation_shortcut_1.recoverDictationHotkey)("renderer gone", "renderer");
        }
    });
}
/**
 * Keeps the dictation hotkey armed across the events that can silently
 * strand it: the main renderer reloading or crashing mid-session, and the
 * machine waking or unlocking.
 */
function setupDictationLifecycleRecovery() {
    if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
        watchRendererLifecycle(windowing_1.mainWindow.webContents);
    }
    electron_1.app.on("web-contents-created", (_event, contents) => {
        watchRendererLifecycle(contents);
    });
    electron_1.powerMonitor.on("resume", () => {
        (0, dictation_shortcut_1.recoverDictationHotkey)("resume", "system");
    });
    electron_1.powerMonitor.on("unlock-screen", () => {
        (0, dictation_shortcut_1.recoverDictationHotkey)("unlock", "system");
    });
}
//# sourceMappingURL=dictation-lifecycle-recovery.js.map
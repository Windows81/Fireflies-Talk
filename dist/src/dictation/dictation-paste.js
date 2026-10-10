"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopWindowsPasteHelper = exports.prewarmWindowsPasteHelper = exports.stopMacosPasteHelper = exports.prewarmMacosPasteHelper = void 0;
exports.pasteIntoFrontmostApp = pasteIntoFrontmostApp;
exports.recheckPasteTarget = recheckPasteTarget;
exports.getManualPasteHint = getManualPasteHint;
exports.prewarmDictationPasteHelper = prewarmDictationPasteHelper;
exports.stopDictationPasteHelper = stopDictationPasteHelper;
const electron_log_1 = __importDefault(require("electron-log"));
const macos_paste_helper_1 = require("./macos-paste-helper");
Object.defineProperty(exports, "prewarmMacosPasteHelper", { enumerable: true, get: function () { return macos_paste_helper_1.prewarmMacosPasteHelper; } });
Object.defineProperty(exports, "stopMacosPasteHelper", { enumerable: true, get: function () { return macos_paste_helper_1.stopMacosPasteHelper; } });
const windows_paste_helper_1 = require("./windows-paste-helper");
Object.defineProperty(exports, "prewarmWindowsPasteHelper", { enumerable: true, get: function () { return windows_paste_helper_1.prewarmWindowsPasteHelper; } });
Object.defineProperty(exports, "stopWindowsPasteHelper", { enumerable: true, get: function () { return windows_paste_helper_1.stopWindowsPasteHelper; } });
const dictation_clipboard_html_1 = require("./dictation-clipboard-html");
const dictation_focus_1 = require("./dictation-focus");
const windows_key_listener_1 = require("./windows-key-listener");
/**
 * Synthesizes paste into the frontmost app (Cmd+V on macOS, Ctrl+V on Windows).
 * Resolves with the native helper's verdict on whether the focused element
 * could take the text.
 */
async function pasteIntoFrontmostApp() {
    if (process.platform === "win32") {
        const hwnd = (0, windows_key_listener_1.getWindowsPasteTargetHwnd)();
        try {
            return await (0, windows_paste_helper_1.pasteViaWindowsHelper)(hwnd);
        }
        catch (nativeError) {
            // A rejected paste posted nothing (a timeout after posting resolves as
            // unknown instead), so one retry on a fresh helper cannot paste twice.
            electron_log_1.default.warn("[Dictation] windows-fast-paste failed, retrying on a fresh helper:", nativeError);
            (0, windows_paste_helper_1.stopWindowsPasteHelper)();
            return (0, windows_paste_helper_1.pasteViaWindowsHelper)(hwnd);
        }
    }
    const firefliesHadKeys = (0, dictation_focus_1.resignFirefliesKeyWindow)();
    try {
        return await (0, macos_paste_helper_1.pasteViaMacosHelper)(!firefliesHadKeys);
    }
    catch (fastPasteError) {
        electron_log_1.default.warn("[Dictation] Warm CGEvent paste failed:", fastPasteError);
        // Helper may be wedged — tear it down so the next paste respawns clean.
        (0, macos_paste_helper_1.stopMacosPasteHelper)();
        throw fastPasteError;
    }
}
/**
 * Re-reads where focus rests now that the target app has handled the paste.
 * Null when the helper cannot answer, so the caller keeps its first verdict.
 */
async function recheckPasteTarget() {
    try {
        if (process.platform === "win32") {
            return await (0, windows_paste_helper_1.probeWindowsPasteTarget)((0, windows_key_listener_1.getWindowsPasteTargetHwnd)());
        }
        return await (0, macos_paste_helper_1.probeMacosPasteTarget)();
    }
    catch (error) {
        electron_log_1.default.warn("[Dictation] Paste-target recheck failed:", error);
        return null;
    }
}
function getManualPasteHint() {
    return process.platform === "win32"
        ? "Text is copied to clipboard — paste manually with Ctrl+V."
        : "Text is copied to clipboard — paste manually with Cmd+V.";
}
/**
 * Warms the platform's paste helper and the clipboard formatter, so the first
 * paste costs no more than the rest. Called when dictation is enabled (a
 * signed-in user with Fireflies Talk), never at app boot, so a user without
 * Talk access spawns no dictation helper at all.
 */
function prewarmDictationPasteHelper() {
    (0, dictation_clipboard_html_1.prewarmClipboardHtml)();
    if (process.platform === "darwin")
        (0, macos_paste_helper_1.prewarmMacosPasteHelper)();
    else if (process.platform === "win32")
        (0, windows_paste_helper_1.prewarmWindowsPasteHelper)();
}
/** Tears the platform's paste helper down when dictation is disabled. */
function stopDictationPasteHelper() {
    if (process.platform === "darwin")
        (0, macos_paste_helper_1.stopMacosPasteHelper)();
    else if (process.platform === "win32")
        (0, windows_paste_helper_1.stopWindowsPasteHelper)();
}
//# sourceMappingURL=dictation-paste.js.map
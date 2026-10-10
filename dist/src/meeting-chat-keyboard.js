"use strict";
/**
 * Meeting chat keyboard automation for macOS.
 *
 * Uses native CGEvent keyboard simulation to open/close chat panels in Zoom and
 * Google Meet, paste the consent message via clipboard, and press Enter to send.
 *
 * Replaces the fragile AppleScript-based approach (meeting-chat-injector.ts,
 * meeting-chat-zoom-native.ts) with stable OS-level keyboard shortcuts.
 *
 * Requirements:
 * - macOS Accessibility permission (CGEventPostToPid)
 * - Target app must be running and in a meeting
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BROWSER_PROCESS_NAMES = void 0;
exports.isKeyboardModuleAvailable = isKeyboardModuleAvailable;
exports.hasAccessibilityPermission = hasAccessibilityPermission;
exports.sendZoomNativeChatViaKeyboard = sendZoomNativeChatViaKeyboard;
exports.sendGoogleMeetChatViaKeyboard = sendGoogleMeetChatViaKeyboard;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const types_1 = require("./types");
const cloud_log_buffer_1 = require("./cloud-log-buffer");
// Modifier flags bitmask matching the native module's convention
const MOD_CMD = 1;
const MOD_SHIFT = 2;
const MOD_CTRL = 4;
// Virtual keycodes (Carbon Events)
const kVK_ANSI_H = 0x04;
const kVK_ANSI_C = 0x08;
const kVK_Escape = 0x35;
// Delay helpers
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
/** Chat panel open delay — time for the panel UI to render after shortcut. */
const CHAT_OPEN_DELAY_MS = 1500;
/** Post-paste delay — time for the paste to register before pressing Enter. */
const POST_PASTE_DELAY_MS = 300;
/** Post-send delay — time after pressing Enter before closing the panel. */
const POST_SEND_DELAY_MS = 500;
let nativeModule = null;
let loadAttempted = false;
/** Serializes keyboard workflows so two calls never interleave clipboard/focus. */
let keyboardQueue = Promise.resolve({
    success: false,
    error: "initial",
});
const MODULE_NAME = "native-keyboard-macos";
function loadNativeModule() {
    let expectedDir;
    if (electron_1.app.isPackaged) {
        expectedDir = path_1.default.join(process.resourcesPath, MODULE_NAME);
    }
    else {
        expectedDir = path_1.default.join(__dirname, `../../${MODULE_NAME}`);
    }
    const fullPath = path_1.default.join(expectedDir, "index.js");
    const normalizedPath = path_1.default.resolve(fullPath);
    const normalizedDir = path_1.default.resolve(expectedDir);
    if (!normalizedPath.startsWith(normalizedDir + path_1.default.sep)) {
        electron_log_1.default.warn("[ChatKeyboard] Module path traversal blocked", {
            normalizedPath,
            normalizedDir,
        });
        return null;
    }
    if (!fs_1.default.existsSync(normalizedPath)) {
        electron_log_1.default.warn("[ChatKeyboard] Native module not found", { normalizedPath });
        return null;
    }
    return require(normalizedPath);
}
function getNative() {
    if (nativeModule)
        return nativeModule;
    if (loadAttempted)
        return null;
    loadAttempted = true;
    try {
        const loaded = loadNativeModule();
        if (!loaded?.isAvailable) {
            electron_log_1.default.warn("[ChatKeyboard] Native module loaded but not available");
            return null;
        }
        electron_log_1.default.info("[ChatKeyboard] Native module loaded successfully");
        nativeModule = loaded;
        return nativeModule;
    }
    catch (err) {
        electron_log_1.default.error("[ChatKeyboard] Failed to load native module", {
            error: String(err),
        });
        return null;
    }
}
function isKeyboardModuleAvailable() {
    return getNative()?.isAvailable ?? false;
}
function hasAccessibilityPermission() {
    return getNative()?.checkAccessibilityPermission() ?? false;
}
/**
 * Shared workflow: activate app → open chat via shortcut → paste → Enter → close.
 * Both Zoom and Meet use this with different key combos and process names.
 */
async function sendChatViaShortcut(cfg) {
    const { processName, message, toggleKeyCode, toggleFlags, label } = cfg;
    electron_log_1.default.info(`[ChatKeyboard] ${label}: starting`, {
        processName,
        messageLength: message.length,
    });
    const native = getNative();
    if (!native) {
        (0, cloud_log_buffer_1.cloudLog)("warn", "ChatKeyboard", `${label}: native module not available`);
        return { success: false, error: "Keyboard native module not available" };
    }
    if (!native.checkAccessibilityPermission()) {
        (0, cloud_log_buffer_1.cloudLog)("warn", "ChatKeyboard", `${label}: accessibility permission not granted`);
        return { success: false, error: "Accessibility permission not granted" };
    }
    if (!native.isProcessRunning(processName)) {
        (0, cloud_log_buffer_1.cloudLog)("warn", "ChatKeyboard", `${label}: process not running`, {
            processName,
        });
        return {
            success: false,
            error: `"${processName}" is not running`,
        };
    }
    const closeChat = () => native.sendKeyCombo(processName, toggleKeyCode, toggleFlags);
    const restoreAndClose = (prev) => {
        if (prev !== null)
            native.setClipboardText(prev);
        closeChat();
    };
    try {
        // Hide Fireflies windows so alwaysOnTop panels don't block activation.
        (0, cloud_log_buffer_1.cloudLog)("info", "ChatKeyboard", `${label}: hiding Fireflies, activating target`, { processName });
        native.hideCurrentApp();
        await delay(500);
        // Attempt activation up to 3 times — [NSApp hide:] is async and macOS
        // may not have fully deactivated Electron yet on the first try.
        let activated = false;
        for (let attempt = 1; attempt <= 3 && !activated; attempt++) {
            activated = native.activateApp(processName);
            (0, cloud_log_buffer_1.cloudLog)("info", "ChatKeyboard", `${label}: activateApp attempt ${attempt} → ${activated}`, { processName });
            if (!activated)
                await delay(300);
        }
        if (!activated) {
            (0, cloud_log_buffer_1.cloudLog)("warn", "ChatKeyboard", `${label}: activateApp failed after 3 attempts`, { processName });
            return { success: false, error: "Failed to activate target app" };
        }
        // Fixed settling delay — frontmostApplication can lag behind the
        // visible state after hide+activate, so polling isAppFrontmost is
        // unreliable here. 1 s is enough for macOS to finish the transition.
        await delay(1000);
        // Close any already-open panel so the toggle shortcut reliably opens chat.
        electron_log_1.default.info(`[ChatKeyboard] ${label}: sending Escape to reset panel state`);
        native.sendKeyCombo(processName, kVK_Escape, 0);
        await delay(300);
        electron_log_1.default.info(`[ChatKeyboard] ${label}: sending chat-open shortcut`);
        if (!native.sendKeyCombo(processName, toggleKeyCode, toggleFlags)) {
            (0, cloud_log_buffer_1.cloudLog)("error", "ChatKeyboard", `${label}: sendKeyCombo failed for chat open`);
            return { success: false, error: "Failed to send chat open shortcut" };
        }
        electron_log_1.default.info(`[ChatKeyboard] ${label}: waiting for chat panel`, {
            delayMs: CHAT_OPEN_DELAY_MS,
        });
        await delay(CHAT_OPEN_DELAY_MS);
        // Re-establish focus: alwaysOnTop windows (e.g. Live View full mode)
        // may have appeared during the chat open delay, stealing keyboard
        // focus from the target app.
        electron_log_1.default.info(`[ChatKeyboard] ${label}: re-hiding and re-activating before paste`);
        native.hideCurrentApp();
        await delay(300);
        const reactivated = native.activateApp(processName);
        if (!reactivated) {
            (0, cloud_log_buffer_1.cloudLog)("warn", "ChatKeyboard", `${label}: re-activation failed — paste may not reach chat input`, { processName });
        }
        await delay(500);
        const previousClipboard = native.getClipboardText();
        electron_log_1.default.info(`[ChatKeyboard] ${label}: setting clipboard`, {
            hadPreviousClipboard: previousClipboard !== null,
        });
        if (!native.setClipboardText(message)) {
            (0, cloud_log_buffer_1.cloudLog)("error", "ChatKeyboard", `${label}: setClipboardText failed`);
            restoreAndClose(previousClipboard);
            return { success: false, error: "Failed to set clipboard" };
        }
        await delay(100);
        electron_log_1.default.info(`[ChatKeyboard] ${label}: pasting message`);
        if (!native.pasteInApp(processName)) {
            (0, cloud_log_buffer_1.cloudLog)("error", "ChatKeyboard", `${label}: pasteInApp failed`);
            restoreAndClose(previousClipboard);
            return { success: false, error: "Failed to paste message" };
        }
        await delay(POST_PASTE_DELAY_MS);
        electron_log_1.default.info(`[ChatKeyboard] ${label}: pressing Enter to send`);
        if (!native.sendReturn(processName)) {
            (0, cloud_log_buffer_1.cloudLog)("error", "ChatKeyboard", `${label}: sendReturn failed`);
            restoreAndClose(previousClipboard);
            return { success: false, error: "Failed to send message (Enter key)" };
        }
        await delay(POST_SEND_DELAY_MS);
        if (previousClipboard !== null)
            native.setClipboardText(previousClipboard);
        electron_log_1.default.info(`[ChatKeyboard] ${label}: closing chat panel`);
        closeChat();
        (0, cloud_log_buffer_1.cloudLog)("info", "ChatKeyboard", `${label}: consent message sent successfully`);
        return { success: true };
    }
    finally {
        // Always restore Fireflies windows, even on failure.
        electron_log_1.default.info(`[ChatKeyboard] ${label}: restoring Fireflies windows`);
        native.showCurrentApp();
    }
}
/** Send consent message to Zoom via Cmd+Shift+H shortcut. */
function sendZoomNativeChatViaKeyboard(message) {
    const run = () => sendChatViaShortcut({
        // Matched by bundle ID: Zoom 7 renamed the app from "zoom.us" to "Zoom",
        // which broke the name lookup. The bundle ID is the same in 6 and 7.
        processName: "us.zoom.xos",
        message,
        toggleKeyCode: kVK_ANSI_H,
        toggleFlags: MOD_CMD | MOD_SHIFT,
        label: "Zoom",
    });
    keyboardQueue = keyboardQueue.then(run, run);
    return keyboardQueue;
}
/** Send consent message to Google Meet via Ctrl+Cmd+C shortcut. */
function sendGoogleMeetChatViaKeyboard(browserProcessName, message) {
    const run = () => sendChatViaShortcut({
        processName: browserProcessName,
        message,
        toggleKeyCode: kVK_ANSI_C,
        toggleFlags: MOD_CMD | MOD_CTRL,
        label: "Meet",
    });
    keyboardQueue = keyboardQueue.then(run, run);
    return keyboardQueue;
}
/**
 * Inverse of MACOS_PROCESS_TO_BROWSER: maps BrowserName → macOS process name.
 * Derived from the single source of truth to avoid maintaining two maps.
 */
exports.BROWSER_PROCESS_NAMES = Object.fromEntries(Object.entries(types_1.MACOS_PROCESS_TO_BROWSER).map(([proc, browser]) => [
    browser,
    proc,
]));
//# sourceMappingURL=meeting-chat-keyboard.js.map
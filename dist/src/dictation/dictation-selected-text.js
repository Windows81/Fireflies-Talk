"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSelectedText = readSelectedText;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_dev_log_1 = require("./dictation-dev-log");
const dictation_clipboard_1 = require("./dictation-clipboard");
const dictation_focus_1 = require("./dictation-focus");
const macos_paste_helper_1 = require("./macos-paste-helper");
const windows_paste_helper_1 = require("./windows-paste-helper");
const COPY_SETTLE_MS = 150;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function readSelectedText() {
    const prior = (0, dictation_clipboard_1.snapshotClipboardRich)();
    electron_1.clipboard.clear();
    (0, dictation_focus_1.resignFirefliesKeyWindow)();
    // Let macOS hand focus back to the previously frontmost app before
    // dispatching the synthetic Cmd+C via System Events.
    if (process.platform === "darwin")
        await delay(80);
    try {
        if (process.platform === "darwin")
            await (0, macos_paste_helper_1.copyViaMacosHelper)();
        else
            await (0, windows_paste_helper_1.copyViaWindowsHelper)();
    }
    catch (error) {
        electron_log_1.default.warn(`[Dictation] Failed to simulate copy: ${error}`);
        (0, dictation_clipboard_1.restoreClipboardRich)(prior);
        return null;
    }
    await delay(COPY_SETTLE_MS);
    const selectedText = electron_1.clipboard.readText().trim();
    (0, dictation_clipboard_1.restoreClipboardRich)(prior);
    if (!selectedText)
        return null;
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Read selected text (${selectedText.length} chars)`);
    return selectedText;
}
//# sourceMappingURL=dictation-selected-text.js.map
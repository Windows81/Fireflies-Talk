"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSelectedTextForPolish = readSelectedTextForPolish;
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_dev_log_1 = require("./dictation-dev-log");
const dictation_selected_text_1 = require("./dictation-selected-text");
const macos_paste_helper_1 = require("./macos-paste-helper");
async function readSelectedTextForPolish() {
    try {
        const selectedText = await (0, dictation_selected_text_1.readSelectedText)();
        if (!selectedText)
            return null;
        (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Selected text detected (${selectedText.length} chars) — polishing`);
        (0, macos_paste_helper_1.snapshotMacosPasteTarget)();
        return selectedText;
    }
    catch (error) {
        electron_log_1.default.warn(`[Dictation] Failed to read selected text: ${error}`);
        return null;
    }
}
//# sourceMappingURL=dictation-polish-read.js.map
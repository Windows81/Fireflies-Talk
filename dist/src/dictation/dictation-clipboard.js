"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keptDictationSnapshot = keptDictationSnapshot;
exports.snapshotClipboard = snapshotClipboard;
exports.clipboardHoldsText = clipboardHoldsText;
exports.restoreClipboardIfUnchanged = restoreClipboardIfUnchanged;
exports.snapshotClipboardRich = snapshotClipboardRich;
exports.restoreClipboardRich = restoreClipboardRich;
exports.writeMarkdownClipboard = writeMarkdownClipboard;
exports.writeClipboardForDictationPaste = writeClipboardForDictationPaste;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_clipboard_html_1 = require("./dictation-clipboard-html");
const windows_private_clipboard_1 = require("./windows-private-clipboard");
/** A dictation left on the clipboard for the user, rewritten the private way. */
function keptDictationSnapshot(text) {
    return { type: "dictation", text };
}
function snapshotClipboard() {
    const formats = electron_1.clipboard.availableFormats();
    if (formats.some((format) => format.startsWith("image/"))) {
        const image = electron_1.clipboard.readImage();
        if (!image.isEmpty())
            return { type: "image", image };
    }
    const text = electron_1.clipboard.readText();
    return text ? { type: "text", text } : null;
}
function clipboardHoldsText(text) {
    return electron_1.clipboard.readText() === text;
}
function restoreClipboardIfUnchanged(snapshot, expectedText) {
    if (!snapshot)
        return;
    if (electron_1.clipboard.readText() !== expectedText)
        return;
    if (snapshot.type === "image")
        electron_1.clipboard.writeImage(snapshot.image);
    else if (snapshot.type === "dictation") {
        // The check above is not under the clipboard lock; the private write
        // re-checks while it holds it.
        writeClipboardForDictationPaste(snapshot.text, {
            onlyIfClipboardHolds: expectedText,
        }).catch((error) => {
            electron_log_1.default.warn(`[Dictation] Failed to put dictation back: ${String(error)}`);
        });
    }
    else
        electron_1.clipboard.writeText(snapshot.text);
}
function snapshotClipboardRich() {
    const text = electron_1.clipboard.readText();
    const html = electron_1.clipboard.readHTML();
    const rtf = electron_1.clipboard.readRTF();
    const formats = electron_1.clipboard.availableFormats();
    const hadImage = formats.some((f) => f.startsWith("image/"));
    const image = hadImage ? electron_1.clipboard.readImage() : null;
    return { text, html, rtf, image };
}
function restoreClipboardRich(prior) {
    const hasImage = prior.image && !prior.image.isEmpty();
    if (!prior.text && !prior.html && !prior.rtf && !hasImage) {
        electron_1.clipboard.clear();
        return;
    }
    electron_1.clipboard.write({
        ...(prior.text ? { text: prior.text } : {}),
        ...(prior.html ? { html: prior.html } : {}),
        ...(prior.rtf ? { rtf: prior.rtf } : {}),
        ...(hasImage ? { image: prior.image } : {}),
    });
}
function writePlainAndHtml(text, html) {
    electron_1.clipboard.write({ text, html });
}
/** Plain markdown plus rendered HTML for explicit copy actions. */
function writeMarkdownClipboard(text) {
    writePlainAndHtml(text, (0, dictation_clipboard_html_1.markdownToClipboardHtml)(text));
}
function clipboardHasPlainAndHtml(text) {
    return electron_1.clipboard.readText() === text && Boolean(electron_1.clipboard.readHTML());
}
/**
 * Windows: keep dictated text out of clipboard history / cloud sync.
 * Resolves false when `onlyIfClipboardHolds` no longer held: nothing written.
 */
async function writeClipboardForDictationPaste(text, options = {}) {
    const { onlyIfClipboardHolds = null } = options;
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)(text);
    if (process.platform === "win32") {
        try {
            const written = await (0, windows_private_clipboard_1.setWindowsPrivateClipboardText)(text, html, onlyIfClipboardHolds);
            if (!written)
                return false;
            if (clipboardHasPlainAndHtml(text))
                return true;
            electron_log_1.default.warn("[Dictation] private clipboard text/html not visible, using Electron clipboard");
            // The private write succeeded, so the text is what must still be there now.
            if (onlyIfClipboardHolds !== null && !clipboardHoldsText(text))
                return false;
            writePlainAndHtml(text, html);
            return true;
        }
        catch (error) {
            electron_log_1.default.warn(`[Dictation] private clipboard failed, falling back to Electron clipboard: ${String(error)}`);
        }
    }
    if (onlyIfClipboardHolds !== null &&
        !clipboardHoldsText(onlyIfClipboardHolds)) {
        return false;
    }
    writePlainAndHtml(text, html);
    return true;
}
//# sourceMappingURL=dictation-clipboard.js.map
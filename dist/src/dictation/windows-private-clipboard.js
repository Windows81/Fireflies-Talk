"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWindowsPrivateClipboardText = void 0;
const system_native_windows_1 = require("../system-native-windows");
/**
 * Puts dictated text on the clipboard marked so Windows keeps it out of
 * clipboard history and cloud sync. Runs in-process through the
 * native-system-windows addon.
 *
 * Resolves false when `onlyIfClipboardHolds` was given and the clipboard
 * held something else under the clipboard lock: nothing written. Rejects
 * when the addon is missing or Windows refused the write, so the caller can
 * fall back to Electron's clipboard.
 */
const setWindowsPrivateClipboardText = async (text, html, onlyIfClipboardHolds = null) => {
    const native = (0, system_native_windows_1.getWindowsSystemNative)();
    if (!native) {
        throw new Error("Private clipboard is only available with the Windows addon.");
    }
    return native.writePrivateClipboardText(text, html, onlyIfClipboardHolds);
};
exports.setWindowsPrivateClipboardText = setWindowsPrivateClipboardText;
//# sourceMappingURL=windows-private-clipboard.js.map
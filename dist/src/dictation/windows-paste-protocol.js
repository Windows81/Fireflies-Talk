"use strict";
/**
 * Line protocol for the warm windows-fast-paste helper.
 * Keep in sync with electron/native-paste-windows/windows-fast-paste.c.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWindowsPasteCommand = formatWindowsPasteCommand;
exports.formatWindowsProbeCommand = formatWindowsProbeCommand;
exports.formatWindowsCopyCommand = formatWindowsCopyCommand;
exports.formatWindowsWarmCommand = formatWindowsWarmCommand;
exports.parseWindowsPasteCommand = parseWindowsPasteCommand;
exports.windowsPasteFocusSettleMs = windowsPasteFocusSettleMs;
exports.pasteAckTimeout = pasteAckTimeout;
function formatWindowsPasteCommand(hwnd) {
    return hwnd ? `PASTE ${hwnd}` : "PASTE";
}
/** Re-reads the focused element without posting a keystroke. */
function formatWindowsProbeCommand(hwnd) {
    return hwnd ? `PROBE ${hwnd}` : "PROBE";
}
/** Posts Ctrl+C to the foreground window. */
function formatWindowsCopyCommand() {
    return "COPY";
}
/**
 * Reads the focused element once while the person is still talking. The
 * first read of an app is the slow one, so the paste's own read stays fast.
 */
function formatWindowsWarmCommand() {
    return "WARM";
}
function parseWindowsPasteCommand(line) {
    const trimmed = line.trim();
    if (trimmed === "QUIT")
        return { type: "quit" };
    if (trimmed === "COPY")
        return { type: "copy" };
    if (trimmed === "WARM")
        return { type: "warm" };
    if (trimmed === "PASTE")
        return { type: "paste" };
    if (trimmed.startsWith("PASTE ")) {
        const hwnd = trimmed.slice("PASTE ".length).trim();
        return hwnd ? { type: "paste", hwnd } : { type: "paste" };
    }
    if (trimmed === "PROBE")
        return { type: "probe" };
    if (trimmed.startsWith("PROBE ")) {
        const hwnd = trimmed.slice("PROBE ".length).trim();
        return hwnd ? { type: "probe", hwnd } : { type: "probe" };
    }
    return { type: "unknown" };
}
/** Sleep only after stealing focus. Already-focused targets paste immediately. */
function windowsPasteFocusSettleMs(focusChanged) {
    return focusChanged ? 10 : 0;
}
function pasteAckTimeout(posted) {
    return { recycleHelper: true, treatAsSuccess: posted };
}
//# sourceMappingURL=windows-paste-protocol.js.map
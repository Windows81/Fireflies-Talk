"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScreenContext = getScreenContext;
const dictation_dev_log_1 = require("./dictation-dev-log");
const dictation_screen_context_macos_1 = require("./dictation-screen-context-macos");
const dictation_screen_context_windows_1 = require("./dictation-screen-context-windows");
const windows_listener_lines_1 = require("./windows-listener-lines");
// User-toggleable (see useLocalSettings' `useScreenContextForDictation`, default
// true) — reads the frontmost app's name, window title, visible on-screen
// text, and browser tab URL so Fred's cleanup pass can resolve names/emails
// from context.
function readScreenContext() {
    if (process.platform === "darwin") {
        return (0, dictation_screen_context_macos_1.getScreenContextMacOS)();
    }
    if (process.platform === "win32") {
        return (0, dictation_screen_context_windows_1.getScreenContextWindows)((0, windows_listener_lines_1.getWindowsPasteTargetHwnd)());
    }
    return Promise.resolve(null);
}
async function getScreenContext() {
    const startedAt = performance.now();
    const context = await readScreenContext();
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Screen context read in ${(performance.now() - startedAt).toFixed(0)}ms (${context?.appName ?? "no app"}, ${context?.visibleText?.length ?? 0} chars)`);
    return context;
}
//# sourceMappingURL=dictation-screen-context.js.map
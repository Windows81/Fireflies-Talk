"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resignFirefliesKeyWindow = resignFirefliesKeyWindow;
const electron_1 = require("electron");
/** Whether a Fireflies window held keyboard focus and was made to give it up. */
function resignFirefliesKeyWindow() {
    if (process.platform !== "darwin")
        return false;
    let resigned = false;
    for (const win of electron_1.BrowserWindow.getAllWindows()) {
        if (win.isDestroyed() || !win.isFocused())
            continue;
        win.blur();
        resigned = true;
    }
    return resigned;
}
//# sourceMappingURL=dictation-focus.js.map
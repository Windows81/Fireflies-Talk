"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastCaptureMouse = broadcastCaptureMouse;
const electron_1 = require("electron");
/** Reports a side mouse button to whichever window is recording a shortcut. */
function broadcastCaptureMouse(button, down, flags) {
    for (const win of electron_1.BrowserWindow.getAllWindows()) {
        if (win.isDestroyed())
            continue;
        win.webContents.send("dictation:capture-mouse", button, down, flags);
    }
}
//# sourceMappingURL=capture-mouse-broadcast.js.map
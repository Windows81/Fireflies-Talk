"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenDesktopSettings = createOpenDesktopSettings;
const electron_log_1 = __importDefault(require("electron-log"));
function sendDesktopSettingsRoute(window) {
    if (window.webContents.isLoading()) {
        const win = window;
        win.webContents.once("did-finish-load", () => {
            if (win.isDestroyed())
                return;
            win.webContents.send("navigate-to-route", "DesktopSettings");
        });
        return;
    }
    window.webContents.send("navigate-to-route", "DesktopSettings");
}
function createOpenDesktopSettings({ getMainWindow, createWindow, isLoggedIn, }) {
    return () => {
        if (!isLoggedIn())
            return;
        try {
            const existing = getMainWindow();
            if (!existing || existing.isDestroyed()) {
                createWindow();
            }
            const window = getMainWindow();
            if (!window || window.isDestroyed())
                return;
            if (window.isMinimized())
                window.restore();
            try {
                window.setSkipTaskbar(false);
            }
            catch (error) {
                electron_log_1.default.error("[WINDOW] Failed to set skip taskbar", error);
            }
            window.show();
            window.focus();
            sendDesktopSettingsRoute(window);
        }
        catch (error) {
            electron_log_1.default.error("[WINDOW] Failed to open settings:", error);
        }
    };
}
//# sourceMappingURL=open-desktop-settings.js.map
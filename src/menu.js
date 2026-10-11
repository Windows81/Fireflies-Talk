"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupApplicationMenu = setupApplicationMenu;
const electron_1 = require("electron");
const utils_1 = require("./utils");
const windowing_1 = require("./windowing");
const application_menu_template_1 = require("./application-menu-template");
const desktop_logged_in_1 = require("./desktop-logged-in");
const open_desktop_settings_1 = require("./open-desktop-settings");
const openDesktopSettings = (0, open_desktop_settings_1.createOpenDesktopSettings)({
    getMainWindow: () => windowing_1.mainWindow,
    createWindow: windowing_1.createWindow,
    isLoggedIn: desktop_logged_in_1.isDesktopLoggedIn,
});
/**
 * Resolves the focused BrowserWindow from a menu click handler's window parameter.
 */
function resolveFocusedBrowserWindow(window) {
    return window instanceof electron_1.BrowserWindow
        ? window
        : electron_1.BrowserWindow.getFocusedWindow() || null;
}
/**
 * Setup application menu with Edit menu for clipboard operations
 * and View menu for development tools.
 */
function setupApplicationMenu() {
    const template = [
        ...(0, application_menu_template_1.buildDarwinAppMenu)(process.platform, electron_1.app.name, openDesktopSettings, (0, desktop_logged_in_1.isDesktopLoggedIn)()),
        // Edit menu: Essential for clipboard operations (copy, paste, etc.)
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "pasteAndMatchStyle" },
                { role: "delete" },
                { role: "selectAll" },
            ],
        },
        // View menu: fullscreen always available; dev tools only in dev. Zoom is
        // handled by window-zoom.ts (bounded + persistence-healing), so the
        // unbounded resetZoom/zoomIn/zoomOut menu roles are intentionally omitted.
        {
            label: "View",
            submenu: [
                ...((0, utils_1.shouldEnableDevTools)()
                    ? [
                        {
                            label: "Reload",
                            accelerator: "CmdOrCtrl+R",
                            click: (_menuItem, window) => {
                                const focusedWindow = resolveFocusedBrowserWindow(window);
                                if (focusedWindow === windowing_1.liveWindow) {
                                    // For live window, reload the browser view content
                                    const liveWebContents = (0, windowing_1.getLiveBrowserViewWebContents)();
                                    if (liveWebContents && !liveWebContents.isDestroyed()) {
                                        liveWebContents.reload();
                                    }
                                }
                                else if (focusedWindow && !focusedWindow.isDestroyed()) {
                                    focusedWindow.webContents.reload();
                                }
                            },
                        },
                        {
                            label: "Force Reload",
                            accelerator: "CmdOrCtrl+Shift+R",
                            click: (_menuItem, window) => {
                                const focusedWindow = resolveFocusedBrowserWindow(window);
                                if (focusedWindow === windowing_1.liveWindow) {
                                    // For live window, reload the browser view content
                                    const liveWebContents = (0, windowing_1.getLiveBrowserViewWebContents)();
                                    if (liveWebContents && !liveWebContents.isDestroyed()) {
                                        liveWebContents.reloadIgnoringCache();
                                    }
                                }
                                else if (focusedWindow && !focusedWindow.isDestroyed()) {
                                    focusedWindow.webContents.reloadIgnoringCache();
                                }
                            },
                        },
                        {
                            label: "Toggle Developer Tools",
                            accelerator: process.platform === "darwin"
                                ? "Alt+Command+I"
                                : "Ctrl+Shift+I",
                            click: (_menuItem, window) => {
                                const focusedWindow = resolveFocusedBrowserWindow(window);
                                if (focusedWindow === windowing_1.liveWindow) {
                                    // For live window, toggle dev tools on the browser view content
                                    const liveWebContents = (0, windowing_1.getLiveBrowserViewWebContents)();
                                    if (liveWebContents && !liveWebContents.isDestroyed()) {
                                        liveWebContents.toggleDevTools();
                                    }
                                }
                                else if (focusedWindow && !focusedWindow.isDestroyed()) {
                                    focusedWindow.webContents.toggleDevTools();
                                }
                            },
                        },
                        { type: "separator" },
                    ]
                    : []),
                { role: "togglefullscreen" },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
//# sourceMappingURL=menu.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppressDictationPillContextMenus = suppressDictationPillContextMenus;
/**
 * Windows treats `-webkit-app-region: drag` as a title bar, so right-click
 * opens the system window menu. macOS panel windows never show that menu.
 * Swallow both the OS menu and Chromium's page context menu so the pill
 * matches macOS.
 */
function suppressDictationPillContextMenus(win, webContents) {
    win.on("system-context-menu", (event) => {
        event.preventDefault();
    });
    webContents.on("context-menu", (event) => {
        event.preventDefault();
    });
}
//# sourceMappingURL=dictation-pill-context-menu.js.map
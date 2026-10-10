"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDarwinAppSubmenu = buildDarwinAppSubmenu;
exports.buildDarwinAppMenu = buildDarwinAppMenu;
function buildDarwinAppSubmenu(openDesktopSettings, loggedIn) {
    const items = [
        { role: "about" },
        { type: "separator" },
    ];
    if (loggedIn) {
        items.push({
            label: "Settings",
            accelerator: "CmdOrCtrl+,",
            click: openDesktopSettings,
        });
        items.push({ type: "separator" });
    }
    items.push({ role: "services" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" });
    return items;
}
function buildDarwinAppMenu(platform, appName, openDesktopSettings, loggedIn) {
    if (platform !== "darwin")
        return [];
    return [
        {
            label: appName,
            submenu: buildDarwinAppSubmenu(openDesktopSettings, loggedIn),
        },
    ];
}
//# sourceMappingURL=application-menu-template.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupQuickNoteShortcut = setupQuickNoteShortcut;
exports.setQuickNoteShortcut = setQuickNoteShortcut;
exports.getQuickNoteShortcutState = getQuickNoteShortcutState;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const windowing_1 = require("./windowing");
const quick_note_shortcut_store_1 = require("./quick-note-shortcut-store");
const SHORTCUT_PREFIX = "CommandOrControl+Alt+";
let quickNoteEnabled = false;
let quickNoteKey = "N";
function sendToMain(channel, ...args) {
    if (!windowing_1.mainWindow || windowing_1.mainWindow.isDestroyed())
        return;
    if (windowing_1.mainWindow.webContents.isLoading()) {
        const win = windowing_1.mainWindow;
        win.webContents.once("did-finish-load", () => {
            if (!win.isDestroyed())
                win.webContents.send(channel, ...args);
        });
    }
    else {
        windowing_1.mainWindow.webContents.send(channel, ...args);
    }
}
let registeredQuickNoteAccel = null;
function applyQuickNoteShortcut(source) {
    if (registeredQuickNoteAccel) {
        electron_1.globalShortcut.unregister(registeredQuickNoteAccel);
        electron_log_1.default.info("[QuickNote] Unregistered global shortcut", {
            accelerator: registeredQuickNoteAccel,
            source,
        });
        registeredQuickNoteAccel = null;
    }
    if (!quickNoteEnabled)
        return;
    const accel = `${SHORTCUT_PREFIX}${quickNoteKey}`;
    const ok = electron_1.globalShortcut.register(accel, () => {
        electron_log_1.default.info("[QuickNote] Global shortcut triggered", accel);
        (0, windowing_1.showMainWindow)();
        sendToMain("start-recording", { source: "shortcut" });
    });
    if (ok) {
        registeredQuickNoteAccel = accel;
        electron_log_1.default.info("[QuickNote] Registered global shortcut", {
            accelerator: accel,
            source,
        });
    }
    else {
        electron_log_1.default.warn("[QuickNote] Failed to register global shortcut", {
            accelerator: accel,
            source,
        });
    }
}
function setupQuickNoteShortcut() {
    electron_1.app.on("will-quit", () => {
        electron_1.globalShortcut.unregisterAll();
    });
    const persisted = (0, quick_note_shortcut_store_1.readQuickNoteShortcut)();
    if (persisted) {
        quickNoteEnabled = persisted.enabled;
        quickNoteKey = persisted.key;
        applyQuickNoteShortcut("startup");
    }
}
function setQuickNoteShortcut(enabled, key) {
    const keyLength = typeof key === "string" ? key.length : 0;
    if (!(0, quick_note_shortcut_store_1.isValidQuickNoteKey)(key)) {
        electron_log_1.default.warn("[QuickNote] Ignoring invalid shortcut key", {
            keyType: typeof key,
            keyLength,
        });
        return false;
    }
    const normalizedKey = key.toUpperCase();
    const accel = `${SHORTCUT_PREFIX}${normalizedKey}`;
    if (enabled === quickNoteEnabled &&
        normalizedKey === quickNoteKey &&
        (!enabled || registeredQuickNoteAccel === accel)) {
        return true;
    }
    quickNoteEnabled = enabled;
    quickNoteKey = normalizedKey;
    (0, quick_note_shortcut_store_1.writeQuickNoteShortcut)({ enabled: quickNoteEnabled, key: quickNoteKey });
    applyQuickNoteShortcut("renderer");
    return true;
}
function getQuickNoteShortcutState() {
    return { enabled: quickNoteEnabled, key: quickNoteKey };
}
//# sourceMappingURL=quick-note-shortcut.js.map
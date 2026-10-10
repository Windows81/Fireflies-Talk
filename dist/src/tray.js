"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tray = void 0;
exports.setTrayFinalizingRecording = setTrayFinalizingRecording;
exports.rebuildTray = rebuildTray;
exports.updateTrayCalendarState = updateTrayCalendarState;
exports.createTray = createTray;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const windowing_1 = require("./windowing");
const recording_context_store_1 = require("./recording-context-store");
const electron_log_1 = __importDefault(require("electron-log"));
const download_and_update_1 = require("./auto-updater/download-and-update");
const tray_icon_builder_1 = require("./tray-icon-builder");
const tray_menu_1 = require("./tray-menu");
const quit_readiness_1 = require("./quit-readiness");
exports.tray = null;
// Quitting waits for a live recording to finalize, which can take a few seconds
// on a slow network with every window still on screen. Say so in the tray
// rather than leaving the app looking hung.
const FINALIZING_LABEL = "Finishing recording\u2026";
let finalizingRecording = false;
const trayIconFileName = process.platform === "win32"
    ? "tray-icon-windows.png"
    : "tray-icon-macos.png";
const assetsPath = "assets";
let calendarState = { upcomingEvents: [], liveMeetings: [] };
let titleRefreshTimer = null;
let trayIconDefault = null;
let trayIconActive = null;
function loadMenuIcon(filename) {
    const iconPath = (0, utils_1.isDev)()
        ? path.join(assetsPath, filename)
        : path.join(process.resourcesPath, assetsPath, filename);
    const img = electron_1.nativeImage.createFromPath(iconPath);
    return img.isEmpty() ? undefined : img;
}
const _iconCache = new Map();
function cachedMenuIcon(filename) {
    if (!_iconCache.has(filename))
        _iconCache.set(filename, loadMenuIcon(filename));
    return _iconCache.get(filename);
}
function refreshActiveIcon(iconPath) {
    const icon = (0, tray_icon_builder_1.buildActiveIcon)(iconPath);
    if (icon)
        trayIconActive = icon;
}
function isCallActive() {
    const recording = (0, recording_context_store_1.getRecordingContextSnapshot)();
    return (recording?.state === "recording" || calendarState.liveMeetings.length > 0);
}
/**
 * Reflect recording finalization in the tray while the app is quitting.
 *
 * Tolerates a missing tray: this runs from the quit path, which is exactly when
 * the tray may already be gone.
 */
function setTrayFinalizingRecording(active) {
    finalizingRecording = active;
    if (exports.tray)
        rebuildTray();
}
function rebuildTray() {
    if (!exports.tray)
        return;
    const now = Date.now();
    exports.tray.setToolTip(finalizingRecording ? FINALIZING_LABEL : "Fireflies.ai");
    if (process.platform === "darwin") {
        const icon = isCallActive() ? trayIconActive : trayIconDefault;
        if (icon)
            exports.tray.setImage(icon);
        exports.tray.setTitle(finalizingRecording
            ? FINALIZING_LABEL
            : isCallActive()
                ? ""
                : (0, tray_menu_1.buildTrayTitle)(calendarState, now));
    }
    exports.tray.setContextMenu((0, tray_menu_1.buildTrayMenu)(calendarState, cachedMenuIcon, rebuildTray, now));
}
function updateTrayCalendarState(state) {
    calendarState = state;
    rebuildTray();
}
function createTray() {
    try {
        const id = electron_1.powerSaveBlocker.start("prevent-app-suspension");
        if (!electron_1.powerSaveBlocker.isStarted(id)) {
            electron_log_1.default.warn("[POWER] Failed to start powerSaveBlocker");
        }
        else {
            electron_log_1.default.info("[POWER] powerSaveBlocker active with id:", id);
        }
        (0, quit_readiness_1.onFinalQuit)(() => {
            if (electron_1.powerSaveBlocker.isStarted(id))
                electron_1.powerSaveBlocker.stop(id);
        });
    }
    catch (e) {
        electron_log_1.default.error("[POWER] Error initializing powerSaveBlocker", e);
    }
    try {
        const iconPath = (0, utils_1.isDev)()
            ? `./${assetsPath}/${trayIconFileName}`
            : path.join(process.resourcesPath, assetsPath, trayIconFileName);
        let trayIcon = electron_1.nativeImage.createFromPath(iconPath);
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
        trayIcon.setTemplateImage(true);
        trayIconDefault = trayIcon;
        exports.tray = new electron_1.Tray(trayIcon);
        exports.tray.setToolTip("Fireflies.ai");
        (0, download_and_update_1.setUpdateStatusChangedCallback)(() => rebuildTray());
        if (process.platform === "darwin") {
            refreshActiveIcon(iconPath);
            // Rebuild active icon when appearance changes so fg color stays correct
            electron_1.nativeTheme.on("updated", () => {
                refreshActiveIcon(iconPath);
                rebuildTray();
            });
        }
        rebuildTray();
        // Rebuild full tray every minute so countdown strings stay current
        titleRefreshTimer = setInterval(() => rebuildTray(), 60000);
        (0, quit_readiness_1.onFinalQuit)(() => {
            if (titleRefreshTimer) {
                clearInterval(titleRefreshTimer);
                titleRefreshTimer = null;
            }
        });
        if (process.platform === "win32") {
            exports.tray.on("click", () => (0, windowing_1.showMainWindow)());
        }
    }
    catch (error) {
        electron_log_1.default.error("[TRAY] Failed to create tray icon:", error);
    }
}
//# sourceMappingURL=tray.js.map
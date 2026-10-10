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
exports.isActionOrbSender = isActionOrbSender;
exports.followPillDisplay = followPillDisplay;
exports.setDictationActionOrbsVisible = setDictationActionOrbsVisible;
exports.rescueDictationActionOrbWindow = rescueDictationActionOrbWindow;
exports.raiseDictationActionOrbWindow = raiseDictationActionOrbWindow;
exports.sendDictationStateToActionOrbs = sendDictationStateToActionOrbs;
exports.sendActionRunsToOrbs = sendActionRunsToOrbs;
exports.getDictationActionOrbWindowBounds = getDictationActionOrbWindowBounds;
exports.ensureDictationActionOrbWindow = ensureDictationActionOrbWindow;
exports.hideDictationActionOrbWindow = hideDictationActionOrbWindow;
exports.startDictationActionOrbDrag = startDictationActionOrbDrag;
exports.endDictationActionOrbDrag = endDictationActionOrbDrag;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const utils_1 = require("../utils");
const mouse_1 = require("../mouse");
const macos_panel_activation_1 = require("../macos-panel-activation");
const macos_spaces_1 = require("../macos-spaces");
const windows_overlay_owner_1 = require("./windows-overlay-owner");
/**
 * The window detached action runs live in. It parks in the top-right corner and
 * holds a row of orbs plus whichever one's progress panel is open, so a run can
 * outlive the pill that launched it and the pill goes straight back to idle.
 *
 * It is mostly empty air: alpha click-through keeps everything transparent
 * pass-through, so only the orbs and an open panel take the pointer.
 */
let orbWindow = null;
/** Pauses alpha click-through so a drag is not cut short over transparent air. */
let orbDragging = false;
let orbsIntendedVisible = false;
/**
 * The orbs check their own Z order on their own clock. The pill's reposition
 * loop used to do it for them, but that loop stops whenever the pill is hidden
 * — which is how the "show pill" preference works — while the orbs stay up,
 * and a demoted orb would then wait for a main-window event to be put back.
 */
const ORB_RESCUE_MS = 400;
let orbRescueInterval = null;
function startOrbRescueLoop() {
    if (orbRescueInterval || process.platform !== "win32")
        return;
    orbRescueInterval = setInterval(rescueDictationActionOrbWindow, ORB_RESCUE_MS);
}
function stopOrbRescueLoop() {
    if (!orbRescueInterval)
        return;
    clearInterval(orbRescueInterval);
    orbRescueInterval = null;
}
/**
 * The window spans a whole work area rather than boxing in the corner: an orb
 * flies from the pill to its parking slot, and no window smaller than the
 * screen can show that trip.
 *
 * It follows the display the pill is on, not the primary one — otherwise a
 * pill on a second monitor launches orbs onto a screen it is not on, and the
 * flight is clipped at the boundary.
 */
function overlayBounds(pill) {
    const display = pill
        ? electron_1.screen.getDisplayNearestPoint({
            x: Math.round(pill.x + pill.width / 2),
            y: Math.round(pill.y + pill.height / 2),
        })
        : electron_1.screen.getPrimaryDisplay();
    return { ...display.workArea };
}
/** True when these ipc messages came from the overlay itself. */
function isActionOrbSender(sender) {
    if (!orbWindow || orbWindow.isDestroyed())
        return false;
    if (orbWindow.webContents.isDestroyed())
        return false;
    return orbWindow.webContents.id === sender.id;
}
/** Keeps the overlay on whichever display the pill has moved to. */
function followPillDisplay(pill) {
    if (!orbWindow || orbWindow.isDestroyed())
        return;
    const next = overlayBounds(pill);
    const current = orbWindow.getBounds();
    if (current.x === next.x &&
        current.y === next.y &&
        current.width === next.width &&
        current.height === next.height) {
        return;
    }
    orbWindow.setBounds(next);
}
/**
 * Detached runs belong to dictation being switched on, not to the pill being
 * on screen. Hiding the pill is also how the "show pill" preference works, and
 * that leaves the hotkeys live — orbs tied to it would let a run finish
 * invisibly and take its result with it.
 *
 * Switching on therefore creates the overlay if the pill never did: with the
 * pill preference off, nothing else ever would.
 */
function setDictationActionOrbsVisible(visible, pill) {
    orbsIntendedVisible = visible;
    if (visible) {
        ensureDictationActionOrbWindow(pill);
        if (orbWindow && !orbWindow.isDestroyed()) {
            (0, windows_overlay_owner_1.adoptWindowsOverlay)(orbWindow);
            orbWindow.showInactive();
        }
        startOrbRescueLoop();
        return;
    }
    stopOrbRescueLoop();
    if (!orbWindow || orbWindow.isDestroyed())
        return;
    orbWindow.hide();
}
function rescueDictationActionOrbWindow() {
    (0, windows_overlay_owner_1.rescueWindowsOverlayWindow)(orbWindow, orbsIntendedVisible);
}
/** Back to the top of the topmost band after the main window re-stacks. */
function raiseDictationActionOrbWindow() {
    if (!orbsIntendedVisible)
        return;
    (0, windows_overlay_owner_1.raiseWindowsOverlay)(orbWindow);
}
/**
 * The overlay spawns an orb the moment an action-mode session ends, so it needs
 * the same session pushes the pill gets.
 */
function sendDictationStateToActionOrbs(state, mode) {
    if (!orbWindow || orbWindow.isDestroyed())
        return;
    if (orbWindow.webContents.isDestroyed())
        return;
    orbWindow.webContents.send("dictation:state", state, mode);
}
/** Pushes the owner's latest set of detached runs to the overlay. */
function sendActionRunsToOrbs(runs) {
    if (!orbWindow || orbWindow.isDestroyed())
        return;
    if (orbWindow.webContents.isDestroyed())
        return;
    orbWindow.webContents.send("dictation:action-runs", runs);
}
function getDictationActionOrbWindowBounds() {
    if (!orbWindow || orbWindow.isDestroyed())
        return null;
    return orbWindow.getBounds();
}
function ensureDictationActionOrbWindow(pill) {
    if (orbWindow && !orbWindow.isDestroyed())
        return;
    try {
        orbWindow = new electron_1.BrowserWindow({
            ...overlayBounds(pill),
            ...(process.platform === "darwin" ? { type: "panel" } : {}),
            show: false,
            maximizable: false,
            minimizable: false,
            resizable: false,
            fullscreenable: false,
            alwaysOnTop: true,
            frame: false,
            skipTaskbar: true,
            transparent: true,
            hasShadow: false,
            backgroundColor: "#00000000",
            acceptFirstMouse: true,
            // Copying a result must not pull focus off whatever the user went back
            // to typing in.
            focusable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "..", "..", "preload.js"),
                webSecurity: !(0, utils_1.isDev)(),
                sandbox: !(0, utils_1.isDev)(),
                allowRunningInsecureContent: false,
                experimentalFeatures: false,
                backgroundThrottling: false,
                devTools: (0, utils_1.shouldEnableDevTools)(),
            },
        });
        orbWindow.setFocusable(false);
        orbWindow.setAlwaysOnTop(true, "screen-saver");
        (0, windows_overlay_owner_1.adoptWindowsOverlay)(orbWindow);
        (0, macos_spaces_1.keepWindowOnActiveSpace)(orbWindow);
        (0, macos_panel_activation_1.keepMacPanelFromActivating)(orbWindow);
        orbWindow.loadURL((0, utils_1.getUrlToLoad)("/dictation-action-orbs"));
        orbWindow.webContents.once("did-finish-load", () => {
            if (!orbWindow || orbWindow.isDestroyed())
                return;
            (0, mouse_1.startIgnoreMouseEventsByAlpha)(orbWindow, orbWindow.webContents, 150, false, () => orbDragging);
            if (!orbsIntendedVisible)
                return;
            (0, windows_overlay_owner_1.adoptWindowsOverlay)(orbWindow);
            orbWindow.showInactive();
            electron_log_1.default.info("[ActionOrbs] Window shown", { bounds: orbWindow.getBounds() });
        });
        orbWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
            electron_log_1.default.error(`[ActionOrbs] Failed to load: ${errorCode} - ${errorDescription}`);
        });
        orbWindow.on("closed", () => {
            orbDragging = false;
            orbWindow = null;
        });
    }
    catch (error) {
        electron_log_1.default.error("[ActionOrbs] Failed to create window:", error);
    }
}
function hideDictationActionOrbWindow() {
    orbsIntendedVisible = false;
    stopOrbRescueLoop();
    if (!orbWindow || orbWindow.isDestroyed())
        return;
    orbWindow.close();
    orbWindow = null;
}
/**
 * The orb is dragged inside this window, not by moving it, so the main process
 * only has to keep the window interactive for the length of the gesture — the
 * pointer crosses transparent air on the way, and click-through would otherwise
 * hand those moves to the app underneath and strand the drag.
 */
function startDictationActionOrbDrag() {
    orbDragging = true;
}
function endDictationActionOrbDrag() {
    orbDragging = false;
}
//# sourceMappingURL=dictation-action-orb-window.js.map
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
exports.createDictationPillCardWindow = createDictationPillCardWindow;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const utils_1 = require("../utils");
const mouse_1 = require("../mouse");
const dictation_pill_minimized_1 = require("./dictation-pill-minimized");
const dictation_pill_context_menu_1 = require("./dictation-pill-context-menu");
const windows_overlay_owner_1 = require("./windows-overlay-owner");
const windows_overlay_activation_1 = require("./windows-overlay-activation");
const macos_panel_activation_1 = require("../macos-panel-activation");
const macos_spaces_1 = require("../macos-spaces");
/**
 * A transparent always-on-top window that hangs a card off the pill's docked
 * side — the "Try Talk" teaser and the feedback popover are the same plumbing
 * with a different route and focus policy. Click-through wherever it is
 * transparent, so only the card takes the pointer.
 */
function createDictationPillCardWindow(options) {
    let cardWindow = null;
    /** Set once the card has loaded and been shown; false while it is still loading. */
    let intendedVisible = false;
    function boundsForPill(pill, side) {
        const display = electron_1.screen.getDisplayNearestPoint({
            x: pill.x + Math.floor(pill.width / 2),
            y: pill.y + Math.floor(pill.height / 2),
        });
        const zoom = cardWindow &&
            !cardWindow.isDestroyed() &&
            !cardWindow.webContents.isDestroyed()
            ? cardWindow.webContents.getZoomFactor()
            : 1;
        return options.boundsFor(pill, side, display.workArea, (0, dictation_pill_minimized_1.isDictationPillMinimized)(), zoom);
    }
    function send(channel, payload) {
        if (!cardWindow || cardWindow.isDestroyed())
            return;
        if (cardWindow.webContents.isDestroyed())
            return;
        cardWindow.webContents.send(channel, payload);
    }
    function sendSide(side) {
        send("dictation:side", side);
    }
    function position(pill, side) {
        if (!cardWindow || cardWindow.isDestroyed())
            return;
        cardWindow.setBounds(boundsForPill(pill, side));
        sendSide(side);
    }
    function hide() {
        intendedVisible = false;
        if (!cardWindow || cardWindow.isDestroyed())
            return;
        cardWindow.close();
        cardWindow = null;
    }
    function raise() {
        if (!intendedVisible)
            return;
        (0, windows_overlay_owner_1.raiseWindowsOverlay)(cardWindow);
    }
    function rescue() {
        (0, windows_overlay_owner_1.rescueWindowsOverlayWindow)(cardWindow, intendedVisible);
    }
    function isSender(sender) {
        if (!cardWindow || cardWindow.isDestroyed())
            return false;
        if (cardWindow.webContents.isDestroyed())
            return false;
        return cardWindow.webContents.id === sender.id;
    }
    function isVisible() {
        return intendedVisible;
    }
    /** Puts the loaded card on screen; `onShown` fires once per time it comes up. */
    function reveal(window, pill, side, onShown) {
        const wasVisible = intendedVisible;
        position(pill, side);
        (0, windows_overlay_owner_1.adoptWindowsOverlay)(window);
        window.showInactive();
        intendedVisible = true;
        if (!wasVisible)
            onShown();
    }
    function show(pill, side, onShown) {
        try {
            if (cardWindow && !cardWindow.isDestroyed()) {
                reveal(cardWindow, pill, side, onShown);
                return;
            }
            const created = new electron_1.BrowserWindow({
                ...boundsForPill(pill, side),
                ...(process.platform === "darwin" ? { type: "panel" } : {}),
                show: false,
                maximizable: false,
                minimizable: false,
                resizable: false,
                movable: false,
                fullscreenable: false,
                alwaysOnTop: true,
                frame: false,
                skipTaskbar: true,
                transparent: true,
                hasShadow: false,
                backgroundColor: "#00000000",
                acceptFirstMouse: true,
                focusable: options.focusable,
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
            cardWindow = created;
            if (!options.focusable)
                created.setFocusable(false);
            created.setAlwaysOnTop(true, "screen-saver");
            (0, windows_overlay_owner_1.adoptWindowsOverlay)(created);
            // MA_NOACTIVATE and its macOS counterpart are only for overlays that
            // must take clicks without ever being activated; a focusable card wants
            // real focus.
            if (!options.focusable) {
                (0, windows_overlay_activation_1.keepWindowsOverlayClickable)(created);
                (0, macos_panel_activation_1.keepMacPanelFromActivating)(created);
            }
            (0, dictation_pill_context_menu_1.suppressDictationPillContextMenus)(created, created.webContents);
            (0, macos_spaces_1.keepWindowOnActiveSpace)(created);
            // App.tsx short-circuits this path to the card alone, ahead of GraphQL
            // and the Navigator, the same way the other pill-side windows are routed.
            created.loadURL((0, utils_1.getUrlToLoad)(options.route));
            created.webContents.once("did-finish-load", () => {
                // hide() + show() replaces the window before the old one's async
                // listeners fire; a superseded window must not touch the replacement.
                if (cardWindow !== created || created.isDestroyed())
                    return;
                reveal(created, pill, side, onShown);
                electron_log_1.default.info(`[DictationPill] ${options.logLabel} shown`, {
                    bounds: created.getBounds(),
                });
                (0, mouse_1.startIgnoreMouseEventsByAlpha)(created, created.webContents, 150, false);
            });
            created.webContents.on("did-fail-load", (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
                if (!isMainFrame || errorCode === -3)
                    return; // -3: superseded navigation
                electron_log_1.default.error(`[DictationPill] ${options.logLabel} failed: ${errorCode} - ${errorDescription}`);
                // A page that never loaded must not be reused by the next show().
                if (cardWindow === created) {
                    cardWindow = null;
                    intendedVisible = false;
                }
                if (!created.isDestroyed())
                    created.close();
            });
            created.on("closed", () => {
                if (cardWindow !== created)
                    return;
                cardWindow = null;
                intendedVisible = false;
            });
        }
        catch (error) {
            electron_log_1.default.error(`[DictationPill] Failed to show ${options.logLabel}:`, error);
        }
    }
    return { show, hide, position, raise, rescue, isSender, send, isVisible };
}
//# sourceMappingURL=dictation-pill-card-window.js.map
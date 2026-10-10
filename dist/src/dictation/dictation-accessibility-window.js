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
exports.onDictationAccessibilityPromptClosed = onDictationAccessibilityPromptClosed;
exports.isDictationAccessibilityPromptOpen = isDictationAccessibilityPromptOpen;
exports.positionDictationAccessibilityPrompt = positionDictationAccessibilityPrompt;
exports.hideDictationAccessibilityPrompt = hideDictationAccessibilityPrompt;
exports.showDictationAccessibilityPromptIfNeeded = showDictationAccessibilityPromptIfNeeded;
exports.showDictationAccessibilityPrompt = showDictationAccessibilityPrompt;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const utils_1 = require("../utils");
const mouse_1 = require("../mouse");
const macos_panel_activation_1 = require("../macos-panel-activation");
const macos_spaces_1 = require("../macos-spaces");
const dictation_accessibility_1 = require("./dictation-accessibility");
const dictation_accessibility_policy_1 = require("./dictation-accessibility-policy");
const dictation_pill_anchored_layout_1 = require("./dictation-pill-anchored-layout");
const dictation_pill_minimized_1 = require("./dictation-pill-minimized");
let promptWindow = null;
let promptClosedListener = null;
/** Runs whenever the guide leaves the screen, however it was closed. */
function onDictationAccessibilityPromptClosed(listener) {
    promptClosedListener = listener;
}
function isDictationAccessibilityPromptOpen() {
    return promptWindow !== null && !promptWindow.isDestroyed();
}
function promptBoundsForPill(pill, side) {
    const display = electron_1.screen.getDisplayNearestPoint({
        x: pill.x + Math.floor(pill.width / 2),
        y: pill.y + Math.floor(pill.height / 2),
    });
    const zoom = promptWindow &&
        !promptWindow.isDestroyed() &&
        !promptWindow.webContents.isDestroyed()
        ? promptWindow.webContents.getZoomFactor()
        : 1;
    return (0, dictation_pill_anchored_layout_1.getDictationAccessibilityPromptBounds)(pill, side, display.workArea, (0, dictation_pill_minimized_1.isDictationPillMinimized)(), zoom);
}
function sendPromptSide(side) {
    if (!promptWindow || promptWindow.isDestroyed())
        return;
    if (promptWindow.webContents.isDestroyed())
        return;
    promptWindow.webContents.send("dictation:side", side);
}
function positionDictationAccessibilityPrompt(pill, side) {
    if (process.platform !== "darwin")
        return;
    if (!promptWindow || promptWindow.isDestroyed())
        return;
    promptWindow.setBounds(promptBoundsForPill(pill, side));
    sendPromptSide(side);
}
function hideDictationAccessibilityPrompt() {
    if (!promptWindow || promptWindow.isDestroyed())
        return;
    promptWindow.close();
    promptWindow = null;
}
function showDictationAccessibilityPromptIfNeeded(pill, side) {
    const granted = (0, dictation_accessibility_1.hasDictationAccessibility)();
    if (!(0, dictation_accessibility_policy_1.shouldShowDictationAccessibilityPrompt)(process.platform, granted)) {
        return;
    }
    electron_log_1.default.info(`[DictationPill] Accessibility trusted=${granted}`);
    showDictationAccessibilityPrompt(pill, side);
}
function showDictationAccessibilityPrompt(pill, side) {
    if (process.platform !== "darwin")
        return;
    try {
        if (promptWindow && !promptWindow.isDestroyed()) {
            positionDictationAccessibilityPrompt(pill, side);
            promptWindow.showInactive();
            return;
        }
        const bounds = promptBoundsForPill(pill, side);
        promptWindow = new electron_1.BrowserWindow({
            ...bounds,
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
        promptWindow.setFocusable(false);
        promptWindow.setAlwaysOnTop(true, "screen-saver");
        (0, macos_spaces_1.keepWindowOnActiveSpace)(promptWindow);
        (0, macos_panel_activation_1.keepMacPanelFromActivating)(promptWindow);
        // App.tsx short-circuits this path to the original React card (and
        // congrats animation) so Navigator cannot fall through to MainDesktop.
        promptWindow.loadURL((0, utils_1.getUrlToLoad)("/dictation-accessibility"));
        promptWindow.webContents.once("did-finish-load", () => {
            if (!promptWindow || promptWindow.isDestroyed())
                return;
            positionDictationAccessibilityPrompt(pill, side);
            promptWindow.showInactive();
            electron_log_1.default.info("[DictationPill] Accessibility prompt shown", {
                bounds: promptWindow.getBounds(),
            });
            (0, mouse_1.startIgnoreMouseEventsByAlpha)(promptWindow, promptWindow.webContents, 150, false);
        });
        promptWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
            electron_log_1.default.error(`[DictationPill] Accessibility prompt failed: ${errorCode} - ${errorDescription}`);
        });
        promptWindow.on("closed", () => {
            promptWindow = null;
            promptClosedListener?.();
        });
    }
    catch (error) {
        electron_log_1.default.error("[DictationPill] Failed to show accessibility prompt:", error);
    }
}
//# sourceMappingURL=dictation-accessibility-window.js.map
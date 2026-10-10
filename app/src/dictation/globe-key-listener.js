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
exports.setGlobeCaptureMode = setGlobeCaptureMode;
exports.setGlobeHoldChord = setGlobeHoldChord;
exports.setGlobeHandsFreeKey = setGlobeHandsFreeKey;
exports.setGlobePolishKeys = setGlobePolishKeys;
exports.restoreLeftoverFnUsage = restoreLeftoverFnUsage;
exports.startGlobeKeyListener = startGlobeKeyListener;
exports.isGlobeKeyListenerRunning = isGlobeKeyListenerRunning;
exports.isGlobeListenerPolishOnly = isGlobeListenerPolishOnly;
exports.stopGlobeKeyListener = stopGlobeKeyListener;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const readline = __importStar(require("readline"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const capture_mouse_broadcast_1 = require("./capture-mouse-broadcast");
const hotkey_mouse_1 = require("./hotkey-mouse");
const BINARY_NAME = "macos-globe-listener";
// Ported from OpenWhispr's GlobeKeyManager (github.com/OpenWhispr/openwhispr,
// MIT License) — the CGEventTap-based flagsChanged monitor gets invalidated by
// macOS sleep/wake, which exits the listener process with code 0 even though
// we never asked it to stop. Auto-restart a bounded number of times so one
// sleep cycle doesn't permanently break the hotkey until the app is relaunched.
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY_MS = 1000;
const RESTART_RESET_MS = 10000;
function getBinaryPath() {
    return electron_1.app.isPackaged
        ? path.join(process.resourcesPath, "bin", BINARY_NAME)
        : path.join(__dirname, "..", "..", "..", "resources", "bin", BINARY_NAME);
}
let listenerProcess = null;
let dyingProcess = null;
let queuedStart = false;
let callbacks = null;
let isStopping = false;
let restartCount = 0;
let restartResetTimer = null;
// Re-applied on every spawn: a restart after sleep/wake gets a fresh process.
let captureModeEnabled = false;
let polishKeyCodes = null;
let holdChordKeyCode = null;
let handsFreeKeyCode = null;
let polishOnly = false;
function broadcastToWindows(channel, payload) {
    for (const win of electron_1.BrowserWindow.getAllWindows()) {
        if (win.isDestroyed())
            continue;
        win.webContents.send(channel, payload);
    }
}
function writeCommand(command) {
    const stdin = listenerProcess?.stdin;
    if (!stdin || stdin.destroyed)
        return;
    stdin.write(`${command}\n`);
}
function applyListenerState() {
    writeCommand(holdChordKeyCode === null
        ? "HOLD_CHORD_NONE"
        : `HOLD_CHORD ${holdChordKeyCode}`);
    writeCommand(handsFreeKeyCode === null
        ? "HANDS_FREE_KEY_NONE"
        : `HANDS_FREE_KEY ${handsFreeKeyCode}`);
    if (polishKeyCodes) {
        writeCommand(polishKeyCodes.length > 0
            ? `POLISH ${polishKeyCodes.join(",")}`
            : "POLISH_NONE");
    }
    if (captureModeEnabled)
        writeCommand("CAPTURE_ON");
}
/**
 * Reports Fn chords to the settings window instead of driving dictation, so a
 * shortcut like Fn + 2 can be recorded. macOS never delivers Fn to the page.
 */
function setGlobeCaptureMode(enabled) {
    captureModeEnabled = enabled;
    writeCommand(enabled ? "CAPTURE_ON" : "CAPTURE_OFF");
}
/**
 * Holds dictation with Fn plus this key instead of Fn on its own. Null restores
 * the bare-Fn hold. Applied before the listener starts.
 */
function setGlobeHoldChord(code) {
    holdChordKeyCode = code;
}
/**
 * Fn plus this key is the hands-free shortcut, run by its own chord helper.
 * The Fn listener lets it through instead of treating Fn as a modifier, which
 * would cancel the recording hands-free is about to take over. Applied before
 * the listener starts.
 */
function setGlobeHandsFreeKey(code) {
    handsFreeKeyCode = code;
}
/** Virtual key codes that trigger polish while Fn is held. */
function setGlobePolishKeys(codes) {
    polishKeyCodes = [...codes];
    writeCommand(codes.length > 0 ? `POLISH ${codes.join(",")}` : "POLISH_NONE");
}
function restoreLeftoverFnUsage() {
    const statePath = getFnUsageStatePath();
    if (!(0, fs_1.existsSync)(statePath))
        return;
    (0, child_process_1.spawnSync)(getBinaryPath(), ["--globe-preference-state", statePath, "--restore-only"], { stdio: "ignore" });
}
function getFnUsageStatePath() {
    return path.join(electron_1.app.getPath("userData"), "globe-fn-usage.json");
}
function scheduleUnexpectedRestart() {
    if (restartCount >= MAX_RESTART_ATTEMPTS) {
        electron_log_1.default.error(`[GlobeKeyListener] Exhausted ${MAX_RESTART_ATTEMPTS} restart attempts, giving up`);
        restoreLeftoverFnUsage();
        return;
    }
    restartCount++;
    electron_log_1.default.warn(`[GlobeKeyListener] Unexpected exit, restarting (attempt ${restartCount}/${MAX_RESTART_ATTEMPTS})`);
    setTimeout(() => {
        if (!isStopping && !listenerProcess)
            spawnListener();
    }, RESTART_DELAY_MS);
}
function spawnListener() {
    if (listenerProcess)
        return;
    // Wait for the previous helper to restore Globe before starting another.
    if (dyingProcess && dyingProcess.exitCode === null) {
        queuedStart = true;
        return;
    }
    dyingProcess = null;
    queuedStart = false;
    const child = (0, child_process_1.spawn)(getBinaryPath(), [
        "--globe-preference-state",
        getFnUsageStatePath(),
        ...(polishOnly ? ["--polish-only"] : []),
    ], {
        stdio: ["pipe", "pipe", "pipe"],
    });
    listenerProcess = child;
    applyListenerState();
    if (restartResetTimer)
        clearTimeout(restartResetTimer);
    restartResetTimer = setTimeout(() => {
        restartResetTimer = null;
        restartCount = 0;
    }, RESTART_RESET_MS);
    const lines = readline.createInterface({ input: child.stdout });
    lines.on("line", (line) => {
        const trimmed = line.trim();
        if (trimmed === "FN_DOWN")
            callbacks?.onDown();
        else if (trimmed === "FN_UP")
            callbacks?.onUp();
        else if (trimmed === "FN_DOUBLE_TAP")
            callbacks?.onDoubleTap?.();
        else if (trimmed === "SHIFT_DOWN")
            callbacks?.onShiftChange(true);
        else if (trimmed === "SHIFT_UP")
            callbacks?.onShiftChange(false);
        else if (trimmed === "FN_POLISH")
            callbacks?.onPolish?.();
        else if (trimmed === "FN_INTERRUPTED")
            callbacks?.onInterrupted();
        else if (trimmed === "FN_MODIFIER_USED")
            callbacks?.onModifierUsed?.();
        else if (trimmed === "FN_CAPTURE_DOWN")
            broadcastToWindows("dictation:capture-fn", true);
        else if (trimmed === "FN_CAPTURE_UP")
            broadcastToWindows("dictation:capture-fn", false);
        else if (trimmed.startsWith("FN_CHORD ")) {
            const code = Number.parseInt(trimmed.slice("FN_CHORD ".length), 10);
            if (Number.isInteger(code))
                broadcastToWindows("dictation:capture-fn-chord", code);
        }
        else {
            const mouse = (0, hotkey_mouse_1.parseCaptureMouseLine)(trimmed);
            if (mouse)
                (0, capture_mouse_broadcast_1.broadcastCaptureMouse)(mouse.button, mouse.down, mouse.flags);
        }
    });
    child.stderr?.on("data", (chunk) => electron_log_1.default.error("[GlobeKeyListener]", chunk.toString().trim()));
    child.on("error", (err) => electron_log_1.default.error("[GlobeKeyListener] Failed to start:", err));
    child.on("exit", (code, signal) => {
        electron_log_1.default.info("[GlobeKeyListener] Exited", { code, signal });
        if (listenerProcess === child)
            listenerProcess = null;
        if (dyingProcess === child)
            dyingProcess = null;
        if (restartResetTimer) {
            clearTimeout(restartResetTimer);
            restartResetTimer = null;
        }
        if (queuedStart && !isStopping && !listenerProcess) {
            spawnListener();
            return;
        }
        if (isStopping || signal === "SIGTERM" || signal === "SIGINT") {
            restoreLeftoverFnUsage();
            return;
        }
        scheduleUnexpectedRestart();
    });
}
/**
 * Starts the native Globe/Fn key listener. The helper swallows Fn and sets
 * Globe to Do Nothing so macOS does not switch input source. Recording starts
 * on press. Hold and release stops. A brief tap cancels unless a second tap
 * latches hands-free. There's no Electron globalShortcut equivalent for this
 * key. See native-globe-macos/macos-globe-listener.swift. With `polishOnly`
 * the helper only acts on Fn chords, and Fn and Globe keep working as usual.
 */
function startGlobeKeyListener(cb, options = {}) {
    if (listenerProcess)
        return;
    callbacks = cb;
    polishOnly = options.polishOnly ?? false;
    isStopping = false;
    // A start after Accessibility is granted must not inherit the failed-tap budget.
    restartCount = 0;
    spawnListener();
}
function isGlobeKeyListenerRunning() {
    return listenerProcess !== null;
}
/** The running listener only watches polish and leaves Globe alone. */
function isGlobeListenerPolishOnly() {
    return listenerProcess !== null && polishOnly;
}
function stopGlobeKeyListener() {
    isStopping = true;
    queuedStart = false;
    if (restartResetTimer) {
        clearTimeout(restartResetTimer);
        restartResetTimer = null;
    }
    if (!listenerProcess) {
        restoreLeftoverFnUsage();
        return;
    }
    dyingProcess = listenerProcess;
    listenerProcess.kill();
    listenerProcess = null;
    captureModeEnabled = false;
}
//# sourceMappingURL=globe-key-listener.js.map
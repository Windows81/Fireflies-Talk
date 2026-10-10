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
exports.parseDockStripLine = parseDockStripLine;
exports.watchDockStrip = watchDockStrip;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const BINARY_NAME = "macos-dock-watcher";
function getBinaryPath() {
    return electron_1.app.isPackaged
        ? path.join(process.resourcesPath, "bin", BINARY_NAME)
        : path.join(__dirname, "..", "..", "..", "resources", "bin", BINARY_NAME);
}
function parseDockStripLine(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "null")
        return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (!isDockStrip(parsed))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
function isDockStrip(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const rect = value;
    return (typeof rect.x === "number" &&
        typeof rect.y === "number" &&
        typeof rect.width === "number" &&
        typeof rect.height === "number");
}
let missingBinaryLogged = false;
const RESTART_DELAY_MS = 2000;
const MAX_RESTARTS = 5;
/**
 * Streams the Dock strip's position while something on screen depends on it
 * (see native-dock-macos/macos-dock-watcher.swift). Reports null whenever the
 * strip is unknown so callers fall back to `display.workArea`. Returns a stop
 * function; a no-op off macOS or when the helper has not been built.
 */
function watchDockStrip(onChange) {
    if (process.platform !== "darwin")
        return () => { };
    const binary = getBinaryPath();
    if (!(0, fs_1.existsSync)(binary)) {
        if (!missingBinaryLogged) {
            electron_log_1.default.warn(`[DictationPill] Dock watcher missing at ${binary}`);
            missingBinaryLogged = true;
        }
        return () => { };
    }
    let child = null;
    let stopped = false;
    let restarts = 0;
    let restartTimer = null;
    // A helper that dies (crash, kill) is relaunched a few times so Dock tracking
    // survives without waiting for the pill to be hidden and shown again.
    const scheduleRestart = () => {
        if (stopped || restarts >= MAX_RESTARTS)
            return;
        restarts += 1;
        restartTimer = setTimeout(start, RESTART_DELAY_MS);
    };
    function start() {
        restartTimer = null;
        const proc = (0, child_process_1.spawn)(binary, [], { stdio: ["pipe", "pipe", "ignore"] });
        child = proc;
        proc.on("error", (error) => {
            electron_log_1.default.warn("[DictationPill] Dock watcher failed:", error.message);
        });
        proc.on("exit", () => {
            if (child === proc)
                child = null;
            if (stopped)
                return;
            onChange(null);
            scheduleRestart();
        });
        if (proc.stdout) {
            readline
                .createInterface({ input: proc.stdout })
                .on("line", (line) => onChange(parseDockStripLine(line)));
        }
    }
    start();
    return () => {
        stopped = true;
        if (restartTimer)
            clearTimeout(restartTimer);
        onChange(null);
        if (!child)
            return;
        // Closing stdin asks the helper to exit; kill covers a wedged one.
        child.stdin?.end();
        const pending = child;
        setTimeout(() => {
            if (pending.exitCode === null)
                pending.kill();
        }, 500).unref();
        child = null;
    };
}
//# sourceMappingURL=dictation-pill-dock-watcher.js.map
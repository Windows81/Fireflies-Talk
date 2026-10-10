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
exports.startMacosChordListener = startMacosChordListener;
exports.stopMacosChordListener = stopMacosChordListener;
const child_process_1 = require("child_process");
const readline = __importStar(require("readline"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const BINARY_NAME = "macos-chord-listener";
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY_MS = 1000;
const RESTART_RESET_MS = 10000;
/** Hands-free and polish fire once on press; only action and dictation hold. */
const tracksHold = (role) => role === "action" || role === "dictation";
function getBinaryPath() {
    return electron_1.app.isPackaged
        ? path.join(process.resourcesPath, "bin", BINARY_NAME)
        : path.join(__dirname, "..", "..", "..", "resources", "bin", BINARY_NAME);
}
const slots = {
    action: emptySlot(),
    dictation: emptySlot(),
    handsFree: emptySlot(),
    polish: emptySlot(),
};
function emptySlot() {
    return {
        actionHeld: false,
        args: [],
        callbacks: null,
        dictationHeld: false,
        isStopping: false,
        process: null,
        restartCount: 0,
        restartResetTimer: null,
    };
}
function spawnSlot(role) {
    const slot = slots[role];
    const child = (0, child_process_1.spawn)(getBinaryPath(), slot.args, {
        stdio: ["ignore", "pipe", "pipe"],
    });
    slot.process = child;
    if (slot.restartResetTimer)
        clearTimeout(slot.restartResetTimer);
    slot.restartResetTimer = setTimeout(() => {
        slot.restartResetTimer = null;
        slot.restartCount = 0;
    }, RESTART_RESET_MS);
    const lines = readline.createInterface({ input: child.stdout });
    lines.on("line", (line) => {
        const trimmed = line.trim();
        const cb = slot.callbacks;
        if (trimmed === "KEY_DOWN") {
            if (role === "handsFree") {
                cb?.onHandsFreeDown?.();
            }
            else if (role === "polish") {
                cb?.onPolish?.();
            }
            else if (role === "action") {
                slot.actionHeld = true;
                cb?.onActionDown?.();
            }
            else {
                slot.dictationHeld = true;
                cb?.onDown();
            }
            return;
        }
        if (trimmed === "KEY_UP") {
            if (!tracksHold(role))
                return;
            if (role === "action") {
                slot.actionHeld = false;
                cb?.onActionUp?.();
            }
            else {
                slot.dictationHeld = false;
                cb?.onUp();
            }
            return;
        }
        // Action chord sharing the dictation helper's key (--action-mods).
        if (trimmed === "ACTION_DOWN") {
            slot.actionHeld = true;
            cb?.onActionDown?.();
        }
        else if (trimmed === "ACTION_UP") {
            slot.actionHeld = false;
            cb?.onActionUp?.();
        }
        else if (trimmed === "SHIFT_DOWN" && tracksHold(role))
            cb?.onShiftChange(true);
        else if (trimmed === "SHIFT_UP" && tracksHold(role))
            cb?.onShiftChange(false);
        // Polish already fired on press; it has no hold for a key to interrupt.
        else if (trimmed === "KEY_INTERRUPTED" && role !== "polish")
            cb?.onInterrupted();
    });
    child.stderr?.on("data", (chunk) => electron_log_1.default.error("[MacosChordListener]", chunk.toString().trim()));
    child.on("error", (err) => electron_log_1.default.error("[MacosChordListener] Failed to start:", err));
    child.on("exit", (code, signal) => {
        electron_log_1.default.info("[MacosChordListener] Exited", { code, role, signal });
        // stop+start can spawn a replacement before this process exits. Only
        // the current child may clear the slot, or the replacement is leaked.
        if (slot.process !== child)
            return;
        slot.process = null;
        const dictationHeld = slot.dictationHeld;
        const actionHeld = slot.actionHeld;
        slot.dictationHeld = false;
        slot.actionHeld = false;
        if (!slot.isStopping) {
            if (dictationHeld)
                slot.callbacks?.onUp();
            if (actionHeld)
                slot.callbacks?.onActionUp?.();
        }
        if (slot.restartResetTimer) {
            clearTimeout(slot.restartResetTimer);
            slot.restartResetTimer = null;
        }
        if (slot.isStopping || signal === "SIGTERM")
            return;
        if (code !== 0) {
            electron_log_1.default.error("[MacosChordListener] Unexpected non-zero exit, not restarting");
            return;
        }
        if (slot.restartCount < MAX_RESTART_ATTEMPTS) {
            slot.restartCount++;
            electron_log_1.default.warn(`[MacosChordListener] Unexpected exit, restarting (attempt ${slot.restartCount}/${MAX_RESTART_ATTEMPTS})`);
            setTimeout(() => {
                if (!slot.isStopping && !slot.process)
                    spawnSlot(role);
            }, RESTART_DELAY_MS);
        }
    });
}
function startMacosChordListener(role, cb, args) {
    const slot = slots[role];
    if (slot.process)
        return;
    slot.callbacks = cb;
    slot.args = args;
    slot.isStopping = false;
    slot.dictationHeld = false;
    slot.actionHeld = false;
    slot.restartCount = 0;
    spawnSlot(role);
}
function stopMacosChordListener(role) {
    const roles = role
        ? [role]
        : ["action", "dictation", "handsFree", "polish"];
    for (const next of roles) {
        const slot = slots[next];
        slot.isStopping = true;
        slot.dictationHeld = false;
        slot.actionHeld = false;
        if (slot.restartResetTimer) {
            clearTimeout(slot.restartResetTimer);
            slot.restartResetTimer = null;
        }
        slot.process?.kill();
        slot.process = null;
    }
}
//# sourceMappingURL=macos-chord-listener.js.map
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
exports.getWindowsPasteTargetHwnd = void 0;
exports.startWindowsKeyListener = startWindowsKeyListener;
exports.stopWindowsKeyListener = stopWindowsKeyListener;
exports.isWindowsKeyListenerRunning = isWindowsKeyListenerRunning;
exports.setWindowsCaptureMode = setWindowsCaptureMode;
const child_process_1 = require("child_process");
const readline = __importStar(require("readline"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const windows_listener_lines_1 = require("./windows-listener-lines");
const windows_listener_supervisor_1 = require("./windows-listener-supervisor");
var windows_listener_lines_2 = require("./windows-listener-lines");
Object.defineProperty(exports, "getWindowsPasteTargetHwnd", { enumerable: true, get: function () { return windows_listener_lines_2.getWindowsPasteTargetHwnd; } });
const BINARY_NAME = "windows-key-listener.exe";
const TAG = "[WindowsKeyListener]";
function getBinaryPath() {
    return electron_1.app.isPackaged
        ? path.join(process.resourcesPath, "bin", BINARY_NAME)
        : path.join(__dirname, "..", "..", "..", "resources", "bin", BINARY_NAME);
}
let current = null;
/** Killed children whose exit event has not fired yet. */
const retiring = new Set();
let generation = 0;
let callbacks = null;
let listenerArgs = ["--dictation=Ctrl+Win"];
let captureModeEnabled = false;
let wantRunning = false;
let supervisor = (0, windows_listener_supervisor_1.initialSupervisorState)();
let restartTimer = null;
let heartbeatTimer = null;
let retireDeadline = null;
let lastHeartbeatCheckAt = 0;
function clearRestartTimer() {
    if (!restartTimer)
        return;
    clearTimeout(restartTimer);
    restartTimer = null;
}
function stopHeartbeatWatch() {
    if (!heartbeatTimer)
        return;
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
}
function writeCaptureMode(child) {
    const stdin = child.process.stdin;
    if (!stdin || stdin.destroyed)
        return;
    stdin.write(captureModeEnabled ? "CAPTURE_ON\n" : "CAPTURE_OFF\n");
}
function killChild(child, reason) {
    if (child.exited || child.process.killed)
        return;
    electron_log_1.default.info(`${TAG} Stopping helper`, { generation: child.generation, reason });
    child.process.kill();
}
function checkHeartbeat() {
    const child = current;
    if (!child)
        return;
    const now = Date.now();
    const sinceLastCheck = now - lastHeartbeatCheckAt;
    lastHeartbeatCheckAt = now;
    // Our own event loop was stalled: buffered helper lines have not been read
    // yet, so their absence proves nothing. Judge on the next tick instead.
    if (sinceLastCheck > windows_listener_supervisor_1.HEARTBEAT_CHECK_INTERVAL_MS * 2)
        return;
    if (child.restartRequestedAt != null) {
        if (now - child.restartRequestedAt < windows_listener_supervisor_1.RETIRE_GRACE_MS)
            return;
        electron_log_1.default.warn(`${TAG} Helper did not exit after kill, abandoning it`, {
            generation: child.generation,
        });
        retireCurrent("unresponsive");
        scheduleRestart("stopped responding");
        return;
    }
    if (!(0, windows_listener_supervisor_1.isHeartbeatStale)(child.lastLineAt, now)) {
        if ((0, windows_listener_supervisor_1.hasStableUptime)(child.spawnedAt, now)) {
            supervisor = (0, windows_listener_supervisor_1.markStable)(supervisor);
        }
        return;
    }
    electron_log_1.default.warn(`${TAG} Heartbeat lost, restarting helper`, {
        generation: child.generation,
        silentMs: now - child.lastLineAt,
    });
    child.restartRequestedAt = now;
    killChild(child, "heartbeat");
}
function startHeartbeatWatch() {
    stopHeartbeatWatch();
    lastHeartbeatCheckAt = Date.now();
    heartbeatTimer = setInterval(checkHeartbeat, windows_listener_supervisor_1.HEARTBEAT_CHECK_INTERVAL_MS);
}
function scheduleRestart(reason) {
    if (!wantRunning || restartTimer || retireDeadline || current)
        return;
    const plan = (0, windows_listener_supervisor_1.planRestart)(supervisor, Date.now());
    supervisor = plan.state;
    electron_log_1.default.warn(`${TAG} Helper ${reason}, restarting`, {
        attempt: supervisor.consecutiveFailures,
        delayMs: plan.delayMs,
    });
    restartTimer = setTimeout(() => {
        restartTimer = null;
        spawnWhenRetired();
    }, plan.delayMs);
}
function onChildExit(child, code, signal) {
    if (child.exited)
        return;
    child.exited = true;
    electron_log_1.default.info(`${TAG} Exited`, { code, generation: child.generation, signal });
    retiring.delete(child);
    if (current === child) {
        current = null;
        stopHeartbeatWatch();
    }
    const restartRequested = child.restartRequestedAt != null;
    const exit = { restartRequested, stoppedByUs: child.stoppedByUs };
    if ((0, windows_listener_supervisor_1.decideOnExit)(exit) === "restart") {
        scheduleRestart(restartRequested ? "stopped responding" : "exited unexpectedly");
    }
    if (retiring.size === 0 && retireDeadline) {
        clearTimeout(retireDeadline);
        retireDeadline = null;
        if (wantRunning && !current)
            spawnListener();
    }
}
function onChildLine(child, line) {
    // A retired helper may still flush its old shortcut while it dies.
    if (current !== child)
        return;
    child.lastLineAt = Date.now();
    const kind = (0, windows_listener_lines_1.applyListenerLine)(line.trim(), callbacks);
    if (kind !== "ready" || child.ready)
        return;
    child.ready = true;
    electron_log_1.default.info(`${TAG} Ready`, { generation: child.generation });
    if (captureModeEnabled)
        writeCaptureMode(child);
}
function spawnListener() {
    if (current || !wantRunning)
        return;
    clearRestartTimer();
    const now = Date.now();
    const child = {
        generation: ++generation,
        lastLineAt: now,
        process: (0, child_process_1.spawn)(getBinaryPath(), listenerArgs, {
            env: { ...process.env, FIREFLIES_ELECTRON_PID: String(process.pid) },
            stdio: ["pipe", "pipe", "pipe"],
        }),
        exited: false,
        forceKilled: false,
        ready: false,
        restartRequestedAt: null,
        spawnedAt: now,
        stoppedByUs: false,
    };
    current = child;
    electron_log_1.default.info(`${TAG} Spawned helper`, { generation: child.generation });
    const lines = readline.createInterface({ input: child.process.stdout });
    lines.on("line", (line) => onChildLine(child, line));
    child.process.stderr?.on("data", (chunk) => electron_log_1.default.error(TAG, chunk.toString().trim()));
    child.process.on("error", (err) => {
        electron_log_1.default.error(`${TAG} Helper error`, {
            generation: child.generation,
            message: err.message,
        });
        // A failed spawn never emits "exit"; account for it here.
        if (child.process.pid === undefined)
            onChildExit(child, null, null);
    });
    child.process.on("exit", (code, signal) => onChildExit(child, code, signal));
    startHeartbeatWatch();
}
/**
 * A killed child that has not reported its exit gets one forced termination
 * and another grace period. Only after that is it abandoned: a process that
 * survives TerminateProcess without ever exiting is wedged in the kernel and
 * cannot service its hooks either, so it must not keep the hotkey dead.
 */
function onRetireDeadline() {
    retireDeadline = null;
    for (const child of retiring) {
        if (!child.forceKilled) {
            child.forceKilled = true;
            electron_log_1.default.warn(`${TAG} Previous helper still exiting, forcing it out`, {
                generation: child.generation,
            });
            child.process.kill("SIGKILL");
            continue;
        }
        electron_log_1.default.error(`${TAG} Previous helper never reported its exit, abandoning it`, {
            generation: child.generation,
        });
        retiring.delete(child);
    }
    if (retiring.size > 0)
        armRetireDeadline();
    else
        spawnWhenRetired();
}
/** Bounds how long a killed child may linger without its exit event. */
function armRetireDeadline() {
    if (retireDeadline || retiring.size === 0)
        return;
    retireDeadline = setTimeout(onRetireDeadline, windows_listener_supervisor_1.RETIRE_GRACE_MS);
}
/**
 * Two helpers must never hold hooks at once: wait for the killed child to
 * exit first. Windows terminates it synchronously so this is normally a
 * single tick; the deadline only guards against a stuck exit event.
 */
function spawnWhenRetired() {
    if (current || !wantRunning)
        return;
    if (retiring.size === 0) {
        spawnListener();
        return;
    }
    armRetireDeadline();
}
function retireCurrent(reason) {
    const child = current;
    if (!child)
        return;
    current = null;
    stopHeartbeatWatch();
    child.stoppedByUs = true;
    retiring.add(child);
    killChild(child, reason);
}
/** Starts a push-to-talk listener for dictation and optional action chords. */
function startWindowsKeyListener(cb, args) {
    callbacks = cb;
    listenerArgs = args;
    wantRunning = true;
    retireCurrent("restart with new arguments");
    clearRestartTimer();
    spawnWhenRetired();
}
function stopWindowsKeyListener() {
    wantRunning = false;
    clearRestartTimer();
    (0, windows_listener_lines_1.clearWindowsPasteTargetHwnd)();
    retireCurrent("stop");
    armRetireDeadline();
}
/** True while a helper is running or a restart is pending. */
function isWindowsKeyListenerRunning() {
    return wantRunning;
}
/**
 * Swallow Win while settings records a shortcut. Pairing is handled natively.
 * The flag is remembered so a helper restart mid-capture re-applies it.
 */
function setWindowsCaptureMode(enabled) {
    captureModeEnabled = enabled;
    if (!current) {
        if (enabled && !wantRunning) {
            electron_log_1.default.warn(`${TAG} Capture mode requested with no listener`);
        }
        return;
    }
    if (current.ready)
        writeCaptureMode(current);
}
//# sourceMappingURL=windows-key-listener.js.map
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
exports.snapshotMacosPasteTarget = snapshotMacosPasteTarget;
exports.pasteViaMacosHelper = pasteViaMacosHelper;
exports.probeMacosPasteTarget = probeMacosPasteTarget;
exports.copyViaMacosHelper = copyViaMacosHelper;
exports.prewarmMacosPasteHelper = prewarmMacosPasteHelper;
exports.stopMacosPasteHelper = stopMacosPasteHelper;
const child_process_1 = require("child_process");
const readline_1 = require("readline");
const path = __importStar(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_paste_target_1 = require("./dictation-paste-target");
const BINARY_NAME = "macos-fast-paste";
const READY_TIMEOUT_MS = 3000;
const PASTE_TIMEOUT_MS = 1000;
let helper = null;
let helperBoot = null;
let lineReader = null;
let pendingCommand = null;
let commandTail = Promise.resolve();
let inFlightPaste = null;
function getBinaryPath() {
    return electron_1.app.isPackaged
        ? path.join(process.resourcesPath, "bin", BINARY_NAME)
        : path.join(__dirname, "..", "..", "..", "resources", "bin", BINARY_NAME);
}
function rejectPending(error) {
    if (!pendingCommand)
        return;
    clearTimeout(pendingCommand.timer);
    const { resolve, reject, posted } = pendingCommand;
    pendingCommand = null;
    // Cmd+V already went out — treat as success so the caller does not retry.
    if (posted) {
        electron_log_1.default.warn(`[Dictation] ${BINARY_NAME} ended after posting: ${error.message}`);
        resolve(dictation_paste_target_1.UNKNOWN_PASTE_TARGET);
        return;
    }
    reject(error);
}
function handleResponseLine(line) {
    if (!pendingCommand)
        return;
    clearTimeout(pendingCommand.timer);
    const { resolve, reject, posted } = pendingCommand;
    pendingCommand = null;
    const probe = (0, dictation_paste_target_1.parsePasteAck)(line);
    if (!probe) {
        reject(new Error(`${BINARY_NAME} failed: ${line.trim()}`));
        return;
    }
    // Only a helper built before PASTE reported a verdict answers a bare OK.
    if (posted && probe === dictation_paste_target_1.UNKNOWN_PASTE_TARGET) {
        electron_log_1.default.warn(`[Dictation] ${BINARY_NAME} answered PASTE without a target verdict; rebuild it with npm run build:macos-fast-paste`);
    }
    resolve(probe);
}
function startHelper() {
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)(getBinaryPath(), [], {
            stdio: ["pipe", "pipe", "pipe"],
            env: {
                ...process.env,
                FIREFLIES_ELECTRON_PID: String(process.pid),
            },
        });
        let settled = false;
        const readyTimer = setTimeout(() => {
            failBoot(new Error(`${BINARY_NAME} failed to become ready`));
            proc.kill();
        }, READY_TIMEOUT_MS);
        const failBoot = (error) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(readyTimer);
            reject(error);
        };
        proc.on("error", failBoot);
        proc.stderr?.on("data", (chunk) => {
            electron_log_1.default.warn(`[Dictation] ${BINARY_NAME} stderr: ${chunk.toString().trim()}`);
        });
        proc.on("exit", (code) => {
            helper = null;
            helperBoot = null;
            commandTail = Promise.resolve();
            lineReader?.close();
            lineReader = null;
            if (!settled) {
                failBoot(code === 2
                    ? new Error("Accessibility permission not granted")
                    : new Error(`${BINARY_NAME} exited during startup (code ${code})`));
                return;
            }
            rejectPending(new Error(`${BINARY_NAME} exited unexpectedly (code ${code})`));
        });
        if (!proc.stdout) {
            failBoot(new Error(`${BINARY_NAME} stdout unavailable`));
            return;
        }
        lineReader = (0, readline_1.createInterface)({ input: proc.stdout });
        lineReader.once("line", (line) => {
            if (line.trim() !== "READY") {
                failBoot(new Error(`${BINARY_NAME} failed to start: ${line}`));
                proc.kill();
                return;
            }
            settled = true;
            clearTimeout(readyTimer);
            helper = proc;
            lineReader?.on("line", handleResponseLine);
            resolve();
        });
    });
}
function ensureHelperReady() {
    if (!helperBoot) {
        helperBoot = startHelper().catch((error) => {
            helperBoot = null;
            throw error;
        });
    }
    return helperBoot;
}
function enqueueCommand(command) {
    const task = commandTail.then(() => dispatchCommand(command));
    commandTail = task.catch(() => undefined);
    return task;
}
function dispatchCommand(command) {
    const stdin = helper?.stdin;
    if (!stdin) {
        return Promise.reject(new Error(`${BINARY_NAME} helper is not available`));
    }
    const treatTimeoutAsSuccess = command === "PASTE" || command === "PASTE_FRONT";
    return new Promise((resolve, reject) => {
        pendingCommand = {
            resolve,
            reject,
            posted: false,
            timer: setTimeout(() => {
                if (!pendingCommand)
                    return;
                const { posted } = pendingCommand;
                pendingCommand = null;
                // PASTE was already written — Cmd+V almost certainly landed. Treating
                // a missed ACK as failure would make the caller retry and paste twice.
                if (posted && treatTimeoutAsSuccess) {
                    electron_log_1.default.warn(`[Dictation] ${BINARY_NAME} ACK timed out after posting`);
                    resolve(dictation_paste_target_1.UNKNOWN_PASTE_TARGET);
                    return;
                }
                reject(new Error(`${BINARY_NAME} ${command.toLowerCase()} timed out`));
            }, PASTE_TIMEOUT_MS),
        };
        stdin.write(`${command}\n`, (error) => {
            if (!error || !pendingCommand)
                return;
            clearTimeout(pendingCommand.timer);
            pendingCommand = null;
            reject(error);
        });
        if (pendingCommand)
            pendingCommand.posted = treatTimeoutAsSuccess;
    });
}
/** Remember the frontmost app so paste can restore it after a pill stop-click. */
function snapshotMacosPasteTarget() {
    if (process.platform !== "darwin")
        return;
    void ensureHelperReady()
        .then(() => enqueueCommand("SNAPSHOT"))
        .catch((error) => {
        electron_log_1.default.warn(`[Dictation] Failed to snapshot paste target:`, error);
    });
}
/**
 * Posts Cmd+V via the warm macos-fast-paste helper. Starts the helper on first
 * use and keeps it alive for subsequent pastes. Concurrent callers share the
 * in-flight paste so a retry cannot post a second Cmd+V. Resolves with the
 * helper's paste-target verdict (unknown when it could not answer in time).
 *
 * `targetHasKeys` is true when no Fireflies window held keyboard focus, so the
 * app being pasted into already receives keystrokes and the helper need not
 * confirm it first.
 */
function pasteViaMacosHelper(targetHasKeys) {
    if (!inFlightPaste) {
        inFlightPaste = (async () => {
            await ensureHelperReady();
            return enqueueCommand(targetHasKeys ? "PASTE_FRONT" : "PASTE");
        })().finally(() => {
            inFlightPaste = null;
        });
    }
    return inFlightPaste;
}
/**
 * Re-reads the focused element's verdict without posting a keystroke. Only
 * meaningful while the helper is warm; rejects otherwise so the caller keeps
 * the verdict it already has.
 */
function probeMacosPasteTarget() {
    if (!helper) {
        return Promise.reject(new Error(`${BINARY_NAME} helper is not running`));
    }
    return enqueueCommand("PROBE");
}
/**
 * Simulates Cmd+C via CGEvent with .privateState so the physical Fn modifier
 * does not leak into the synthetic event (osascript's System Events merges it).
 */
async function copyViaMacosHelper() {
    await ensureHelperReady();
    await enqueueCommand("COPY");
}
/** Pre-spawns the helper so the first paste doesn't pay startup cost. */
function prewarmMacosPasteHelper() {
    if (process.platform !== "darwin")
        return;
    void ensureHelperReady().catch((error) => {
        electron_log_1.default.warn(`[Dictation] Failed to prewarm ${BINARY_NAME}:`, error);
    });
}
function stopMacosPasteHelper() {
    rejectPending(new Error(`${BINARY_NAME} helper stopped`));
    commandTail = Promise.resolve();
    const proc = helper;
    helper = null;
    helperBoot = null;
    lineReader?.close();
    lineReader = null;
    if (!proc)
        return;
    try {
        proc.stdin?.write("QUIT\n");
    }
    catch {
        // Process may already be gone.
    }
    proc.kill();
}
//# sourceMappingURL=macos-paste-helper.js.map
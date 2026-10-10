"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pasteViaWindowsHelper = pasteViaWindowsHelper;
exports.probeWindowsPasteTarget = probeWindowsPasteTarget;
exports.copyViaWindowsHelper = copyViaWindowsHelper;
exports.warmWindowsPasteTarget = warmWindowsPasteTarget;
exports.prewarmWindowsPasteHelper = prewarmWindowsPasteHelper;
exports.stopWindowsPasteHelper = stopWindowsPasteHelper;
const child_process_1 = require("child_process");
const readline_1 = require("readline");
const electron_log_1 = __importDefault(require("electron-log"));
const resource_bin_1 = require("./resource-bin");
const windows_paste_protocol_1 = require("./windows-paste-protocol");
const dictation_paste_target_1 = require("./dictation-paste-target");
const BINARY_NAME = "windows-fast-paste.exe";
const READY_TIMEOUT_MS = 3000;
const PASTE_TIMEOUT_MS = 1000;
let helper = null;
// The child that is still booting (spawned but not yet READY). Tracked so a
// stop during startup can kill it: `helper` is only set once READY arrives.
let bootingProc = null;
// Bumped by every start and every stop. A boot whose generation is stale when
// READY arrives was cancelled (dictation disabled mid-startup) and is killed
// instead of adopted, so no helper lingers without Talk access.
let currentGeneration = 0;
let helperBoot = null;
let lineReader = null;
let pendingCommand = null;
let commandTail = Promise.resolve();
let inFlightPaste = null;
function rejectPending(error) {
    if (!pendingCommand)
        return;
    clearTimeout(pendingCommand.timer);
    const { resolve, reject, posted } = pendingCommand;
    pendingCommand = null;
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
    const { resolve, reject } = pendingCommand;
    pendingCommand = null;
    const probe = (0, dictation_paste_target_1.parsePasteAck)(line);
    if (probe)
        resolve(probe);
    else
        reject(new Error(`${BINARY_NAME} failed: ${line.trim()}`));
}
function startHelper() {
    return new Promise((resolve, reject) => {
        const generation = ++currentGeneration;
        const proc = (0, child_process_1.spawn)((0, resource_bin_1.resourcesBinPath)(BINARY_NAME), [], {
            stdio: ["pipe", "pipe", "pipe"],
            windowsHide: true,
        });
        bootingProc = proc;
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
            if (bootingProc === proc)
                bootingProc = null;
            // A stop (or a newer boot) has moved on. Settle this boot now so its
            // ready-timer cannot linger and later reject, and do not clobber the
            // newer boot's state.
            if (generation !== currentGeneration) {
                failBoot(new Error(`${BINARY_NAME} start cancelled`));
                return;
            }
            helper = null;
            helperBoot = null;
            commandTail = Promise.resolve();
            lineReader?.close();
            lineReader = null;
            if (!settled) {
                failBoot(new Error(`${BINARY_NAME} exited during startup (code ${code})`));
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
            // Dictation was disabled (or restarted) while this child was booting:
            // kill it rather than adopt it, so no helper survives without Talk.
            if (generation !== currentGeneration) {
                proc.kill();
                failBoot(new Error(`${BINARY_NAME} start cancelled`));
                return;
            }
            settled = true;
            clearTimeout(readyTimer);
            helper = proc;
            bootingProc = null;
            lineReader?.on("line", handleResponseLine);
            resolve();
        });
    });
}
function ensureHelperReady() {
    if (!helperBoot) {
        const boot = startHelper().catch((error) => {
            // Only a still-current boot may clear helperBoot; a cancelled or
            // superseded boot must not null the promise a newer boot installed.
            if (helperBoot === boot)
                helperBoot = null;
            throw error;
        });
        helperBoot = boot;
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
    // PASTE and COPY both post a keystroke before the helper's ACK, so a lost
    // ACK must resolve (the keystroke already fired) rather than reject and undo
    // a copy that already updated the clipboard.
    const treatTimeoutAsSuccess = command.startsWith("PASTE") || command.startsWith("COPY");
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
                const disposition = (0, windows_paste_protocol_1.pasteAckTimeout)(posted);
                if (disposition.recycleHelper)
                    stopWindowsPasteHelper();
                if (disposition.treatAsSuccess) {
                    electron_log_1.default.warn(`[Dictation] ${BINARY_NAME} ACK timed out after posting`);
                    resolve(dictation_paste_target_1.UNKNOWN_PASTE_TARGET);
                    return;
                }
                reject(new Error(`${BINARY_NAME} paste timed out`));
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
/**
 * Posts Ctrl+V via the warm windows-fast-paste helper. Starts the helper on
 * first use and keeps it alive so later pastes do not pay process spawn.
 * Concurrent callers share the in-flight paste so a retry cannot post twice.
 * Resolves with the helper's paste-target verdict (unknown when it could not
 * answer in time).
 */
function pasteViaWindowsHelper(hwnd) {
    if (!inFlightPaste) {
        inFlightPaste = (async () => {
            await ensureHelperReady();
            return enqueueCommand((0, windows_paste_protocol_1.formatWindowsPasteCommand)(hwnd));
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
function probeWindowsPasteTarget(hwnd) {
    if (!helper) {
        return Promise.reject(new Error(`${BINARY_NAME} helper is not running`));
    }
    return enqueueCommand((0, windows_paste_protocol_1.formatWindowsProbeCommand)(hwnd));
}
/**
 * Posts Ctrl+C to the foreground window so its selection lands on the
 * clipboard. Rejects when the helper could not post it (nothing was copied).
 */
async function copyViaWindowsHelper() {
    await ensureHelperReady();
    await enqueueCommand((0, windows_paste_protocol_1.formatWindowsCopyCommand)());
}
/**
 * Reads the focused element once at recording start, so the paste does not
 * pay for the first UI Automation read of the app in front.
 */
function warmWindowsPasteTarget() {
    if (!helper)
        return;
    void enqueueCommand((0, windows_paste_protocol_1.formatWindowsWarmCommand)()).catch((error) => {
        electron_log_1.default.warn(`[Dictation] Failed to warm the paste target:`, error);
    });
}
function prewarmWindowsPasteHelper() {
    if (process.platform !== "win32")
        return;
    void ensureHelperReady().catch((error) => {
        electron_log_1.default.warn(`[Dictation] Failed to prewarm ${BINARY_NAME}:`, error);
    });
}
function stopWindowsPasteHelper() {
    // Cancel any in-flight boot so a late READY cannot adopt its child.
    currentGeneration++;
    rejectPending(new Error(`${BINARY_NAME} helper stopped`));
    commandTail = Promise.resolve();
    // Kill the ready helper, or the one still booting if READY has not arrived.
    const proc = helper ?? bootingProc;
    helper = null;
    bootingProc = null;
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
//# sourceMappingURL=windows-paste-helper.js.map
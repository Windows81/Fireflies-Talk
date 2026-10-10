"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_GUARD_GRACE_MS = exports.COMMAND_PROCESSING_CEILING_MS = exports.DICTATE_PROCESSING_CEILING_MS = void 0;
exports.processingCeilingMs = processingCeilingMs;
exports.createDictationSessionGuard = createDictationSessionGuard;
exports.createDictationSessionGuardWith = createDictationSessionGuardWith;
/**
 * Mirrors the renderer's own processing ceilings
 * (DICTATION_PROCESSING_TIMEOUT_MS / COMMAND_MAX_TIMEOUT_MS in
 * src/hooks/dictationCommandTimeout.ts). The renderer always settles within
 * these, so a session still "processing" past them has lost its `idle` report.
 */
exports.DICTATE_PROCESSING_CEILING_MS = 120000;
exports.COMMAND_PROCESSING_CEILING_MS = 900000;
exports.SESSION_GUARD_GRACE_MS = 30000;
function processingCeilingMs(mode) {
    return mode === "command"
        ? exports.COMMAND_PROCESSING_CEILING_MS
        : exports.DICTATE_PROCESSING_CEILING_MS;
}
const realTimers = {
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle),
};
/**
 * Tracks the "a session is still finishing" gate that blocks new dictations,
 * and force-clears it if the renderer never reports `idle` — so one lost
 * message can never leave the hotkey ignored until the app restarts.
 */
function createDictationSessionGuard(onExpired) {
    return createDictationSessionGuardWith(onExpired, realTimers);
}
function createDictationSessionGuardWith(onExpired, timers) {
    let busy = false;
    let rendererState = "idle";
    let blockedSince = null;
    let deadline = null;
    let timer = null;
    const clear = () => {
        if (timer != null)
            timers.clearTimer(timer);
        timer = null;
        deadline = null;
        blockedSince = null;
    };
    const expire = () => {
        const blockedMs = timers.now() - (blockedSince ?? timers.now());
        busy = false;
        rendererState = "idle";
        clear();
        onExpired(blockedMs);
    };
    /**
     * Arms the deadline for the current block, measured from when the block
     * began so repeated `processing` reports cannot push it out forever. It
     * only ever extends (a switch to the longer command ceiling).
     */
    const arm = (mode) => {
        const now = timers.now();
        if (blockedSince == null)
            blockedSince = now;
        const next = blockedSince + processingCeilingMs(mode) + exports.SESSION_GUARD_GRACE_MS;
        if (deadline != null && deadline >= next)
            return;
        if (timer != null)
            timers.clearTimer(timer);
        deadline = next;
        timer = timers.setTimer(expire, Math.max(0, next - now));
    };
    const blocked = () => busy || rendererState === "processing";
    return {
        isBusy: () => busy,
        rendererState: () => rendererState,
        lock: (mode) => {
            busy = true;
            arm(mode);
        },
        unlock: () => {
            busy = false;
            if (!blocked())
                clear();
        },
        onRendererState: (state, mode) => {
            rendererState = state;
            if (state === "idle") {
                busy = false;
                clear();
                return;
            }
            if (state === "processing")
                arm(mode);
        },
        reset: () => {
            busy = false;
            rendererState = "idle";
            clear();
        },
    };
}
//# sourceMappingURL=dictation-session-guard.js.map
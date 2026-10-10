"use strict";
/**
 * Pure restart/heartbeat policy for the Windows key-listener helper.
 * The spawn/kill side effects live in windows-key-listener.ts; everything
 * here is plain data so it can be unit tested.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialSupervisorState = exports.RETIRE_GRACE_MS = exports.MAX_RESTARTS_PER_WINDOW = exports.RESTART_WINDOW_MS = exports.RESTART_STABLE_UPTIME_MS = exports.RESTART_MAX_DELAY_MS = exports.RESTART_BASE_DELAY_MS = exports.HEARTBEAT_CHECK_INTERVAL_MS = exports.HEARTBEAT_TIMEOUT_MS = exports.HEARTBEAT_INTERVAL_MS = void 0;
exports.decideOnExit = decideOnExit;
exports.planRestart = planRestart;
exports.markStable = markStable;
exports.hasStableUptime = hasStableUptime;
exports.isHeartbeatStale = isHeartbeatStale;
/** Keep in sync with HEARTBEAT_INTERVAL_MS in windows-hook-keepalive.h. */
exports.HEARTBEAT_INTERVAL_MS = 15000;
/** Two missed heartbeats plus slack for a busy main thread. */
exports.HEARTBEAT_TIMEOUT_MS = exports.HEARTBEAT_INTERVAL_MS * 2 + 5000;
exports.HEARTBEAT_CHECK_INTERVAL_MS = 5000;
exports.RESTART_BASE_DELAY_MS = 500;
exports.RESTART_MAX_DELAY_MS = 60000;
/** A helper that stayed up this long is considered healthy again. */
exports.RESTART_STABLE_UPTIME_MS = 60000;
exports.RESTART_WINDOW_MS = 60 * 60 * 1000;
exports.MAX_RESTARTS_PER_WINDOW = 20;
/** How long a killed helper may take to report exit before we spawn anyway. */
exports.RETIRE_GRACE_MS = 2000;
const initialSupervisorState = () => ({
    consecutiveFailures: 0,
    restartTimes: [],
});
exports.initialSupervisorState = initialSupervisorState;
function decideOnExit(exit) {
    if (exit.stoppedByUs && !exit.restartRequested)
        return "ignore";
    return "restart";
}
function pruneWindow(times, now) {
    return times.filter((t) => now - t < exports.RESTART_WINDOW_MS);
}
function backoffDelay(consecutiveFailures) {
    const delay = exports.RESTART_BASE_DELAY_MS * 2 ** consecutiveFailures;
    return Math.min(delay, exports.RESTART_MAX_DELAY_MS);
}
/**
 * Exponential backoff, capped per delay and per hour. Beyond the hourly cap
 * the next attempt waits until the oldest restart leaves the window, so the
 * helper is never abandoned but can never spin either.
 */
function planRestart(state, now) {
    const inWindow = pruneWindow(state.restartTimes, now);
    let delayMs = backoffDelay(state.consecutiveFailures);
    if (inWindow.length >= exports.MAX_RESTARTS_PER_WINDOW) {
        const oldest = inWindow[0];
        delayMs = Math.max(delayMs, oldest + exports.RESTART_WINDOW_MS - now);
    }
    return {
        delayMs,
        state: {
            consecutiveFailures: state.consecutiveFailures + 1,
            restartTimes: [...inWindow, now],
        },
    };
}
/** Called when a child has run long enough to count as healthy. */
function markStable(state) {
    if (state.consecutiveFailures === 0)
        return state;
    return { ...state, consecutiveFailures: 0 };
}
function hasStableUptime(spawnedAt, now) {
    return now - spawnedAt >= exports.RESTART_STABLE_UPTIME_MS;
}
/** Any stdout line counts as a heartbeat, not just PING. */
function isHeartbeatStale(lastLineAt, now) {
    return now - lastLineAt > exports.HEARTBEAT_TIMEOUT_MS;
}
//# sourceMappingURL=windows-listener-supervisor.js.map
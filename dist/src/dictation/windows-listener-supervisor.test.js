"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const windows_listener_supervisor_1 = require("./windows-listener-supervisor");
(0, node_test_1.test)("intentional stop is ignored, everything else restarts", () => {
    strict_1.default.equal((0, windows_listener_supervisor_1.decideOnExit)({ restartRequested: false, stoppedByUs: true }), "ignore");
    strict_1.default.equal((0, windows_listener_supervisor_1.decideOnExit)({ restartRequested: false, stoppedByUs: false }), "restart");
    strict_1.default.equal((0, windows_listener_supervisor_1.decideOnExit)({ restartRequested: true, stoppedByUs: true }), "restart");
});
(0, node_test_1.test)("backoff doubles per consecutive failure and caps", () => {
    let state = (0, windows_listener_supervisor_1.initialSupervisorState)();
    const delays = [];
    for (let i = 0; i < 10; i++) {
        const plan = (0, windows_listener_supervisor_1.planRestart)(state, 1000000 + i * 1000);
        delays.push(plan.delayMs);
        state = plan.state;
    }
    strict_1.default.deepEqual(delays.slice(0, 5), [
        windows_listener_supervisor_1.RESTART_BASE_DELAY_MS,
        windows_listener_supervisor_1.RESTART_BASE_DELAY_MS * 2,
        windows_listener_supervisor_1.RESTART_BASE_DELAY_MS * 4,
        windows_listener_supervisor_1.RESTART_BASE_DELAY_MS * 8,
        windows_listener_supervisor_1.RESTART_BASE_DELAY_MS * 16,
    ]);
    strict_1.default.equal(delays[9], windows_listener_supervisor_1.RESTART_MAX_DELAY_MS);
    strict_1.default.equal(state.consecutiveFailures, 10);
});
(0, node_test_1.test)("hourly cap defers the next restart instead of giving up", () => {
    let state = (0, windows_listener_supervisor_1.initialSupervisorState)();
    const start = 5000000;
    for (let i = 0; i < windows_listener_supervisor_1.MAX_RESTARTS_PER_WINDOW; i++) {
        state = (0, windows_listener_supervisor_1.planRestart)(state, start + i).state;
        state = (0, windows_listener_supervisor_1.markStable)(state);
    }
    const plan = (0, windows_listener_supervisor_1.planRestart)(state, start + windows_listener_supervisor_1.MAX_RESTARTS_PER_WINDOW);
    const oldest = state.restartTimes[0];
    strict_1.default.ok(plan.delayMs > windows_listener_supervisor_1.RESTART_MAX_DELAY_MS);
    strict_1.default.equal(plan.delayMs, oldest + windows_listener_supervisor_1.RESTART_WINDOW_MS - (start + windows_listener_supervisor_1.MAX_RESTARTS_PER_WINDOW));
});
(0, node_test_1.test)("restarts older than the window are forgotten", () => {
    let state = (0, windows_listener_supervisor_1.initialSupervisorState)();
    for (let i = 0; i < windows_listener_supervisor_1.MAX_RESTARTS_PER_WINDOW; i++) {
        state = (0, windows_listener_supervisor_1.planRestart)(state, i).state;
    }
    state = (0, windows_listener_supervisor_1.markStable)(state);
    const later = windows_listener_supervisor_1.RESTART_WINDOW_MS + windows_listener_supervisor_1.MAX_RESTARTS_PER_WINDOW + 1;
    const plan = (0, windows_listener_supervisor_1.planRestart)(state, later);
    strict_1.default.equal(plan.delayMs, windows_listener_supervisor_1.RESTART_BASE_DELAY_MS);
    strict_1.default.equal(plan.state.restartTimes.length, 1);
});
(0, node_test_1.test)("a stable run resets backoff but not the hourly count", () => {
    let state = (0, windows_listener_supervisor_1.initialSupervisorState)();
    state = (0, windows_listener_supervisor_1.planRestart)(state, 0).state;
    state = (0, windows_listener_supervisor_1.planRestart)(state, 1).state;
    strict_1.default.equal(state.consecutiveFailures, 2);
    const stable = (0, windows_listener_supervisor_1.markStable)(state);
    strict_1.default.equal(stable.consecutiveFailures, 0);
    strict_1.default.equal(stable.restartTimes.length, 2);
    strict_1.default.equal((0, windows_listener_supervisor_1.markStable)(stable), stable);
});
(0, node_test_1.test)("stable uptime threshold", () => {
    strict_1.default.equal((0, windows_listener_supervisor_1.hasStableUptime)(0, windows_listener_supervisor_1.RESTART_STABLE_UPTIME_MS - 1), false);
    strict_1.default.equal((0, windows_listener_supervisor_1.hasStableUptime)(0, windows_listener_supervisor_1.RESTART_STABLE_UPTIME_MS), true);
});
(0, node_test_1.test)("heartbeat is stale only after two missed intervals", () => {
    strict_1.default.equal((0, windows_listener_supervisor_1.isHeartbeatStale)(0, windows_listener_supervisor_1.HEARTBEAT_TIMEOUT_MS), false);
    strict_1.default.equal((0, windows_listener_supervisor_1.isHeartbeatStale)(0, windows_listener_supervisor_1.HEARTBEAT_TIMEOUT_MS + 1), true);
});
//# sourceMappingURL=windows-listener-supervisor.test.js.map
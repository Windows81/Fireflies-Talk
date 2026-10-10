"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const system_media_resume_gate_1 = require("./system-media-resume-gate");
const FALLBACK_MS = 2000;
function harness() {
    let now = 1000;
    let nextHandle = 1;
    const timers = new Map();
    const resumes = [];
    const gate = (0, system_media_resume_gate_1.createMediaResumeGate)((trigger, waitedMs) => resumes.push({ trigger, waitedMs }), FALLBACK_MS, {
        clearTimer: (handle) => timers.delete(handle),
        now: () => now,
        setTimer: (fn) => {
            const handle = nextHandle++;
            timers.set(handle, fn);
            return handle;
        },
    });
    return {
        advance: (ms) => {
            now += ms;
        },
        fireTimers: () => {
            for (const fn of [...timers.values()])
                fn();
            timers.clear();
        },
        gate,
        pendingTimers: () => timers.size,
        resumes,
    };
}
(0, node_test_1.test)("resume waits for the microphone release after the hotkey release", () => {
    const h = harness();
    h.gate.onPressed();
    h.gate.onReleased();
    strict_1.default.equal(h.resumes.length, 0);
    h.advance(340);
    h.gate.onCaptureReleased();
    strict_1.default.deepEqual(h.resumes, [{ trigger: "capture-released", waitedMs: 340 }]);
    strict_1.default.equal(h.pendingTimers(), 0);
});
(0, node_test_1.test)("resume happens at once when capture was already released", () => {
    const h = harness();
    h.gate.onPressed();
    h.gate.onCaptureReleased();
    h.gate.onReleased();
    strict_1.default.deepEqual(h.resumes, [
        { trigger: "capture-already-released", waitedMs: 0 },
    ]);
});
(0, node_test_1.test)("resume falls back to a timer when the renderer never reports", () => {
    const h = harness();
    h.gate.onPressed();
    h.gate.onReleased();
    strict_1.default.equal(h.pendingTimers(), 1);
    h.advance(FALLBACK_MS);
    h.fireTimers();
    strict_1.default.deepEqual(h.resumes, [
        { trigger: "fallback-timeout", waitedMs: FALLBACK_MS },
    ]);
    h.gate.onCaptureReleased();
    strict_1.default.equal(h.resumes.length, 1);
});
(0, node_test_1.test)("a new press drops a pending resume so media stays paused", () => {
    const h = harness();
    h.gate.onPressed();
    h.gate.onReleased();
    h.gate.onPressed();
    strict_1.default.equal(h.pendingTimers(), 0);
    h.gate.onCaptureReleased();
    strict_1.default.equal(h.resumes.length, 0);
    h.gate.onReleased();
    strict_1.default.equal(h.resumes.length, 1);
    strict_1.default.equal(h.resumes[0].trigger, "capture-already-released");
});
(0, node_test_1.test)("a capture release from a previous session does not leak into the next", () => {
    const h = harness();
    h.gate.onPressed();
    h.gate.onReleased();
    h.gate.onCaptureReleased();
    h.gate.onPressed();
    h.gate.onReleased();
    strict_1.default.equal(h.resumes.length, 1);
    strict_1.default.equal(h.pendingTimers(), 1);
});
(0, node_test_1.test)("repeated releases while waiting do not schedule twice", () => {
    const h = harness();
    h.gate.onPressed();
    h.gate.onReleased();
    h.gate.onReleased();
    strict_1.default.equal(h.pendingTimers(), 1);
    h.gate.onCaptureReleased();
    strict_1.default.equal(h.resumes.length, 1);
});
//# sourceMappingURL=system-media-resume-gate.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_session_guard_1 = require("./dictation-session-guard");
function fakeClock() {
    let now = 0;
    const timers = new Set();
    const api = {
        now: () => now,
        setTimer: (fn, ms) => {
            const t = { at: now + ms, fn };
            timers.add(t);
            return t;
        },
        clearTimer: (handle) => {
            timers.delete(handle);
        },
    };
    const advance = (ms) => {
        now += ms;
        for (const t of [...timers].sort((a, b) => a.at - b.at)) {
            if (t.at > now)
                break;
            timers.delete(t);
            t.fn();
        }
    };
    return { advance, api, pending: () => timers.size };
}
(0, node_test_1.test)("a normal stop → processing → idle cycle never expires", () => {
    const clock = fakeClock();
    const expired = [];
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)((ms) => expired.push(ms), clock.api);
    guard.lock("dictate");
    strict_1.default.equal(guard.isBusy(), true);
    guard.onRendererState("processing", "dictate");
    clock.advance(5000);
    guard.onRendererState("idle", "dictate");
    strict_1.default.equal(guard.isBusy(), false);
    strict_1.default.equal(clock.pending(), 0);
    clock.advance(dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS * 2);
    strict_1.default.deepEqual(expired, []);
});
(0, node_test_1.test)("a lost idle report clears the lock after the dictate ceiling", () => {
    const clock = fakeClock();
    const expired = [];
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)((ms) => expired.push(ms), clock.api);
    guard.lock("dictate");
    guard.onRendererState("processing", "dictate");
    clock.advance(dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS + dictation_session_guard_1.SESSION_GUARD_GRACE_MS - 1);
    strict_1.default.equal(guard.isBusy(), true);
    clock.advance(1);
    strict_1.default.equal(guard.isBusy(), false);
    strict_1.default.equal(guard.rendererState(), "idle");
    strict_1.default.deepEqual(expired, [
        dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS + dictation_session_guard_1.SESSION_GUARD_GRACE_MS,
    ]);
});
(0, node_test_1.test)("command runs are given the longer ceiling", () => {
    const clock = fakeClock();
    let expired = 0;
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)(() => expired++, clock.api);
    guard.lock("command");
    clock.advance(dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS + dictation_session_guard_1.SESSION_GUARD_GRACE_MS);
    strict_1.default.equal(expired, 0);
    strict_1.default.equal(guard.isBusy(), true);
    clock.advance(dictation_session_guard_1.COMMAND_PROCESSING_CEILING_MS - dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS);
    strict_1.default.equal(expired, 1);
});
(0, node_test_1.test)("renderer reporting command mode extends a dictate deadline", () => {
    const clock = fakeClock();
    let expired = 0;
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)(() => expired++, clock.api);
    guard.lock("dictate");
    clock.advance(1000);
    guard.onRendererState("processing", "command");
    clock.advance(dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS + dictation_session_guard_1.SESSION_GUARD_GRACE_MS);
    strict_1.default.equal(expired, 0);
    guard.onRendererState("processing", "dictate");
    clock.advance(dictation_session_guard_1.COMMAND_PROCESSING_CEILING_MS);
    strict_1.default.equal(expired, 1);
});
(0, node_test_1.test)("repeated processing reports do not push the deadline out", () => {
    const clock = fakeClock();
    const expired = [];
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)((ms) => expired.push(ms), clock.api);
    const ceiling = dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS + dictation_session_guard_1.SESSION_GUARD_GRACE_MS;
    guard.lock("dictate");
    for (let elapsed = 0; elapsed < ceiling; elapsed += 10000) {
        guard.onRendererState("processing", "dictate");
        clock.advance(10000);
    }
    strict_1.default.equal(guard.isBusy(), false);
    strict_1.default.deepEqual(expired, [ceiling]);
});
(0, node_test_1.test)("renderer stuck in processing without a lock is also released", () => {
    const clock = fakeClock();
    let expired = 0;
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)(() => expired++, clock.api);
    guard.onRendererState("processing", "dictate");
    strict_1.default.equal(guard.rendererState(), "processing");
    clock.advance(dictation_session_guard_1.DICTATE_PROCESSING_CEILING_MS + dictation_session_guard_1.SESSION_GUARD_GRACE_MS);
    strict_1.default.equal(expired, 1);
    strict_1.default.equal(guard.rendererState(), "idle");
});
(0, node_test_1.test)("unlock keeps the deadline while the renderer still says processing", () => {
    const clock = fakeClock();
    let expired = 0;
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)(() => expired++, clock.api);
    guard.lock("dictate");
    guard.onRendererState("processing", "dictate");
    guard.unlock();
    strict_1.default.equal(guard.isBusy(), false);
    strict_1.default.equal(clock.pending(), 1);
    guard.onRendererState("idle", "dictate");
    strict_1.default.equal(clock.pending(), 0);
});
(0, node_test_1.test)("reset forgets a pending deadline", () => {
    const clock = fakeClock();
    let expired = 0;
    const guard = (0, dictation_session_guard_1.createDictationSessionGuardWith)(() => expired++, clock.api);
    guard.lock("dictate");
    guard.reset();
    strict_1.default.equal(guard.isBusy(), false);
    strict_1.default.equal(clock.pending(), 0);
    clock.advance(dictation_session_guard_1.COMMAND_PROCESSING_CEILING_MS * 2);
    strict_1.default.equal(expired, 0);
});
//# sourceMappingURL=dictation-session-guard.test.js.map
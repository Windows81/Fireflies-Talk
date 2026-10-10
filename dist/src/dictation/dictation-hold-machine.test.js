"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_hold_machine_1 = require("./dictation-hold-machine");
const apply = (state, result) => result.state;
const effectReason = (effect) => effect.type === "none" ? undefined : effect.reason;
(0, node_test_1.test)("hotkey down starts recording immediately", () => {
    const down = (0, dictation_hold_machine_1.onHotkeyDown)((0, dictation_hold_machine_1.initialDictationHoldState)(), "fn", 1000);
    strict_1.default.equal(down.effect.type, "start");
    strict_1.default.equal(down.state.recording, true);
    strict_1.default.equal(down.state.latched, false);
});
(0, node_test_1.test)("hands-free shortcut starts, latches, cools down, and stops", () => {
    const started = (0, dictation_hold_machine_1.onHandsFreeToggle)((0, dictation_hold_machine_1.initialDictationHoldState)(), 1000);
    strict_1.default.equal(effectReason(started.effect), "Hands-free shortcut — start");
    strict_1.default.equal(started.state.latched, true);
    strict_1.default.equal(started.state.recording, true);
    const cooling = { ...(0, dictation_hold_machine_1.initialDictationHoldState)(), lastStopAt: 1000 };
    const ignored = (0, dictation_hold_machine_1.onHandsFreeToggle)(cooling, 1000 + dictation_hold_machine_1.POST_STOP_COOLDOWN_MS - 1);
    strict_1.default.equal(effectReason(ignored.effect), "Ignored hands-free shortcut — cooldown active");
    strict_1.default.deepEqual(ignored.state, cooling);
    const active = {
        ...(0, dictation_hold_machine_1.initialDictationHoldState)(),
        keyDownAt: 1000,
        pendingDoubleTap: true,
        recording: true,
    };
    const latched = (0, dictation_hold_machine_1.onHandsFreeToggle)(active, 1200);
    strict_1.default.equal(effectReason(latched.effect), "Hands-free shortcut — keep going hands-free");
    strict_1.default.equal(latched.state.latched, true);
    strict_1.default.equal(latched.state.latchIgnoreNextUp, true);
    strict_1.default.equal(latched.state.pendingDoubleTap, false);
    strict_1.default.equal(latched.state.keyDownAt, 1200);
    strict_1.default.equal(latched.state.lastTapUpAt, 1200);
    const stopped = (0, dictation_hold_machine_1.onHandsFreeToggle)({ ...(0, dictation_hold_machine_1.initialDictationHoldState)(), latched: true, recording: true }, 2000);
    strict_1.default.equal(effectReason(stopped.effect), "Hands-free shortcut — stop");
    strict_1.default.equal(stopped.state.recording, false);
    strict_1.default.equal(stopped.state.lastStopAt, 2000);
});
(0, node_test_1.test)("hands-free start preserves a deferred Fn press", () => {
    const started = (0, dictation_hold_machine_1.onHandsFreeToggle)((0, dictation_hold_machine_1.initialDictationHoldState)(), 1000, true);
    strict_1.default.equal(started.effect.type, "start");
    strict_1.default.equal(started.state.latched, true);
    strict_1.default.equal(started.state.latchIgnoreNextUp, true);
    const released = (0, dictation_hold_machine_1.onHotkeyUp)(started.state, "fn", 1300);
    strict_1.default.equal(released.effect.type, "none");
    strict_1.default.equal(released.state.recording, true);
    strict_1.default.equal(released.state.latched, true);
});
(0, node_test_1.test)("modifier use after hands-free start preserves the latch", () => {
    const started = (0, dictation_hold_machine_1.onHandsFreeToggle)((0, dictation_hold_machine_1.initialDictationHoldState)(), 1000, true);
    const used = (0, dictation_hold_machine_1.onHotkeyModifierUsed)(started.state, 1050);
    strict_1.default.equal(used.effect.type, "none");
    strict_1.default.equal(used.state.recording, true);
    strict_1.default.equal(used.state.latched, true);
    const released = (0, dictation_hold_machine_1.onHotkeyUp)(used.state, "fn", 1300);
    strict_1.default.equal(released.effect.type, "none");
    strict_1.default.equal(released.state.recording, true);
    strict_1.default.equal(released.state.latched, true);
});
(0, node_test_1.test)("modifier use after a Fn-started latch cancels recording", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    const latched = (0, dictation_hold_machine_1.onHandsFreeToggle)(state, 1100);
    strict_1.default.equal(latched.state.keyDownAt, 1100);
    strict_1.default.equal(latched.state.latchIgnoreNextUp, true);
    const used = (0, dictation_hold_machine_1.onHotkeyModifierUsed)(latched.state, 1150);
    strict_1.default.equal(used.effect.type, "cancel");
    strict_1.default.equal(used.state.recording, false);
    strict_1.default.equal(used.state.latched, false);
});
(0, node_test_1.test)("hands-free toggle after a brief Fn tap latches without swallowing stop", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    const latched = (0, dictation_hold_machine_1.onHandsFreeToggle)(state, 1100);
    strict_1.default.equal(latched.effect.type, "latch");
    strict_1.default.equal(latched.state.latched, true);
    strict_1.default.equal(latched.state.latchIgnoreNextUp, false);
    const down = (0, dictation_hold_machine_1.onHotkeyDown)(latched.state, "fn", 1300);
    const stopped = (0, dictation_hold_machine_1.onHotkeyUp)(down.state, "fn", 1500);
    strict_1.default.equal(stopped.effect.type, "stop");
    strict_1.default.equal(stopped.state.recording, false);
});
(0, node_test_1.test)("brief tap keeps recording and arms double-tap", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    const up = (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1000 + dictation_hold_machine_1.FN_TAP_MAX_MS - 1);
    strict_1.default.equal(up.effect.type, "arm-double-tap");
    strict_1.default.equal(up.state.recording, true);
    strict_1.default.equal(up.state.pendingDoubleTap, true);
    strict_1.default.equal(up.state.latched, false);
});
(0, node_test_1.test)("echo ups while waiting do not re-arm double-tap", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    const echo = (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1200);
    strict_1.default.equal(echo.effect.type, "none");
    strict_1.default.equal(echo.state.pendingDoubleTap, true);
    strict_1.default.equal(echo.state.latched, false);
});
(0, node_test_1.test)("a bounce down right after tap-up does not latch hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    const bounce = (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1080 + dictation_hold_machine_1.MIN_DOUBLE_TAP_GAP_MS - 1);
    strict_1.default.equal(bounce.effect.type, "none");
    strict_1.default.equal(bounce.state.latched, false);
    strict_1.default.equal(bounce.state.pendingDoubleTap, true);
});
(0, node_test_1.test)("a fast second tap still latches hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    const secondDown = (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1080 + dictation_hold_machine_1.MIN_DOUBLE_TAP_GAP_MS);
    strict_1.default.equal(secondDown.effect.type, "latch");
    strict_1.default.equal(secondDown.state.latched, true);
});
(0, node_test_1.test)("a fast Windows chord double-tap latches hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "chord", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "chord", 1040));
    const secondDown = (0, dictation_hold_machine_1.onHotkeyDown)(state, "chord", 1040 + dictation_hold_machine_1.MIN_DOUBLE_TAP_GAP_MS - 1);
    strict_1.default.equal(secondDown.effect.type, "latch");
    strict_1.default.equal(secondDown.state.latched, true);
});
(0, node_test_1.test)("same-tick chord down/up/down latches hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "chord", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "chord", 1000));
    const secondDown = (0, dictation_hold_machine_1.onHotkeyDown)(state, "chord", 1000);
    strict_1.default.equal(secondDown.effect.type, "latch");
    strict_1.default.equal(secondDown.state.latched, true);
});
(0, node_test_1.test)("Fn double-tap latches hands-free without restarting", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    const secondDown = (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1080 + dictation_hold_machine_1.DOUBLE_TAP_WINDOW_MS - 1);
    strict_1.default.equal(secondDown.effect.type, "latch");
    strict_1.default.equal(secondDown.state.latched, true);
    strict_1.default.equal(secondDown.state.recording, true);
    state = apply(state, secondDown);
    const secondUp = (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1500);
    strict_1.default.equal(secondUp.effect.type, "none");
    strict_1.default.equal(secondUp.state.latched, true);
});
(0, node_test_1.test)("expired double-tap window discards the first tap", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    const expired = (0, dictation_hold_machine_1.onDoubleTapTimeout)(state, 1080 + dictation_hold_machine_1.DOUBLE_TAP_WINDOW_MS + 1);
    strict_1.default.equal(expired.effect.type, "cancel");
    strict_1.default.equal(expired.state.recording, false);
    strict_1.default.equal(expired.state.pendingDoubleTap, false);
});
(0, node_test_1.test)("timeout still cancels if a bounce left keyDownAt set", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1080 + dictation_hold_machine_1.MIN_DOUBLE_TAP_GAP_MS - 1));
    const expired = (0, dictation_hold_machine_1.onDoubleTapTimeout)(state, 1080 + dictation_hold_machine_1.DOUBLE_TAP_WINDOW_MS + 1);
    strict_1.default.equal(expired.effect.type, "cancel");
});
(0, node_test_1.test)("Fn tap while latched stops hands-free on release", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1300));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1400));
    strict_1.default.equal(state.latched, true);
    const down = (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 2000);
    strict_1.default.equal(down.effect.type, "none");
    strict_1.default.equal(down.state.latched, true);
    const stop = (0, dictation_hold_machine_1.onHotkeyUp)(down.state, "fn", 2100);
    strict_1.default.equal(stop.effect.type, "stop");
    strict_1.default.equal(stop.state.recording, false);
});
(0, node_test_1.test)("early Fn stop tap after latching is not mistaken for an echo", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1300));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1350));
    strict_1.default.equal(state.latched, true);
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1300 + dictation_hold_machine_1.LATCH_ECHO_MS + 10));
    const stop = (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1300 + dictation_hold_machine_1.LATCH_ECHO_MS + 50);
    strict_1.default.equal(stop.effect.type, "stop");
    strict_1.default.equal(stop.state.latched, false);
});
(0, node_test_1.test)("chord tap while latched stops hands-free on press", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHandsFreeStart)(state));
    const stop = (0, dictation_hold_machine_1.onHotkeyDown)(state, "chord", 2000);
    strict_1.default.equal(stop.effect.type, "stop");
    strict_1.default.equal(stop.state.recording, false);
});
(0, node_test_1.test)("native double-tap while still down latches hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    const latched = (0, dictation_hold_machine_1.onDoubleTapDetected)(state, 1180);
    strict_1.default.equal(latched.effect.type, "latch");
    strict_1.default.equal(latched.state.latched, true);
});
(0, node_test_1.test)("same-press native double-tap echo does not latch", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    const echo = (0, dictation_hold_machine_1.onDoubleTapDetected)(state, 1000 + dictation_hold_machine_1.NATIVE_DOUBLE_TAP_MIN_GAP_MS - 1);
    strict_1.default.equal(echo.effect.type, "none");
    strict_1.default.equal(echo.state.latched, false);
});
(0, node_test_1.test)("hold longer than the tap window stays push-to-talk", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "chord", 1000));
    const up = (0, dictation_hold_machine_1.onHotkeyUp)(state, "chord", 1000 + dictation_hold_machine_1.CHORD_TAP_MAX_MS);
    strict_1.default.equal(up.effect.type, "stop");
    strict_1.default.equal(up.state.latched, false);
});
(0, node_test_1.test)("mic button starts hands-free dictate", () => {
    const result = (0, dictation_hold_machine_1.onHandsFreeStart)((0, dictation_hold_machine_1.initialDictationHoldState)());
    strict_1.default.equal(result.effect.type, "start");
    strict_1.default.equal(result.state.latched, true);
});
(0, node_test_1.test)("Fn tap after mic-button start stops hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHandsFreeStart)(state));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 2000));
    const stop = (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 2080);
    strict_1.default.equal(stop.effect.type, "stop");
});
(0, node_test_1.test)("typing while latched does not cancel hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHandsFreeStart)(state));
    const interrupted = (0, dictation_hold_machine_1.onHotkeyInterrupted)(state, 2000);
    strict_1.default.equal(interrupted.effect.type, "none");
    strict_1.default.equal(interrupted.state.latched, true);
});
(0, node_test_1.test)("hotkey down during post-stop cooldown is ignored", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1000 + dictation_hold_machine_1.FN_TAP_MAX_MS));
    strict_1.default.equal(state.recording, false);
    const ignored = (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", state.lastStopAt + 1);
    strict_1.default.equal(ignored.effect.type, "ignored");
    strict_1.default.equal(ignored.state.recording, false);
    const restart = (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", state.lastStopAt + dictation_hold_machine_1.POST_STOP_COOLDOWN_MS);
    strict_1.default.equal(restart.effect.type, "start");
});
(0, node_test_1.test)("echo up right after latch does not stop hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1300));
    const echo = (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1300 + dictation_hold_machine_1.ECHO_UP_MS - 1);
    strict_1.default.equal(echo.effect.type, "none");
    strict_1.default.equal(echo.state.latched, true);
});
(0, node_test_1.test)("same-press down right after latch does not stop hands-free", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1300));
    const echo = (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1300 + dictation_hold_machine_1.LATCH_ECHO_MS - 1);
    strict_1.default.equal(echo.effect.type, "none");
    strict_1.default.equal(echo.state.latched, true);
});
(0, node_test_1.test)("a second force stop does not emit another stop", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onForceStop)(state, 2000, "Stop button — finalizing recording"));
    const again = (0, dictation_hold_machine_1.onForceStop)(state, 2001, "Stop button — finalizing recording");
    strict_1.default.equal(again.effect.type, "none");
    strict_1.default.equal(again.state.recording, false);
});
(0, node_test_1.test)("modifier use while recording cancels and consumes the hold", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    const used = (0, dictation_hold_machine_1.onHotkeyModifierUsed)(state, 1200);
    strict_1.default.equal(used.effect.type, "cancel");
    strict_1.default.equal(used.state.recording, false);
    strict_1.default.equal(used.state.holdConsumed, true);
    const repeat = (0, dictation_hold_machine_1.onHotkeyDown)(used.state, "fn", 1300);
    strict_1.default.equal(repeat.effect.type, "ignored");
    strict_1.default.equal(repeat.state.recording, false);
    const up = (0, dictation_hold_machine_1.onHotkeyUp)(repeat.state, "fn", 1400);
    strict_1.default.equal(up.effect.type, "none");
    strict_1.default.equal(up.state.holdConsumed, false);
    strict_1.default.equal(up.state.pendingDoubleTap, false);
    strict_1.default.equal(up.state.latched, false);
});
(0, node_test_1.test)("modifier use before the deferred start consumes the hold silently", () => {
    const used = (0, dictation_hold_machine_1.onHotkeyModifierUsed)((0, dictation_hold_machine_1.initialDictationHoldState)(), 1000);
    strict_1.default.equal(used.effect.type, "ignored");
    strict_1.default.equal(used.state.recording, false);
    const second = (0, dictation_hold_machine_1.onHotkeyModifierUsed)(used.state, 1100);
    strict_1.default.equal(second.effect.type, "ignored");
    const up = (0, dictation_hold_machine_1.onHotkeyUp)(second.state, "fn", 1200);
    strict_1.default.equal(up.effect.type, "none");
    strict_1.default.equal(up.state.lastTapUpAt, 0);
    const fresh = (0, dictation_hold_machine_1.onHotkeyDown)(up.state, "fn", 2000);
    strict_1.default.equal(fresh.effect.type, "start");
});
(0, node_test_1.test)("release after a consumed hold does not latch a pending tap", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyModifierUsed)(state, 1050));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1100));
    const doubleTap = (0, dictation_hold_machine_1.onDoubleTapDetected)(state, 1150);
    strict_1.default.equal(doubleTap.effect.type, "none");
    strict_1.default.equal(doubleTap.state.latched, false);
});
(0, node_test_1.test)("Fn+Delete while latched hands-free leaves it running", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHandsFreeStart)(state));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 2000));
    const used = (0, dictation_hold_machine_1.onHotkeyModifierUsed)(state, 2200);
    strict_1.default.equal(used.effect.type, "none");
    strict_1.default.equal(used.state.latched, true);
    strict_1.default.equal(used.state.recording, true);
    const repeat = (0, dictation_hold_machine_1.onHotkeyDown)(used.state, "fn", 2300);
    strict_1.default.equal(repeat.effect.type, "ignored");
    const up = (0, dictation_hold_machine_1.onHotkeyUp)(repeat.state, "fn", 2400);
    strict_1.default.equal(up.effect.type, "none");
    strict_1.default.equal(up.state.latched, true);
    strict_1.default.equal(up.state.recording, true);
    state = apply(up.state, (0, dictation_hold_machine_1.onHotkeyDown)(up.state, "fn", 3000));
    strict_1.default.equal((0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 3080).effect.type, "stop");
});
(0, node_test_1.test)("modifier use during the latching double-tap cancels it", () => {
    let state = (0, dictation_hold_machine_1.initialDictationHoldState)();
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1000));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyUp)(state, "fn", 1080));
    state = apply(state, (0, dictation_hold_machine_1.onHotkeyDown)(state, "fn", 1300));
    strict_1.default.equal(state.latched, true);
    const used = (0, dictation_hold_machine_1.onHotkeyModifierUsed)(state, 1400);
    strict_1.default.equal(used.effect.type, "cancel");
    strict_1.default.equal(used.state.latched, false);
    const up = (0, dictation_hold_machine_1.onHotkeyUp)(used.state, "fn", 1500);
    strict_1.default.equal(up.effect.type, "none");
});
//# sourceMappingURL=dictation-hold-machine.test.js.map
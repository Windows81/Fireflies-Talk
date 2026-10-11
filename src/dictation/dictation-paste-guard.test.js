"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_paste_guard_1 = require("./dictation-paste-guard");
(0, node_test_1.test)("concurrent paste of the same stop epoch is skipped", () => {
    const first = (0, dictation_paste_guard_1.decideDictationPaste)((0, dictation_paste_guard_1.createDictationPasteGuardState)(), 1);
    strict_1.default.equal(first.action, "run");
    if (first.action !== "run")
        return;
    const second = (0, dictation_paste_guard_1.decideDictationPaste)(first.next, 1);
    strict_1.default.deepEqual(second, { action: "skip", reason: "in-flight" });
});
(0, node_test_1.test)("a second renderer replaying the same stop epoch is skipped after the first succeeds", () => {
    const started = (0, dictation_paste_guard_1.decideDictationPaste)((0, dictation_paste_guard_1.createDictationPasteGuardState)(), 7);
    strict_1.default.equal(started.action, "run");
    if (started.action !== "run")
        return;
    const afterSuccess = (0, dictation_paste_guard_1.finishDictationPaste)(started.next, {
        ok: true,
        epoch: 7,
    });
    const replay = (0, dictation_paste_guard_1.decideDictationPaste)(afterSuccess, 7);
    strict_1.default.deepEqual(replay, { action: "skip", reason: "replayed-epoch" });
});
(0, node_test_1.test)("a failed paste of an epoch can be retried", () => {
    const started = (0, dictation_paste_guard_1.decideDictationPaste)((0, dictation_paste_guard_1.createDictationPasteGuardState)(), 3);
    strict_1.default.equal(started.action, "run");
    if (started.action !== "run")
        return;
    const afterFailure = (0, dictation_paste_guard_1.finishDictationPaste)(started.next, {
        ok: false,
        epoch: 3,
    });
    const retry = (0, dictation_paste_guard_1.decideDictationPaste)(afterFailure, 3);
    strict_1.default.equal(retry.action, "run");
});
(0, node_test_1.test)("a new stop epoch can paste after a previous success", () => {
    const first = (0, dictation_paste_guard_1.decideDictationPaste)((0, dictation_paste_guard_1.createDictationPasteGuardState)(), 1);
    strict_1.default.equal(first.action, "run");
    if (first.action !== "run")
        return;
    const afterFirst = (0, dictation_paste_guard_1.finishDictationPaste)(first.next, { ok: true, epoch: 1 });
    const second = (0, dictation_paste_guard_1.decideDictationPaste)(afterFirst, 2);
    strict_1.default.equal(second.action, "run");
});
(0, node_test_1.test)("a second stop before the next start does not mint another paste epoch", () => {
    const arm = (0, dictation_paste_guard_1.createDictationStopArm)();
    arm.arm();
    strict_1.default.equal(typeof arm.takeEpoch(), "number");
    strict_1.default.equal(arm.takeEpoch(), null);
});
(0, node_test_1.test)("cancel disarms a pending stop epoch", () => {
    const arm = (0, dictation_paste_guard_1.createDictationStopArm)();
    arm.arm();
    arm.disarm();
    strict_1.default.equal(arm.takeEpoch(), null);
});
(0, node_test_1.test)("a missing paste epoch still pastes and does not lock later stops", () => {
    const first = (0, dictation_paste_guard_1.decideDictationPaste)((0, dictation_paste_guard_1.createDictationPasteGuardState)(), undefined);
    strict_1.default.equal(first.action, "run");
    if (first.action !== "run")
        return;
    const afterMissing = (0, dictation_paste_guard_1.finishDictationPaste)(first.next, {
        ok: true,
        epoch: undefined,
    });
    const again = (0, dictation_paste_guard_1.decideDictationPaste)(afterMissing, undefined);
    strict_1.default.equal(again.action, "run");
    const nextStop = (0, dictation_paste_guard_1.decideDictationPaste)(afterMissing, 4);
    strict_1.default.equal(nextStop.action, "run");
});
(0, node_test_1.test)("zero and NaN epochs are not recorded as the last accepted paste", () => {
    const afterZero = (0, dictation_paste_guard_1.finishDictationPaste)((0, dictation_paste_guard_1.createDictationPasteGuardState)(), {
        ok: true,
        epoch: 0,
    });
    strict_1.default.equal(afterZero.lastAcceptedEpoch, null);
    const afterNaN = (0, dictation_paste_guard_1.finishDictationPaste)(afterZero, {
        ok: true,
        epoch: Number.NaN,
    });
    strict_1.default.equal(afterNaN.lastAcceptedEpoch, null);
});
(0, node_test_1.test)("finishing one epoch does not clear a different in-flight paste", () => {
    const first = (0, dictation_paste_guard_1.decideDictationPaste)((0, dictation_paste_guard_1.createDictationPasteGuardState)(), 5);
    strict_1.default.equal(first.action, "run");
    if (first.action !== "run")
        return;
    const second = (0, dictation_paste_guard_1.decideDictationPaste)(first.next, 6);
    strict_1.default.equal(second.action, "run");
    if (second.action !== "run")
        return;
    const afterFirst = (0, dictation_paste_guard_1.finishDictationPaste)(second.next, { ok: true, epoch: 5 });
    strict_1.default.equal(afterFirst.inFlightEpoch, 6);
    strict_1.default.equal(afterFirst.lastAcceptedEpoch, 5);
    const replaySecond = (0, dictation_paste_guard_1.decideDictationPaste)(afterFirst, 6);
    strict_1.default.deepEqual(replaySecond, { action: "skip", reason: "in-flight" });
});
//# sourceMappingURL=dictation-paste-guard.test.js.map
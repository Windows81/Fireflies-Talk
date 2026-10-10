"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_action_session_1 = require("./dictation-action-session");
const dictation_hold_machine_1 = require("./dictation-hold-machine");
(0, node_test_1.test)("releasing action does not stop dictation that is still held", () => {
    (0, dictation_action_session_1.resetActionSessionFlags)();
    (0, dictation_action_session_1.setDictationHeld)(true);
    (0, dictation_action_session_1.beginActionHold)({
        beginHold: () => {
            throw new Error("should upgrade an in-progress session");
        },
        holdState: { ...(0, dictation_hold_machine_1.initialDictationHoldState)(), recording: true },
        isRecording: () => true,
        upgradeToCommand: () => undefined,
    });
    strict_1.default.equal((0, dictation_action_session_1.isActionHeld)(), true);
    strict_1.default.equal((0, dictation_action_session_1.isDictationHeld)(), true);
    let ended = false;
    (0, dictation_action_session_1.endActionHold)(() => {
        ended = true;
    });
    strict_1.default.equal(ended, false);
    strict_1.default.equal((0, dictation_action_session_1.isActionHeld)(), false);
    strict_1.default.equal((0, dictation_action_session_1.isDictationHeld)(), true);
    (0, dictation_action_session_1.resetActionSessionFlags)();
});
(0, node_test_1.test)("ignored action press does not leave command mode armed", () => {
    (0, dictation_action_session_1.resetActionSessionFlags)();
    (0, dictation_action_session_1.beginActionHold)({
        beginHold: () => undefined,
        holdState: (0, dictation_hold_machine_1.initialDictationHoldState)(),
        isRecording: () => false,
        upgradeToCommand: () => {
            throw new Error("no session to upgrade");
        },
    });
    strict_1.default.equal((0, dictation_action_session_1.isForceCommandMode)(), false);
    (0, dictation_action_session_1.endActionHold)(() => undefined);
    strict_1.default.equal((0, dictation_action_session_1.isForceCommandMode)(), false);
    (0, dictation_action_session_1.resetActionSessionFlags)();
});
(0, node_test_1.test)("action press that starts recording arms command mode", () => {
    (0, dictation_action_session_1.resetActionSessionFlags)();
    let recording = false;
    (0, dictation_action_session_1.beginActionHold)({
        beginHold: () => {
            recording = true;
        },
        holdState: (0, dictation_hold_machine_1.initialDictationHoldState)(),
        isRecording: () => recording,
        upgradeToCommand: () => {
            throw new Error("should start, not upgrade");
        },
    });
    strict_1.default.equal((0, dictation_action_session_1.isForceCommandMode)(), true);
    (0, dictation_action_session_1.resetActionSessionFlags)();
});
//# sourceMappingURL=dictation-action-session.test.js.map
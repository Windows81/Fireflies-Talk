"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_mode_1 = require("./dictation-mode");
(0, node_test_1.test)("extra Shift selects command mode", () => {
    strict_1.default.equal((0, dictation_mode_1.resolveDictationMode)(true, false, true), "command");
    strict_1.default.equal((0, dictation_mode_1.resolveDictationMode)(false, false, true), "dictate");
});
(0, node_test_1.test)("disabled Shift overlay never selects command mode", () => {
    strict_1.default.equal((0, dictation_mode_1.resolveDictationMode)(true, false, false), "dictate");
    strict_1.default.equal((0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: false,
        hotkeyHeld: true,
        latched: false,
        overlayEnabled: false,
        recording: true,
        shiftDown: true,
    }), false);
});
(0, node_test_1.test)("hands-free starts in dictate mode despite a held Shift", () => {
    strict_1.default.equal((0, dictation_mode_1.resolveDictationMode)(true, false, true, true), "dictate");
});
(0, node_test_1.test)("Shift inside the chord cannot select command mode", () => {
    strict_1.default.equal((0, dictation_mode_1.resolveDictationMode)(true, true), "dictate");
    strict_1.default.equal((0, dictation_mode_1.resolveDictationMode)(false, true), "dictate");
});
(0, node_test_1.test)("late Shift upgrades an in-progress hold", () => {
    strict_1.default.equal((0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: false,
        hotkeyHeld: true,
        latched: false,
        overlayEnabled: true,
        recording: true,
        shiftDown: true,
    }), true);
});
(0, node_test_1.test)("late Shift does not upgrade when idle, latched, or when Shift is in the chord", () => {
    strict_1.default.equal((0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: false,
        hotkeyHeld: true,
        latched: false,
        recording: false,
        shiftDown: true,
    }), false);
    strict_1.default.equal((0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: true,
        hotkeyHeld: true,
        latched: false,
        recording: true,
        shiftDown: true,
    }), false);
    strict_1.default.equal((0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: false,
        hotkeyHeld: true,
        latched: false,
        recording: true,
        shiftDown: false,
    }), false);
    strict_1.default.equal((0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: false,
        hotkeyHeld: true,
        latched: true,
        recording: true,
        shiftDown: true,
    }), false);
});
(0, node_test_1.test)("late Shift does not upgrade during the pending double-tap window", () => {
    strict_1.default.equal((0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: false,
        hotkeyHeld: false,
        latched: false,
        recording: true,
        shiftDown: true,
    }), false);
});
(0, node_test_1.test)("idle clears command mode so hover after use is not purple", () => {
    strict_1.default.equal((0, dictation_mode_1.nextDictationModeForState)("idle", "command"), "dictate");
    strict_1.default.equal((0, dictation_mode_1.nextDictationModeForState)("idle", "dictate"), "dictate");
});
(0, node_test_1.test)("recording and processing keep the current mode", () => {
    strict_1.default.equal((0, dictation_mode_1.nextDictationModeForState)("recording", "command"), "command");
    strict_1.default.equal((0, dictation_mode_1.nextDictationModeForState)("processing", "command"), "command");
    strict_1.default.equal((0, dictation_mode_1.nextDictationModeForState)("recording", "dictate"), "dictate");
});
(0, node_test_1.test)("command chrome is only shown while a command session is active", () => {
    strict_1.default.equal((0, dictation_mode_1.shouldShowCommandChrome)("command", "idle"), false);
    strict_1.default.equal((0, dictation_mode_1.shouldShowCommandChrome)("command", "recording"), true);
    strict_1.default.equal((0, dictation_mode_1.shouldShowCommandChrome)("command", "processing"), true);
    strict_1.default.equal((0, dictation_mode_1.shouldShowCommandChrome)("dictate", "recording"), false);
});
(0, node_test_1.test)("a new session cannot start while the last one is still pasting", () => {
    strict_1.default.equal((0, dictation_mode_1.canBeginDictation)("idle"), true);
    strict_1.default.equal((0, dictation_mode_1.canBeginDictation)("recording"), true);
    strict_1.default.equal((0, dictation_mode_1.canBeginDictation)("processing"), false);
    strict_1.default.equal((0, dictation_mode_1.canBeginDictation)("idle", true), false);
    strict_1.default.equal((0, dictation_mode_1.canBeginDictation)("recording", true), false);
    strict_1.default.equal((0, dictation_mode_1.canBeginDictation)("processing", false), false);
});
//# sourceMappingURL=dictation-mode.test.js.map
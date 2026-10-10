"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_binding_1 = require("./dictation-binding");
const chord_listener_args_1 = require("./chord-listener-args");
(0, node_test_1.test)("formats compact pill hints and Windows accelerators", () => {
    const chord = {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    };
    strict_1.default.equal((0, dictation_binding_1.formatDictationBindingLabel)(chord, { isMac: true }), "Ctrl + Cmd");
    strict_1.default.equal((0, dictation_binding_1.getDictationShortcutHint)(chord, "win32"), "Hold Ctrl+Win");
    strict_1.default.equal((0, chord_listener_args_1.windowsHotkeyString)(chord), "Ctrl+Win");
    strict_1.default.equal((0, chord_listener_args_1.windowsHotkeyString)({
        key: "S",
        modifiers: ["ctrl", "alt"],
        type: "chord",
    }), "Ctrl+Alt+S");
});
(0, node_test_1.test)("mac chord args map modifiers and S to a virtual key code", () => {
    strict_1.default.deepEqual((0, chord_listener_args_1.macChordListenerArgs)({ modifiers: ["ctrl", "meta"], type: "chord" }), ["--ctrl", "--meta"]);
    strict_1.default.deepEqual((0, chord_listener_args_1.macChordListenerArgs)({
        key: "S",
        modifiers: ["ctrl", "alt"],
        type: "chord",
    }), ["--ctrl", "--alt", "--key=1"]);
    strict_1.default.deepEqual((0, chord_listener_args_1.macChordListenerArgs)({ key: "0", modifiers: ["ctrl"], type: "chord" }), ["--ctrl", "--key=29"]);
    strict_1.default.deepEqual((0, chord_listener_args_1.macChordListenerArgs)({ key: "9", modifiers: ["ctrl"], type: "chord" }), ["--ctrl", "--key=25"]);
});
(0, node_test_1.test)("formats mouse chords and Windows accelerators", () => {
    const mouse4 = {
        modifiers: [],
        mouseButton: 4,
        type: "chord",
    };
    strict_1.default.equal((0, dictation_binding_1.formatDictationBindingLabel)(mouse4, { isMac: false }), "Mouse 4 - Back");
    strict_1.default.equal((0, chord_listener_args_1.windowsHotkeyString)(mouse4), "Mouse4");
    strict_1.default.equal((0, chord_listener_args_1.windowsHotkeyString)({
        modifiers: ["alt", "meta"],
        mouseButton: 5,
        type: "chord",
    }), "Alt+Win+Mouse5");
});
(0, node_test_1.test)("mac chord args include --mouse for side buttons", () => {
    strict_1.default.deepEqual((0, chord_listener_args_1.macChordListenerArgs)({
        modifiers: [],
        mouseButton: 4,
        type: "chord",
    }), ["--mouse=4"]);
});
(0, node_test_1.test)("Fn chords validate, label with Fn first, and pass --fn to the listener", () => {
    const fnZ = {
        fn: true,
        key: "Z",
        modifiers: [],
        type: "chord",
    };
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)(fnZ, "darwin"), null);
    strict_1.default.equal((0, dictation_binding_1.formatDictationBindingLabel)(fnZ, { isMac: true }), "Fn + Z");
    strict_1.default.deepEqual((0, chord_listener_args_1.macChordListenerArgs)(fnZ), ["--fn", "--key=6"]);
});
//# sourceMappingURL=chord-listener-args.test.js.map
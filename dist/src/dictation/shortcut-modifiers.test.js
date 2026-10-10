"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_binding_1 = require("./dictation-binding");
const chord_listener_args_1 = require("./chord-listener-args");
(0, node_test_1.test)("accepts distinct left and right modifier captures", () => {
    const cases = [
        ["ctrl", "ctrl-left", "--modifier-key=59", "Control"],
        ["ctrl", "ctrl-right", "--modifier-key=62", "Right Control"],
        ["alt", "alt-left", "--modifier-key=58", "Option"],
        ["alt", "alt-right", "--modifier-key=61", "Right Option"],
        ["shift", "shift-left", "--modifier-key=56", "Shift"],
        ["shift", "shift-right", "--modifier-key=60", "Right Shift"],
        ["meta", "meta-left", "--modifier-key=55", "Command"],
        ["meta", "meta-right", "--modifier-key=54", "Right Command"],
    ];
    for (const [modifier, modifierKey, listenerArg, label] of cases) {
        const binding = (0, dictation_binding_1.bindingFromModifiersAndKey)([modifier], undefined, undefined, undefined, modifierKey);
        strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)(binding, "darwin"), null);
        strict_1.default.ok(binding?.type === "chord");
        strict_1.default.deepEqual((0, chord_listener_args_1.macChordListenerArgs)(binding), [listenerArg]);
        strict_1.default.equal((0, dictation_binding_1.formatDictationBindingLabel)(binding, { isMac: true }), label);
    }
});
(0, node_test_1.test)("normalization preserves physical modifiers only on macOS", () => {
    const stored = {
        modifierKey: "meta-right",
        modifiers: ["meta"],
        type: "chord",
    };
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)(stored, "darwin"), stored);
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)(stored, "win32"), {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    });
});
(0, node_test_1.test)("a modifier-only capture must identify the physical key", () => {
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)((0, dictation_binding_1.bindingFromModifiersAndKey)(["ctrl"]), "darwin"), "A single modifier can't be the shortcut here. Try a combination like Ctrl + Shift.");
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)((0, dictation_binding_1.bindingFromModifiersAndKey)(["ctrl", "alt"]), "win32"), null);
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)((0, dictation_binding_1.bindingFromModifiersAndKey)(["ctrl"], "S"), "win32"), null);
});
(0, node_test_1.test)("Windows keeps allowed lone modifiers and rejects Ctrl/Win", () => {
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["shift"], type: "chord" }, "win32"), { modifiers: ["shift"], type: "chord" });
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["alt"], type: "chord" }, "win32"), { modifiers: ["alt"], type: "chord" });
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["ctrl"], type: "chord" }, "win32"), {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    });
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["meta"], type: "chord" }, "win32"), {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    });
});
(0, node_test_1.test)("macOS requires a physical key for a lone modifier", () => {
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["ctrl"], type: "chord" }, "darwin"), {
        type: "darwin-fn",
    });
});
(0, node_test_1.test)("targetless empty chords fall back to platform defaults", () => {
    for (const stored of [
        { modifiers: [], type: "chord" },
        { modifiers: ["bogus"], type: "chord" },
    ]) {
        strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)(stored, "darwin"), {
            type: "darwin-fn",
        });
        strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)(stored, "win32"), {
            modifiers: ["ctrl", "meta"],
            type: "chord",
        });
    }
});
//# sourceMappingURL=shortcut-modifiers.test.js.map
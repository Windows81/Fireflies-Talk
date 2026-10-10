"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_binding_1 = require("./dictation-binding");
const dictation_presets_1 = require("./dictation-presets");
const shortcut_conflict_1 = require("./shortcut-conflict");
(0, node_test_1.test)("defaults to Fn on macOS and Ctrl+Win on Windows", () => {
    strict_1.default.deepEqual((0, dictation_binding_1.defaultDictationBinding)("darwin"), { type: "darwin-fn" });
    strict_1.default.deepEqual((0, dictation_binding_1.defaultDictationBinding)("win32"), {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    });
});
(0, node_test_1.test)("darwin-fn falls back to the Windows default off macOS", () => {
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)({ type: "darwin-fn" }, "win32"), {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    });
});
(0, node_test_1.test)("platform presets use Mac vs Windows labels", () => {
    const mac = (0, dictation_presets_1.getDictationPresetOptions)("darwin");
    const windows = (0, dictation_presets_1.getDictationPresetOptions)("win32");
    strict_1.default.deepEqual(mac.map((preset) => preset.label), [
        "Fn",
        "Ctrl + Cmd",
        "Ctrl + Option",
        "Option + Cmd",
        "Ctrl + Shift",
        "Mouse 4 - Back",
        "Mouse 5 - Forward",
    ]);
    strict_1.default.deepEqual(windows.map((preset) => preset.label), [
        "Ctrl + Win",
        "Ctrl + Alt",
        "Alt + Win",
        "Ctrl + Shift",
        "Mouse 4 - Back",
        "Mouse 5 - Forward",
    ]);
    strict_1.default.equal((0, dictation_presets_1.findMatchingPresetId)({ type: "darwin-fn" }, "darwin"), "fn");
    strict_1.default.equal((0, dictation_presets_1.findMatchingPresetId)({ modifiers: ["ctrl", "meta"], type: "chord" }, "win32"), "ctrl-meta");
});
(0, node_test_1.test)("Shift in the chord disables command-mode overlay", () => {
    strict_1.default.equal((0, dictation_binding_1.bindingRequiresShift)({ modifiers: ["ctrl", "shift"], type: "chord" }), true);
    strict_1.default.equal((0, dictation_binding_1.bindingRequiresShift)({ modifiers: ["ctrl", "meta"], type: "chord" }), false);
});
(0, node_test_1.test)("rejects a single non-modifier key", () => {
    const binding = (0, dictation_binding_1.bindingFromModifiersAndKey)([], "S");
    strict_1.default.ok(binding?.type === "chord");
    strict_1.default.deepEqual(binding, {
        key: "S",
        modifiers: [],
        type: "chord",
    });
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)(binding, "win32"), "Add at least one modifier (Ctrl, Option/Alt, Cmd/Win, or Shift).");
});
(0, node_test_1.test)("does not create Tab or Caps Lock bindings", () => {
    strict_1.default.equal((0, dictation_binding_1.bindingFromModifiersAndKey)([], "Tab"), null);
    strict_1.default.equal((0, dictation_binding_1.bindingFromModifiersAndKey)([], "CapsLock"), null);
});
(0, node_test_1.test)("accepts Mouse 4 / 5 with no modifiers and rejects main buttons", () => {
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)((0, dictation_binding_1.bindingFromModifiersAndKey)([], undefined, 4), "win32"), null);
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)((0, dictation_binding_1.bindingFromModifiersAndKey)([], undefined, 5), "win32"), null);
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)((0, dictation_binding_1.bindingFromModifiersAndKey)([], undefined, 1), "win32"), "Use a side mouse button (Mouse 4 or Mouse 5), not the main buttons.");
});
(0, node_test_1.test)("Fn survives normalization so a saved chord comes back intact", () => {
    const saved = JSON.parse(JSON.stringify({ fn: true, key: "2", modifiers: [], type: "chord" }));
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)(saved, "darwin"), {
        fn: true,
        key: "2",
        modifiers: [],
        type: "chord",
    });
});
(0, node_test_1.test)("Fn alone is the darwin-fn binding, not an incomplete chord", () => {
    strict_1.default.deepEqual((0, dictation_binding_1.bindingFromModifiersAndKey)([], undefined, undefined, true), {
        type: "darwin-fn",
    });
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)({ type: "darwin-fn" }, "darwin"), null);
});
(0, node_test_1.test)("Fn cannot pair with a function key", () => {
    // macOS sets .function for F-keys regardless of Fn, so the chord would also
    // fire on the bare key.
    strict_1.default.match((0, dictation_binding_1.validateCapturedBinding)({
        fn: true,
        key: "F1",
        modifiers: [],
        type: "chord",
    }, "darwin") ?? "", /cannot be combined with a function key/);
});
(0, node_test_1.test)("Fn + 1 is only taken while polish uses it", () => {
    // Polish can move to another key, so the conflict check against the actual
    // polish shortcut decides (see shortcut-conflict.test.ts), not the key itself.
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)({
        fn: true,
        key: "1",
        modifiers: [],
        type: "chord",
    }, "darwin"), null);
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)({ key: "1", type: "darwin-fn" }, "darwin"), null);
});
(0, node_test_1.test)("the Fn flag does not survive onto a platform that cannot report it", () => {
    const stored = { fn: true, key: "Z", modifiers: [], type: "chord" };
    strict_1.default.deepEqual((0, dictation_binding_1.normalizeDictationBinding)(stored, "win32"), {
        key: "Z",
        modifiers: [],
        type: "chord",
    });
});
(0, node_test_1.test)("equality is structural, so property order cannot hide a conflict", () => {
    // bindingFromModifiersAndKey and normalizeDictationBinding build the same
    // chord with different property order; stringifying made them differ.
    const captured = (0, dictation_binding_1.bindingFromModifiersAndKey)(["meta"], "K");
    const normalized = (0, dictation_binding_1.normalizeDictationBinding)({ key: "K", modifiers: ["meta"], type: "chord" }, "darwin");
    strict_1.default.ok(captured);
    strict_1.default.ok((0, dictation_binding_1.dictationBindingsEqual)(captured, normalized));
    strict_1.default.ok((0, shortcut_conflict_1.shortcutAlreadyInUse)(captured, normalized));
});
(0, node_test_1.test)("equality ignores modifier order but not the modifier set", () => {
    const a = (0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["shift", "meta"], key: "K", type: "chord" }, "darwin");
    const b = (0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["meta", "shift"], key: "K", type: "chord" }, "darwin");
    strict_1.default.ok((0, dictation_binding_1.dictationBindingsEqual)(a, b));
    strict_1.default.ok(!(0, dictation_binding_1.dictationBindingsEqual)(a, (0, dictation_binding_1.normalizeDictationBinding)({ modifiers: ["meta"], key: "K", type: "chord" }, "darwin")));
});
(0, node_test_1.test)("an Fn chord never equals the same key without Fn", () => {
    const withFn = (0, dictation_binding_1.normalizeDictationBinding)({ fn: true, key: "Z", modifiers: [], type: "chord" }, "darwin");
    const withoutFn = (0, dictation_binding_1.normalizeDictationBinding)({ key: "Z", modifiers: ["meta"], type: "chord" }, "darwin");
    strict_1.default.ok(!(0, dictation_binding_1.dictationBindingsEqual)(withFn, withoutFn));
});
(0, node_test_1.test)("bindings match regardless of the order their fields were built in", () => {
    // A freshly captured chord and a stored one carry the same fields in a
    // different order; a serialized comparison would call them different.
    const captured = {
        modifiers: ["ctrl", "alt"],
        type: "chord",
        key: "J",
    };
    const stored = (0, dictation_binding_1.normalizeDictationBinding)({ key: "J", modifiers: ["ctrl", "alt"], type: "chord" }, "darwin");
    strict_1.default.equal((0, dictation_binding_1.dictationBindingsEqual)(captured, stored), true);
    strict_1.default.equal((0, dictation_binding_1.dictationBindingsEqual)(captured, { ...captured, key: "K" }), false);
});
(0, node_test_1.test)("Fn chords are recordable, and only Shift may join Fn", () => {
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)({ key: "2", type: "darwin-fn" }, "darwin"), null);
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)({ type: "darwin-fn" }, "darwin"), null);
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)({ modifiers: ["shift"], type: "darwin-fn" }, "darwin"), null);
    strict_1.default.match((0, dictation_binding_1.validateCapturedBinding)({ modifiers: ["meta"], type: "darwin-fn" }, "darwin") ?? "", /Only Shift can be held with Fn/);
    strict_1.default.match((0, dictation_binding_1.validateCapturedBinding)({
        key: "2",
        modifiers: ["shift"],
        type: "darwin-fn",
    }, "darwin") ?? "", /can't also take another key/);
    strict_1.default.equal((0, dictation_binding_1.dictationBindingsEqual)({ type: "darwin-fn" }, { key: "2", type: "darwin-fn" }), false);
    strict_1.default.equal((0, dictation_binding_1.dictationBindingsEqual)({ type: "darwin-fn" }, { modifiers: ["shift"], type: "darwin-fn" }), false);
});
(0, node_test_1.test)("Fn + Shift is recognised and labelled", () => {
    strict_1.default.equal((0, dictation_binding_1.isFnShiftBinding)({ modifiers: ["shift"], type: "darwin-fn" }), true);
    strict_1.default.equal((0, dictation_binding_1.isFnShiftBinding)({ type: "darwin-fn" }), false);
    strict_1.default.equal((0, dictation_binding_1.isFnShiftBinding)({ modifiers: ["ctrl"], type: "darwin-fn" }), false);
    strict_1.default.equal((0, dictation_binding_1.isFnShiftBinding)(null), false);
    strict_1.default.equal((0, dictation_binding_1.formatDictationBindingLabel)({ modifiers: ["shift"], type: "darwin-fn" }, { isMac: true }), "Fn + Shift");
});
(0, node_test_1.test)("labels an Fn chord", () => {
    strict_1.default.equal((0, dictation_binding_1.formatDictationBindingLabel)({ key: "2", type: "darwin-fn" }, { isMac: true }), "Fn + 2");
    strict_1.default.equal((0, dictation_binding_1.formatDictationBindingLabel)({ key: "2", type: "darwin-fn" }, { compact: true, isMac: true }), "Fn+2");
});
//# sourceMappingURL=dictation-binding.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const windows_listener_args_1 = require("./windows-listener-args");
const action_binding_1 = require("./action-binding");
const altWin = {
    modifiers: ["alt", "meta"],
    type: "chord",
};
(0, node_test_1.test)("Windows defaults to Win+Alt and Mac to Fn + Shift", () => {
    strict_1.default.deepEqual((0, action_binding_1.defaultActionBinding)("win32"), {
        modifiers: ["alt", "meta"],
        type: "chord",
    });
    strict_1.default.deepEqual((0, action_binding_1.defaultActionBinding)("darwin"), {
        modifiers: ["shift"],
        type: "darwin-fn",
    });
    strict_1.default.equal((0, action_binding_1.defaultActionBinding)("linux"), null);
});
(0, node_test_1.test)("standalone modifiers remain exclusive to dictation", () => {
    strict_1.default.equal((0, action_binding_1.validateActionCapture)({
        modifierKey: "meta-right",
        modifiers: ["meta"],
        type: "chord",
    }, "darwin"), "A standalone modifier can only be used for the push to talk shortcut.");
    strict_1.default.equal((0, action_binding_1.validateActionCapture)({
        key: "S",
        modifiers: ["meta"],
        type: "chord",
    }, "darwin"), null);
});
(0, node_test_1.test)("Windows action mode accepts standalone Shift and Alt only", () => {
    strict_1.default.equal((0, action_binding_1.validateActionCapture)({ modifiers: ["shift"], type: "chord" }, "win32"), null);
    strict_1.default.equal((0, action_binding_1.validateActionCapture)({ modifiers: ["alt"], type: "chord" }, "win32"), null);
    strict_1.default.match((0, action_binding_1.validateActionCapture)({ modifiers: ["ctrl"], type: "chord" }, "win32") ??
        "", /Ctrl on its own/);
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["shift"], type: "chord" }, "win32"), { modifiers: ["shift"], type: "chord" });
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["alt"], type: "chord" }, "win32"), { modifiers: ["alt"], type: "chord" });
});
(0, node_test_1.test)("Fn + Shift runs as an overlay only over a bare-Fn dictation shortcut", () => {
    const fnShift = { modifiers: ["shift"], type: "darwin-fn" };
    strict_1.default.equal((0, action_binding_1.actionRunsAsShiftOverlay)(fnShift, { type: "darwin-fn" }), true);
    // An Fn chord dictation shortcut has no spare Fn hold to overlay.
    strict_1.default.equal((0, action_binding_1.actionRunsAsShiftOverlay)(fnShift, { key: "2", type: "darwin-fn" }), false);
    strict_1.default.equal((0, action_binding_1.actionRunsAsShiftOverlay)(fnShift, altWin), false);
    strict_1.default.equal((0, action_binding_1.actionRunsAsShiftOverlay)(altWin, { type: "darwin-fn" }), false);
    strict_1.default.equal((0, action_binding_1.actionRunsAsShiftOverlay)(null, { type: "darwin-fn" }), false);
});
(0, node_test_1.test)("an Fn action binding keeps its Shift modifier through normalization", () => {
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["shift"], type: "darwin-fn" }, "darwin"), { modifiers: ["shift"], type: "darwin-fn" });
    // Off macOS there is no Fn key to hold.
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["shift"], type: "darwin-fn" }, "win32"), { modifiers: ["ctrl", "meta"], type: "chord" });
});
(0, node_test_1.test)("Windows action presets include Win+Z and side mouse buttons", () => {
    const labels = (0, action_binding_1.getActionPresetOptions)("win32").map((preset) => preset.label);
    strict_1.default.deepEqual(labels, [
        "Alt + Win",
        "Win + Z",
        "Ctrl + Win + Shift",
        "Mouse 4 - Back",
        "Mouse 5 - Forward",
    ]);
    strict_1.default.equal((0, action_binding_1.findMatchingActionPresetId)({ key: "Z", modifiers: ["meta"], type: "chord" }, "win32"), "meta-z");
});
(0, node_test_1.test)("Mac action presets omit Win+Z and Cmd+Z", () => {
    const labels = (0, action_binding_1.getActionPresetOptions)("darwin").map((preset) => preset.label);
    strict_1.default.deepEqual(labels, [
        "Option + Cmd",
        "Ctrl + Option",
        "Mouse 4 - Back",
        "Mouse 5 - Forward",
    ]);
    strict_1.default.equal((0, action_binding_1.findMatchingActionPresetId)({ key: "Z", modifiers: ["meta"], type: "chord" }, "darwin"), null);
});
(0, node_test_1.test)("null and unassigned stay unassigned on every platform", () => {
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)(null, "darwin"), null);
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)(null, "win32"), null);
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ type: "unassigned" }, "darwin"), null);
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ type: "unassigned" }, "win32"), null);
});
(0, node_test_1.test)("normalization rejects standalone modifiers for action mode", () => {
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({
        modifierKey: "meta-right",
        modifiers: ["meta"],
        type: "chord",
    }, "darwin"), null);
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ modifierKey: "meta-right", modifiers: ["meta"], type: "chord" }, "win32"), null);
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["ctrl", "meta"], type: "chord" }, "darwin"), { modifiers: ["ctrl", "meta"], type: "chord" });
});
(0, node_test_1.test)("normalization rejects targetless action chords", () => {
    for (const modifiers of [[], ["bogus"], ["ctrl"], ["meta"]]) {
        strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ modifiers, type: "chord" }, "win32"), null);
    }
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ modifiers: ["shift"], type: "chord" }, "darwin"), null);
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["shift"], type: "chord" }, "win32"), { modifiers: ["shift"], type: "chord" });
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["ctrl", "meta"], type: "chord" }, "win32"), { modifiers: ["ctrl", "meta"], type: "chord" });
});
(0, node_test_1.test)("a missing action binding falls back to each platform's default", () => {
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)(undefined, "win32"), {
        modifiers: ["alt", "meta"],
        type: "chord",
    });
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)(undefined, "darwin"), {
        modifiers: ["shift"],
        type: "darwin-fn",
    });
});
(0, node_test_1.test)("upgrade leaves action unassigned when dictation already uses Alt+Win", () => {
    strict_1.default.equal((0, action_binding_1.resolvePersistedActionBinding)(undefined, altWin, "win32"), null);
    strict_1.default.deepEqual((0, action_binding_1.resolvePersistedActionBinding)(undefined, { modifiers: ["ctrl", "meta"], type: "chord" }, "win32"), altWin);
});
(0, node_test_1.test)("rehydrate does not keep a stored action shortcut that collides with dictation", () => {
    strict_1.default.equal((0, action_binding_1.resolvePersistedActionBinding)(altWin, altWin, "win32"), null);
});
(0, node_test_1.test)("Windows listener args pass dictation and action as flags", () => {
    strict_1.default.deepEqual((0, windows_listener_args_1.windowsListenerCliArgs)({ modifiers: ["ctrl", "meta"], type: "chord" }, { key: "Z", modifiers: ["meta"], type: "chord" }, null), ["--dictation=Ctrl+Win", "--action=Win+Z"]);
    strict_1.default.deepEqual((0, windows_listener_args_1.windowsListenerCliArgs)({ modifiers: ["ctrl", "meta"], type: "chord" }, { modifiers: [], mouseButton: 4, type: "chord" }, { key: "H", modifiers: ["shift"], type: "chord" }), ["--dictation=Ctrl+Win", "--action=Mouse4", "--handsfree=Shift+H"]);
});
(0, node_test_1.test)("an Fn action binding that is not Fn + Shift is stored as unassigned", () => {
    // One native listener watches Fn and it drives the dictation hold, so
    // Fn + a key could never fire as a command.
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ key: "2", type: "darwin-fn" }, "darwin"), null);
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ type: "darwin-fn" }, "darwin"), null);
    // Shift plus another modifier would quietly behave as Fn + Shift.
    strict_1.default.equal((0, action_binding_1.normalizeActionBinding)({ modifiers: ["shift", "meta"], type: "darwin-fn" }, "darwin"), null);
    strict_1.default.deepEqual((0, action_binding_1.normalizeActionBinding)({ modifiers: ["shift"], type: "darwin-fn" }, "darwin"), { modifiers: ["shift"], type: "darwin-fn" });
});
(0, node_test_1.test)("upgrade turns the Shift overlay into a real action shortcut", () => {
    const fnShift = { modifiers: ["shift"], type: "darwin-fn" };
    const ctrlCmd = {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    };
    strict_1.default.deepEqual((0, action_binding_1.resolveOverlayPreferenceAction)(undefined, { type: "darwin-fn" }, true, "darwin"), fnShift);
    strict_1.default.deepEqual((0, action_binding_1.resolveOverlayPreferenceAction)(undefined, ctrlCmd, true, "darwin"), { modifiers: ["ctrl", "shift", "meta"], type: "chord" });
    strict_1.default.equal((0, action_binding_1.resolveOverlayPreferenceAction)(undefined, ctrlCmd, false, "darwin"), null);
    strict_1.default.deepEqual((0, action_binding_1.resolveOverlayPreferenceAction)(altWin, { type: "darwin-fn" }, true, "darwin"), altWin);
    strict_1.default.deepEqual((0, action_binding_1.resolveOverlayPreferenceAction)(fnShift, ctrlCmd, true, "darwin"), { modifiers: ["ctrl", "shift", "meta"], type: "chord" });
    strict_1.default.equal((0, action_binding_1.resolveOverlayPreferenceAction)(fnShift, ctrlCmd, false, "darwin"), null);
});
//# sourceMappingURL=action-binding.test.js.map
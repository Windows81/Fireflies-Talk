"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const polish_binding_1 = require("./polish-binding");
(0, node_test_1.test)("defaults to Fn + 1 on macOS and nothing elsewhere", () => {
    strict_1.default.deepEqual((0, polish_binding_1.defaultPolishBinding)("darwin"), {
        functionRowAlias: true,
        key: "1",
        type: "darwin-fn",
    });
    strict_1.default.equal((0, polish_binding_1.defaultPolishBinding)("win32"), null);
});
(0, node_test_1.test)("normalizes Fn chords and modifier chords, only on macOS", () => {
    strict_1.default.deepEqual((0, polish_binding_1.normalizePolishBinding)({ key: "j", type: "darwin-fn" }, "darwin"), {
        key: "J",
        type: "darwin-fn",
    });
    strict_1.default.deepEqual((0, polish_binding_1.normalizePolishBinding)({ key: "p", modifiers: ["shift", "ctrl"], type: "chord" }, "darwin"), { key: "P", modifiers: ["ctrl", "shift"], type: "chord" });
    strict_1.default.deepEqual((0, polish_binding_1.normalizePolishBinding)({ modifiers: ["alt"], mouseButton: 4, type: "chord" }, "darwin"), { modifiers: ["alt"], mouseButton: 4, type: "chord" });
    // Bare Fn is hold-to-dictate, not a polish trigger.
    strict_1.default.equal((0, polish_binding_1.normalizePolishBinding)({ type: "darwin-fn" }, "darwin"), null);
    // A stored chord polish cannot fire from is unusable, so polish falls back
    // to its default rather than silently switching itself off.
    for (const unusable of [
        { modifiers: ["ctrl"], type: "chord" },
        { modifiers: ["ctrl", "shift"], type: "chord" },
        { fn: true, key: "P", modifiers: ["ctrl"], type: "chord" },
        // A hand-edited or stale value must not bind polish to a bare or typed key.
        { key: "P", modifiers: [], type: "chord" },
        { key: "P", modifiers: ["shift"], type: "chord" },
    ]) {
        strict_1.default.deepEqual((0, polish_binding_1.normalizePolishBinding)(unusable, "darwin"), {
            functionRowAlias: true,
            key: "1",
            type: "darwin-fn",
        });
    }
    strict_1.default.equal((0, polish_binding_1.normalizePolishBinding)({ key: "1", type: "darwin-fn" }, "win32"), null);
    strict_1.default.equal((0, polish_binding_1.normalizePolishBinding)({ key: "P", modifiers: ["ctrl", "shift"], type: "chord" }, "win32"), null);
});
(0, node_test_1.test)("an explicit null clears the shortcut but undefined takes the default", () => {
    strict_1.default.equal((0, polish_binding_1.normalizePolishBinding)(null, "darwin"), null);
    strict_1.default.deepEqual((0, polish_binding_1.normalizePolishBinding)(undefined, "darwin"), {
        functionRowAlias: true,
        key: "1",
        type: "darwin-fn",
    });
});
(0, node_test_1.test)("the default answers to both 1 and F1, a recorded key only to itself", () => {
    strict_1.default.deepEqual((0, polish_binding_1.polishMacVirtualKeys)({
        functionRowAlias: true,
        key: "1",
        type: "darwin-fn",
    }), [0x12, 0x7a]);
    strict_1.default.deepEqual((0, polish_binding_1.polishMacVirtualKeys)({ key: "1", type: "darwin-fn" }), [
        0x12,
    ]);
    strict_1.default.deepEqual((0, polish_binding_1.polishMacVirtualKeys)({ key: "F1", type: "darwin-fn" }), [
        0x7a,
    ]);
    strict_1.default.deepEqual((0, polish_binding_1.polishMacVirtualKeys)({ key: "J", type: "darwin-fn" }), [
        0x26,
    ]);
    strict_1.default.deepEqual((0, polish_binding_1.polishMacVirtualKeys)(null), []);
    // A modifier chord runs on its own helper, so the Fn listener gets no keys.
    strict_1.default.deepEqual((0, polish_binding_1.polishMacVirtualKeys)({
        key: "P",
        modifiers: ["ctrl", "shift"],
        type: "chord",
    }), []);
});
(0, node_test_1.test)("maps virtual key codes back to a binding", () => {
    strict_1.default.deepEqual((0, polish_binding_1.polishBindingFromMacVirtualKey)(0x13), {
        key: "2",
        type: "darwin-fn",
    });
    strict_1.default.equal((0, polish_binding_1.polishBindingFromMacVirtualKey)(0x999), null);
});
(0, node_test_1.test)("labels and rejects", () => {
    strict_1.default.equal((0, polish_binding_1.formatPolishBindingLabel)({ key: "2", type: "darwin-fn" }), "Fn + 2");
    strict_1.default.equal((0, polish_binding_1.formatPolishBindingLabel)({
        key: "P",
        modifiers: ["ctrl", "shift"],
        type: "chord",
    }), "Ctrl + Shift + P");
    strict_1.default.equal((0, polish_binding_1.formatPolishBindingLabel)(null), "Unassigned");
    strict_1.default.equal((0, polish_binding_1.validatePolishCapture)({ key: "2", type: "darwin-fn" }), null);
    strict_1.default.equal((0, polish_binding_1.validatePolishCapture)({
        key: "P",
        modifiers: ["ctrl", "shift"],
        type: "chord",
    }), null);
    strict_1.default.equal((0, polish_binding_1.validatePolishCapture)({ modifiers: [], mouseButton: 4, type: "chord" }), null);
    strict_1.default.match((0, polish_binding_1.validatePolishCapture)({ type: "darwin-fn" }) ?? "", /Polish needs a key/);
    strict_1.default.match((0, polish_binding_1.validatePolishCapture)({ modifiers: ["shift"], type: "darwin-fn" }) ?? "", /Polish needs a key/);
    // Modifiers alone would fire partway through any shortcut that uses them.
    strict_1.default.match((0, polish_binding_1.validatePolishCapture)({ modifiers: ["ctrl", "meta"], type: "chord" }) ?? "", /Polish needs a key/);
    strict_1.default.match((0, polish_binding_1.validatePolishCapture)({
        modifierKey: "meta-right",
        modifiers: ["meta"],
        type: "chord",
    }) ?? "", /Polish needs a key/);
    // A key still needs a modifier, or typing that letter would polish.
    strict_1.default.match((0, polish_binding_1.validatePolishCapture)({ key: "K", modifiers: [], type: "chord" }) ?? "", /Add at least one modifier/);
    strict_1.default.match((0, polish_binding_1.validatePolishCapture)({
        fn: true,
        key: "K",
        modifiers: ["ctrl"],
        type: "chord",
    }) ?? "", /hold Fn and press one key/);
});
(0, node_test_1.test)("Shift alone cannot trigger polish over a key that types", () => {
    for (const key of ["P", "1", "Space", "Backquote"]) {
        strict_1.default.match((0, polish_binding_1.validatePolishCapture)({ key, modifiers: ["shift"], type: "chord" }) ?? "", /Shift on its own types capitals/);
    }
    // Nothing is typed with Shift + F5 or a side mouse button.
    strict_1.default.equal((0, polish_binding_1.validatePolishCapture)({ key: "F5", modifiers: ["shift"], type: "chord" }), null);
    strict_1.default.equal((0, polish_binding_1.validatePolishCapture)({
        modifiers: ["shift"],
        mouseButton: 4,
        type: "chord",
    }), null);
    strict_1.default.equal((0, polish_binding_1.validatePolishCapture)({
        key: "P",
        modifiers: ["ctrl", "shift"],
        type: "chord",
    }), null);
});
(0, node_test_1.test)("a polish chord cannot share its key with another chord", () => {
    const polish = {
        key: "D",
        modifiers: ["ctrl", "shift"],
        type: "chord",
    };
    strict_1.default.equal((0, polish_binding_1.polishSharesKey)(polish, {
        key: "D",
        modifiers: ["ctrl", "alt"],
        type: "chord",
    }), true);
    strict_1.default.equal((0, polish_binding_1.polishSharesKey)(polish, {
        key: "E",
        modifiers: ["ctrl", "shift"],
        type: "chord",
    }), false);
    // An Fn polish lives on the Fn listener and shares no chord helper.
    strict_1.default.equal((0, polish_binding_1.polishSharesKey)({ key: "D", type: "darwin-fn" }, { key: "D", modifiers: ["ctrl"], type: "chord" }), false);
    strict_1.default.equal((0, polish_binding_1.polishSharesKey)(null, polish), false);
    strict_1.default.equal((0, polish_binding_1.polishSharesKey)(polish, null), false);
});
//# sourceMappingURL=polish-binding.test.js.map
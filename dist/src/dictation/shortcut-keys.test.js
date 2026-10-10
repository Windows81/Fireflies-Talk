"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const shortcut_keys_1 = require("./shortcut-keys");
(0, node_test_1.test)("formats Fn plus a key on macOS", () => {
    strict_1.default.deepEqual((0, shortcut_keys_1.getDictationBindingKeycaps)({ key: "2", type: "darwin-fn" }, { isMac: true }), [{ label: "Fn" }, { label: "2" }]);
});
(0, node_test_1.test)("formats Ctrl plus Command on macOS", () => {
    strict_1.default.deepEqual((0, shortcut_keys_1.getDictationBindingKeycaps)({ modifiers: ["ctrl", "meta"], type: "chord" }, { isMac: true }), [
        { glyph: "⌃", label: "Ctrl" },
        { icon: "command", label: "Cmd" },
    ]);
});
(0, node_test_1.test)("formats Option on macOS", () => {
    strict_1.default.deepEqual((0, shortcut_keys_1.getDictationBindingKeycaps)({ modifiers: ["alt"], type: "chord" }, { isMac: true }), [{ glyph: "⌥", label: "Opt" }]);
});
(0, node_test_1.test)("marks right and left standalone modifiers", () => {
    strict_1.default.deepEqual((0, shortcut_keys_1.getDictationBindingKeycaps)({
        modifierKey: "meta-right",
        modifiers: ["meta"],
        type: "chord",
    }, { isMac: true }), [{ icon: "command", label: "Cmd", side: "right" }]);
    strict_1.default.deepEqual((0, shortcut_keys_1.getDictationBindingKeycaps)({
        modifierKey: "meta-left",
        modifiers: ["meta"],
        type: "chord",
    }, { isMac: true }), [{ icon: "command", label: "Cmd" }]);
});
(0, node_test_1.test)("formats Windows modifiers as labels", () => {
    strict_1.default.deepEqual((0, shortcut_keys_1.getDictationBindingKeycaps)({ modifiers: ["ctrl", "meta"], type: "chord" }, { isMac: false }), [{ label: "Ctrl" }, { icon: "windows", label: "Win" }]);
});
(0, node_test_1.test)("formats Fn with modifiers on macOS", () => {
    strict_1.default.deepEqual((0, shortcut_keys_1.getDictationBindingKeycaps)({ modifiers: ["meta", "shift"], type: "darwin-fn" }, { isMac: true }), [
        { label: "Fn" },
        { icon: "command", label: "Cmd" },
        { glyph: "⇧", label: "Shift" },
    ]);
});
//# sourceMappingURL=shortcut-keys.test.js.map
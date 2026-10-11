"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const reserved_shortcuts_1 = require("./reserved-shortcuts");
const chord = (modifiers, key, fn) => ({
    modifiers,
    type: "chord",
    ...(key ? { key } : {}),
    ...(fn ? { fn: true } : {}),
});
(0, node_test_1.default)("blocks macOS system and editor shortcuts", () => {
    for (const binding of [
        chord(["meta"], "C"),
        chord(["meta"], "Space"),
        chord(["meta", "shift"], "4"),
        chord(["ctrl"], "K"),
    ]) {
        strict_1.default.ok((0, reserved_shortcuts_1.reservedShortcutError)(binding, "darwin"), `expected ${JSON.stringify(binding)} to be reserved on macOS`);
    }
});
(0, node_test_1.default)("blocks Windows system and editor shortcuts", () => {
    for (const binding of [
        chord(["ctrl"], "C"),
        chord(["alt"], "F4"),
        chord(["shift"], "F3"),
    ]) {
        strict_1.default.ok((0, reserved_shortcuts_1.reservedShortcutError)(binding, "win32"), `expected ${JSON.stringify(binding)} to be reserved on Windows`);
    }
});
(0, node_test_1.default)("reserved lists are per platform", () => {
    // Cmd+C is macOS copy; Win+C is not a Windows shortcut we reserve.
    strict_1.default.ok((0, reserved_shortcuts_1.reservedShortcutError)(chord(["meta"], "C"), "darwin"));
    strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)(chord(["meta"], "C"), "win32"), null);
    // Ctrl+K is an editor binding on both.
    strict_1.default.ok((0, reserved_shortcuts_1.reservedShortcutError)(chord(["ctrl"], "K"), "darwin"));
    strict_1.default.ok((0, reserved_shortcuts_1.reservedShortcutError)(chord(["ctrl"], "K"), "win32"));
});
(0, node_test_1.default)("allows combinations no platform claims", () => {
    for (const binding of [
        chord(["meta", "shift"], "K"),
        chord(["ctrl", "alt"], "K"),
        chord(["ctrl", "alt"]),
    ]) {
        strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)(binding, "darwin"), null);
        strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)(binding, "win32"), null);
    }
});
(0, node_test_1.default)("Fn chords and standalone Fn are never reserved", () => {
    // Folding the Fn flag away would compare Fn+C against the plain Cmd+C entry.
    strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)(chord([], "C", true), "darwin"), null);
    strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)(chord([], "Z", true), "darwin"), null);
    strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)({ type: "darwin-fn" }, "darwin"), null);
});
(0, node_test_1.default)("mouse-button chords are never reserved", () => {
    strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)({ modifiers: [], type: "chord", mouseButton: 4 }, "darwin"), null);
});
(0, node_test_1.default)("unknown platforms reserve nothing", () => {
    strict_1.default.equal((0, reserved_shortcuts_1.reservedShortcutError)(chord(["meta"], "C"), "linux"), null);
});
(0, node_test_1.default)("the message names the clash and the owner", () => {
    strict_1.default.match((0, reserved_shortcuts_1.reservedShortcutError)(chord(["meta"], "C"), "darwin") ?? "", /Cmd \+ C is reserved by macOS/);
    strict_1.default.match((0, reserved_shortcuts_1.reservedShortcutError)(chord(["ctrl"], "C"), "win32") ?? "", /Ctrl \+ C is reserved by Windows/);
});
//# sourceMappingURL=reserved-shortcuts.test.js.map
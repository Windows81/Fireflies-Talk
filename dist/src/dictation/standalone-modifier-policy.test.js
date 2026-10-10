"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const standalone_modifier_policy_1 = require("./standalone-modifier-policy");
(0, node_test_1.test)("macOS allows every standalone modifier", () => {
    for (const modifier of ["alt", "ctrl", "meta", "shift"]) {
        strict_1.default.equal((0, standalone_modifier_policy_1.isStandaloneModifierAllowed)(modifier, "darwin"), true);
    }
});
(0, node_test_1.test)("Windows allows only standalone Shift and Alt", () => {
    strict_1.default.equal((0, standalone_modifier_policy_1.isStandaloneModifierAllowed)("shift", "win32"), true);
    strict_1.default.equal((0, standalone_modifier_policy_1.isStandaloneModifierAllowed)("alt", "win32"), true);
    strict_1.default.equal((0, standalone_modifier_policy_1.isStandaloneModifierAllowed)("ctrl", "win32"), false);
    strict_1.default.equal((0, standalone_modifier_policy_1.isStandaloneModifierAllowed)("meta", "win32"), false);
});
(0, node_test_1.test)("Windows errors explain how to extend rejected modifiers", () => {
    strict_1.default.equal((0, standalone_modifier_policy_1.standaloneModifierError)("ctrl", "win32"), "Ctrl on its own can't be the shortcut. Add another key, like Ctrl + Win.");
    strict_1.default.equal((0, standalone_modifier_policy_1.standaloneModifierError)("meta", "win32"), "The Windows key on its own can't be the shortcut. Add another key, like Ctrl + Win.");
});
//# sourceMappingURL=standalone-modifier-policy.test.js.map
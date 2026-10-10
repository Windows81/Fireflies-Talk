"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_accessibility_policy_1 = require("./dictation-accessibility-policy");
(0, node_test_1.test)("never shows the Accessibility prompt on Windows", () => {
    strict_1.default.equal((0, dictation_accessibility_policy_1.shouldShowDictationAccessibilityPrompt)("win32", false), false);
    strict_1.default.equal((0, dictation_accessibility_policy_1.shouldShowDictationAccessibilityPrompt)("win32", true), false);
});
(0, node_test_1.test)("never shows the Accessibility prompt on Linux", () => {
    strict_1.default.equal((0, dictation_accessibility_policy_1.shouldShowDictationAccessibilityPrompt)("linux", false), false);
});
(0, node_test_1.test)("shows the Accessibility prompt on macOS only when permission is missing", () => {
    strict_1.default.equal((0, dictation_accessibility_policy_1.shouldShowDictationAccessibilityPrompt)("darwin", false), true);
    strict_1.default.equal((0, dictation_accessibility_policy_1.shouldShowDictationAccessibilityPrompt)("darwin", true), false);
});
(0, node_test_1.test)("treats only the denied-to-granted edge as a new Accessibility grant", () => {
    strict_1.default.equal((0, dictation_accessibility_policy_1.accessibilityBecameGranted)(null, false), false);
    strict_1.default.equal((0, dictation_accessibility_policy_1.accessibilityBecameGranted)(null, true), false);
    strict_1.default.equal((0, dictation_accessibility_policy_1.accessibilityBecameGranted)(false, false), false);
    strict_1.default.equal((0, dictation_accessibility_policy_1.accessibilityBecameGranted)(true, true), false);
    strict_1.default.equal((0, dictation_accessibility_policy_1.accessibilityBecameGranted)(true, false), false);
    strict_1.default.equal((0, dictation_accessibility_policy_1.accessibilityBecameGranted)(false, true), true);
});
//# sourceMappingURL=dictation-accessibility-policy.test.js.map
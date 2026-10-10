"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldShowDictationAccessibilityPrompt = shouldShowDictationAccessibilityPrompt;
exports.accessibilityBecameGranted = accessibilityBecameGranted;
/** Accessibility is a macOS TCC requirement. Windows must never take this path. */
function shouldShowDictationAccessibilityPrompt(platform, granted) {
    return platform === "darwin" && !granted;
}
/** True only on the denied → granted edge. Null previous is the first sample. */
function accessibilityBecameGranted(previous, next) {
    return previous === false && next;
}
//# sourceMappingURL=dictation-accessibility-policy.js.map
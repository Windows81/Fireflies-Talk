"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDictationAccessibility = hasDictationAccessibility;
exports.openDictationAccessibilitySettings = openDictationAccessibilitySettings;
exports.startDictationAccessibilityWatch = startDictationAccessibilityWatch;
exports.stopDictationAccessibilityWatch = stopDictationAccessibilityWatch;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const permissions_1 = require("../permissions");
const dictation_accessibility_policy_1 = require("./dictation-accessibility-policy");
const GRANT_POLL_MS = 800;
let grantWatchTimer = null;
let grantWatchSnapshot = null;
let onAccessibilityGranted = null;
/** macOS Accessibility is required to paste and to read the Fn/Globe hotkey. */
function hasDictationAccessibility() {
    if (process.platform !== "darwin")
        return true;
    return electron_1.systemPreferences.isTrustedAccessibilityClient(false);
}
function openDictationAccessibilitySettings() {
    if (process.platform !== "darwin")
        return;
    (0, permissions_1.openPermissionSettings)("accessibility");
}
/** Restart listeners when Accessibility is granted without an app relaunch. */
function startDictationAccessibilityWatch(onGranted) {
    if (process.platform !== "darwin")
        return;
    onAccessibilityGranted = onGranted;
    if (grantWatchTimer)
        return;
    grantWatchSnapshot = hasDictationAccessibility();
    grantWatchTimer = setInterval(pollDictationAccessibilityGrant, GRANT_POLL_MS);
}
function stopDictationAccessibilityWatch() {
    onAccessibilityGranted = null;
    grantWatchSnapshot = null;
    if (!grantWatchTimer)
        return;
    clearInterval(grantWatchTimer);
    grantWatchTimer = null;
}
function pollDictationAccessibilityGrant() {
    const granted = hasDictationAccessibility();
    const becameGranted = (0, dictation_accessibility_policy_1.accessibilityBecameGranted)(grantWatchSnapshot, granted);
    grantWatchSnapshot = granted;
    if (!becameGranted)
        return;
    electron_log_1.default.info("[Dictation] Accessibility permission granted");
    onAccessibilityGranted?.();
}
//# sourceMappingURL=dictation-accessibility.js.map
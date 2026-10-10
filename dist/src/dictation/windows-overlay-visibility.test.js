"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const windows_overlay_visibility_1 = require("./windows-overlay-visibility");
(0, node_test_1.test)("rescues a Windows overlay Windows hid with the main window", () => {
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldRescueWindowsOverlay)({
        platform: "win32",
        intendedVisible: true,
        windowVisible: false,
        alwaysOnTop: true,
        demoted: false,
    }), true);
});
(0, node_test_1.test)("rescues a Windows overlay that lost always-on-top", () => {
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldRescueWindowsOverlay)({
        platform: "win32",
        intendedVisible: true,
        windowVisible: true,
        alwaysOnTop: false,
        demoted: false,
    }), true);
});
(0, node_test_1.test)("rescues a Windows overlay stacked below ordinary windows behind its style", () => {
    // The state that hid the pill for hours: visible, style says topmost, yet
    // Slack and Chrome sat above it. Only the Z-order walk sees it.
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldRescueWindowsOverlay)({
        platform: "win32",
        intendedVisible: true,
        windowVisible: true,
        alwaysOnTop: true,
        demoted: true,
    }), true);
});
(0, node_test_1.test)("leaves an intentional hide alone", () => {
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldRescueWindowsOverlay)({
        platform: "win32",
        intendedVisible: false,
        windowVisible: false,
        alwaysOnTop: false,
        demoted: true,
    }), false);
});
(0, node_test_1.test)("does not touch macOS overlays", () => {
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldRescueWindowsOverlay)({
        platform: "darwin",
        intendedVisible: true,
        windowVisible: false,
        alwaysOnTop: false,
        demoted: true,
    }), false);
});
(0, node_test_1.test)("flips through another window before clearing a Windows owner", () => {
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldFlipParentToClearOwner)({
        platform: "win32",
        hasOtherWindow: true,
    }), true);
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldFlipParentToClearOwner)({
        platform: "win32",
        hasOtherWindow: false,
    }), false);
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldFlipParentToClearOwner)({
        platform: "darwin",
        hasOtherWindow: true,
    }), false);
});
(0, node_test_1.test)("does not flip through a window that already belongs to the owner", () => {
    strict_1.default.equal((0, windows_overlay_visibility_1.isDetachFlipCandidate)({
        isSelf: false,
        isDestroyed: false,
        isOwnedByTarget: true,
    }), false);
    strict_1.default.equal((0, windows_overlay_visibility_1.isDetachFlipCandidate)({
        isSelf: false,
        isDestroyed: false,
        isOwnedByTarget: false,
    }), true);
});
(0, node_test_1.test)("leaves a healthy visible overlay alone", () => {
    strict_1.default.equal((0, windows_overlay_visibility_1.shouldRescueWindowsOverlay)({
        platform: "win32",
        intendedVisible: true,
        windowVisible: true,
        alwaysOnTop: true,
        demoted: false,
    }), false);
});
//# sourceMappingURL=windows-overlay-visibility.test.js.map
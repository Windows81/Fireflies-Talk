"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const windows_overlay_activation_1 = require("./windows-overlay-activation");
(0, node_test_1.test)("guards a live overlay on Windows", () => {
    strict_1.default.equal((0, windows_overlay_activation_1.shouldGuardWindowsOverlayActivation)({
        platform: "win32",
        destroyed: false,
    }), true);
});
(0, node_test_1.test)("skips a destroyed overlay", () => {
    strict_1.default.equal((0, windows_overlay_activation_1.shouldGuardWindowsOverlayActivation)({
        platform: "win32",
        destroyed: true,
    }), false);
});
(0, node_test_1.test)("does not touch macOS or Linux overlays", () => {
    strict_1.default.equal((0, windows_overlay_activation_1.shouldGuardWindowsOverlayActivation)({
        platform: "darwin",
        destroyed: false,
    }), false);
    strict_1.default.equal((0, windows_overlay_activation_1.shouldGuardWindowsOverlayActivation)({
        platform: "linux",
        destroyed: false,
    }), false);
});
//# sourceMappingURL=windows-overlay-activation.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const shortcut_capture_modifiers_1 = require("./shortcut-capture-modifiers");
const none = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
};
(0, node_test_1.test)("swallowed Win still counts as a meta modifier while recording", () => {
    strict_1.default.deepEqual((0, shortcut_capture_modifiers_1.modifiersFromCaptureFlags)(none, true), ["meta"]);
    strict_1.default.deepEqual((0, shortcut_capture_modifiers_1.modifiersFromCaptureFlags)({ ...none, altKey: true }, true), [
        "alt",
        "meta",
    ]);
});
(0, node_test_1.test)("capture is not fully released until swallowed Win is up", () => {
    strict_1.default.equal((0, shortcut_capture_modifiers_1.isCaptureFullyReleased)(none, true), false);
    strict_1.default.equal((0, shortcut_capture_modifiers_1.isCaptureFullyReleased)(none, false), true);
    strict_1.default.equal((0, shortcut_capture_modifiers_1.isCaptureFullyReleased)({ ...none, altKey: true }, false), false);
});
//# sourceMappingURL=shortcut-capture-modifiers.test.js.map
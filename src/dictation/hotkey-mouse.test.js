"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const hotkey_mouse_1 = require("./hotkey-mouse");
(0, node_test_1.test)("left, middle, and right clicks are not intercepted during shortcut capture", () => {
    strict_1.default.equal((0, hotkey_mouse_1.shouldInterceptMouseCapture)(0), false);
    strict_1.default.equal((0, hotkey_mouse_1.shouldInterceptMouseCapture)(1), false);
    strict_1.default.equal((0, hotkey_mouse_1.shouldInterceptMouseCapture)(2), false);
});
(0, node_test_1.test)("side mouse buttons are intercepted during shortcut capture", () => {
    strict_1.default.equal((0, hotkey_mouse_1.shouldInterceptMouseCapture)(3), true);
    strict_1.default.equal((0, hotkey_mouse_1.shouldInterceptMouseCapture)(4), true);
    strict_1.default.equal((0, hotkey_mouse_1.mouseButtonFromDomButton)(3), 4);
    strict_1.default.equal((0, hotkey_mouse_1.mouseButtonFromDomButton)(4), 5);
});
(0, node_test_1.test)("app-command history maps to Mouse 4 and Mouse 5", () => {
    strict_1.default.equal((0, hotkey_mouse_1.mouseButtonFromAppCommand)("browser-backward"), 4);
    strict_1.default.equal((0, hotkey_mouse_1.mouseButtonFromAppCommand)("browser-forward"), 5);
    strict_1.default.equal((0, hotkey_mouse_1.mouseButtonFromAppCommand)("search"), null);
});
(0, node_test_1.test)("native capture lines map to side buttons", () => {
    strict_1.default.deepEqual((0, hotkey_mouse_1.parseCaptureMouseLine)("MOUSE4_DOWN"), {
        button: 4,
        down: true,
    });
    strict_1.default.deepEqual((0, hotkey_mouse_1.parseCaptureMouseLine)("MOUSE5_UP 1001"), {
        button: 5,
        down: false,
        flags: { altKey: false, ctrlKey: true, metaKey: true, shiftKey: false },
    });
    strict_1.default.equal((0, hotkey_mouse_1.parseCaptureMouseLine)("WIN_DOWN"), null);
});
(0, node_test_1.test)("mouse shortcut labels use a dash so Custom wrapping has no nested parentheses", () => {
    strict_1.default.equal((0, hotkey_mouse_1.formatMouseLabel)(4), "Mouse 4 - Back");
    strict_1.default.equal((0, hotkey_mouse_1.formatMouseLabel)(5), "Mouse 5 - Forward");
    strict_1.default.equal((0, hotkey_mouse_1.formatCustomShortcutOption)((0, hotkey_mouse_1.formatMouseLabel)(5)), "Custom - Mouse 5 - Forward");
    strict_1.default.equal((0, hotkey_mouse_1.formatCustomShortcutOption)((0, hotkey_mouse_1.formatMouseLabel)(5)).includes("("), false);
});
//# sourceMappingURL=hotkey-mouse.test.js.map
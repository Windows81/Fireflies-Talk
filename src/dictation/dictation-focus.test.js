"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
let windows = [];
node_test_1.mock.module("electron", {
    namedExports: { BrowserWindow: { getAllWindows: () => windows } },
});
const load = () => import("./dictation-focus.js");
const originalPlatform = process.platform;
const setPlatform = (platform) => {
    Object.defineProperty(process, "platform", { value: platform });
};
function fakeWindow(options) {
    const blurred = [];
    const window = {
        isDestroyed: () => options.destroyed ?? false,
        isFocused: () => options.focused,
        blur: () => blurred.push(true),
    };
    return { window, blurred };
}
(0, node_test_1.test)("a focused Fireflies window is blurred and reported", async (t) => {
    setPlatform("darwin");
    t.after(() => setPlatform(originalPlatform));
    const focused = fakeWindow({ focused: true });
    const other = fakeWindow({ focused: false });
    windows = [other.window, focused.window];
    const { resignFirefliesKeyWindow } = await load();
    strict_1.default.equal(resignFirefliesKeyWindow(), true);
    strict_1.default.equal(focused.blurred.length, 1);
    strict_1.default.equal(other.blurred.length, 0);
});
(0, node_test_1.test)("nothing is reported when no Fireflies window has focus", async (t) => {
    setPlatform("darwin");
    t.after(() => setPlatform(originalPlatform));
    const idle = fakeWindow({ focused: false });
    const gone = fakeWindow({ focused: true, destroyed: true });
    windows = [idle.window, gone.window];
    const { resignFirefliesKeyWindow } = await load();
    strict_1.default.equal(resignFirefliesKeyWindow(), false);
    strict_1.default.equal(gone.blurred.length, 0);
});
(0, node_test_1.test)("other platforms leave windows alone", async (t) => {
    setPlatform("win32");
    t.after(() => setPlatform(originalPlatform));
    const focused = fakeWindow({ focused: true });
    windows = [focused.window];
    const { resignFirefliesKeyWindow } = await load();
    strict_1.default.equal(resignFirefliesKeyWindow(), false);
    strict_1.default.equal(focused.blurred.length, 0);
});
//# sourceMappingURL=dictation-focus.test.js.map
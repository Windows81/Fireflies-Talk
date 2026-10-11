"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = require("node:test");
const node_url_1 = require("node:url");
const secureRequireModule = (0, node_url_1.pathToFileURL)(node_path_1.default.resolve(process.cwd(), "src", "secure-require.ts")).href;
const prevented = [];
node_test_1.mock.module("electron-log", {
    defaultExport: { info() { }, warn() { }, error() { }, debug() { } },
});
node_test_1.mock.module(secureRequireModule, {
    namedExports: {
        secureRequire: () => ({
            isAvailable: true,
            preventActivation(handle) {
                prevented.push(handle);
                return true;
            },
        }),
    },
});
function fakeWindow(id, destroyed = false) {
    return {
        handle: { id },
        isDestroyed: () => destroyed,
        getNativeWindowHandle() {
            return this.handle;
        },
    };
}
const load = async () => {
    const mod = await import("./macos-panel-activation.js");
    return mod.keepMacPanelFromActivating;
};
function withPlatform(t, value) {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value });
    t.after(() => Object.defineProperty(process, "platform", platform));
}
(0, node_test_1.test)("marks a live macOS panel as never activating the app", async (t) => {
    withPlatform(t, "darwin");
    prevented.length = 0;
    const keepMacPanelFromActivating = await load();
    const pill = fakeWindow(1);
    keepMacPanelFromActivating(pill);
    strict_1.default.deepEqual(prevented, [pill.handle]);
});
(0, node_test_1.test)("leaves destroyed windows and other platforms alone", async (t) => {
    prevented.length = 0;
    const keepMacPanelFromActivating = await load();
    withPlatform(t, "darwin");
    keepMacPanelFromActivating(fakeWindow(2, true));
    Object.defineProperty(process, "platform", { value: "win32" });
    keepMacPanelFromActivating(fakeWindow(3));
    strict_1.default.deepEqual(prevented, []);
});
//# sourceMappingURL=macos-panel-activation.test.js.map
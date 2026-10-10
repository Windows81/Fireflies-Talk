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
/** Fake native addon: records the handles it touched and the observer state. */
const fakeNative = {
    isAvailable: true,
    followed: [],
    onActive: new Set(),
    observer: null,
    followActiveSpace(handle) {
        fakeNative.followed.push(handle);
        return true;
    },
    isOnActiveSpace: (handle) => fakeNative.onActive.has(handle),
    startActiveSpaceObserver(callback) {
        fakeNative.observer = callback;
    },
    stopActiveSpaceObserver() {
        fakeNative.observer = null;
    },
};
node_test_1.mock.module("electron-log", {
    defaultExport: { info() { }, warn() { }, error() { }, debug() { } },
});
node_test_1.mock.module(secureRequireModule, {
    namedExports: { secureRequire: () => fakeNative },
});
function fakeWindow(id) {
    const listeners = {};
    const win = {
        handle: { id },
        destroyed: false,
        visible: true,
        allWorkspaces: false,
        order: [],
        isDestroyed: () => win.destroyed,
        isVisible: () => win.visible,
        getNativeWindowHandle: () => win.handle,
        setVisibleOnAllWorkspaces: () => {
            win.allWorkspaces = true;
        },
        hide() {
            win.order.push("hide");
        },
        showInactive() {
            win.order.push("showInactive");
        },
        once(event, listener) {
            listeners[event] = listener;
        },
        close() {
            win.destroyed = true;
            listeners.closed?.();
        },
    };
    return win;
}
const load = async () => {
    const mod = await import("./macos-spaces.js");
    return mod.keepWindowOnActiveSpace;
};
(0, node_test_1.test)("follows the active Space and re-shows windows on Space change", async (t) => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });
    t.after(() => Object.defineProperty(process, "platform", platform));
    const keepWindowOnActiveSpace = await load();
    const pill = fakeWindow(1);
    const card = fakeWindow(2);
    keepWindowOnActiveSpace(pill);
    keepWindowOnActiveSpace(card);
    keepWindowOnActiveSpace(pill);
    strict_1.default.equal(pill.allWorkspaces, false, "never falls back to all Spaces");
    strict_1.default.deepEqual(fakeNative.followed, [
        pill.handle,
        card.handle,
        pill.handle,
    ]);
    strict_1.default.ok(fakeNative.observer, "observer started with the first window");
    // A Space change re-applies the follow behavior and re-shows each visible,
    // off-Space window through Electron so Chromium keeps the contents visible.
    fakeNative.followed.length = 0;
    fakeNative.observer?.();
    strict_1.default.deepEqual(fakeNative.followed, [pill.handle, card.handle]);
    strict_1.default.deepEqual(pill.order, ["hide", "showInactive"]);
    strict_1.default.deepEqual(card.order, ["hide", "showInactive"]);
    // A window already on the active Space is left untouched.
    fakeNative.followed.length = 0;
    pill.order.length = 0;
    card.order.length = 0;
    fakeNative.onActive.add(pill.handle);
    fakeNative.observer?.();
    strict_1.default.deepEqual(fakeNative.followed, [card.handle]);
    strict_1.default.deepEqual(pill.order, []);
    strict_1.default.deepEqual(card.order, ["hide", "showInactive"]);
    fakeNative.onActive.clear();
    // A hidden window is left untouched.
    fakeNative.followed.length = 0;
    pill.order.length = 0;
    card.order.length = 0;
    card.visible = false;
    fakeNative.observer?.();
    strict_1.default.deepEqual(fakeNative.followed, [pill.handle]);
    strict_1.default.deepEqual(pill.order, ["hide", "showInactive"]);
    strict_1.default.deepEqual(card.order, []);
    card.visible = true;
    // Closed windows drop out; the observer stops once none are left.
    card.close();
    fakeNative.followed.length = 0;
    pill.order.length = 0;
    fakeNative.observer?.();
    strict_1.default.deepEqual(fakeNative.followed, [pill.handle]);
    strict_1.default.deepEqual(pill.order, ["hide", "showInactive"]);
    pill.close();
    strict_1.default.equal(fakeNative.observer, null);
    // Destroyed without `closed` (listeners removed first): pruned on the next
    // Space change and the observer stops.
    const orb = fakeWindow(3);
    keepWindowOnActiveSpace(orb);
    strict_1.default.ok(fakeNative.observer, "observer restarts for a new window");
    orb.destroyed = true;
    fakeNative.followed.length = 0;
    const onSpaceChange = fakeNative.observer;
    onSpaceChange?.();
    strict_1.default.deepEqual(fakeNative.followed, []);
    strict_1.default.deepEqual(orb.order, []);
    strict_1.default.equal(fakeNative.observer, null);
});
//# sourceMappingURL=macos-spaces.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_test_1 = require("node:test");
// The fake screen reports wherever the test last put the cursor.
const cursor = { x: -100, y: -100 };
node_test_1.mock.module("electron", {
    namedExports: {
        screen: { getCursorScreenPoint: () => ({ x: cursor.x, y: cursor.y }) },
    },
});
node_test_1.mock.module("electron-log", {
    namedExports: {
        warn: () => undefined,
        error: () => undefined,
        info: () => undefined,
        debug: () => undefined,
        verbose: () => undefined,
    },
});
// Imported lazily, inside the tests, so the mocks above are already in place.
const loadMouse = () => import("./mouse.js");
const OPAQUE = { toBitmap: () => new Uint8Array([0, 0, 0, 255]) };
const CLEAR = { toBitmap: () => new Uint8Array([0, 0, 0, 0]) };
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
function createContents(image = async () => OPAQUE) {
    const captures = [];
    const emitter = new node_events_1.EventEmitter();
    const contents = emitter;
    contents.capturePage = async (rect) => {
        captures.push({ x: rect.x, y: rect.y });
        return image();
    };
    return { contents: contents, emitter, captures };
}
function createWindow(contents) {
    const emitter = new node_events_1.EventEmitter();
    const ignores = [];
    let focuses = 0;
    const win = {
        webContents: contents,
        isDestroyed: () => false,
        isVisible: () => true,
        getPosition: () => [0, 0],
        getSize: () => [100, 100],
        setIgnoreMouseEvents: (ignore) => {
            ignores.push(ignore);
        },
        focus: () => {
            focuses += 1;
        },
        on: emitter.on.bind(emitter),
        removeListener: emitter.removeListener.bind(emitter),
    };
    return {
        win,
        ignores,
        emitter,
        getFocusCount: () => focuses,
        getListenerCount: (event) => emitter.listenerCount(event),
    };
}
const move = (emitter, x, y) => emitter.emit("input-event", {}, { type: "mouseMove", x, y });
(0, node_test_1.test)("an overlay starts click-through and wakes on the first opaque move", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    const { contents, emitter } = createContents();
    const { win, ignores } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    strict_1.default.deepEqual(ignores, [true], "starts click-through without a sample");
    move(emitter, 10, 10);
    await tick();
    strict_1.default.deepEqual(ignores, [true, false], "interactive on the first move");
});
(0, node_test_1.test)("a move onto transparent pixels hands the window back through", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    let alpha = 255;
    const { contents, emitter } = createContents(async () => (alpha ? OPAQUE : CLEAR));
    const { win, ignores } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    move(emitter, 10, 10);
    await tick();
    alpha = 0;
    move(emitter, 12, 12);
    await tick();
    strict_1.default.deepEqual(ignores, [true, false, true]);
});
(0, node_test_1.test)("repeated moves over the same state do not re-apply it", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    const { contents, emitter, captures } = createContents();
    const { win, ignores } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    move(emitter, 10, 10);
    await tick();
    move(emitter, 11, 11);
    move(emitter, 12, 12);
    await tick();
    strict_1.default.equal(captures.length, 3, "every move samples");
    strict_1.default.deepEqual(ignores, [true, false], "the state is applied once");
});
(0, node_test_1.test)("moves landing mid-capture coalesce into one re-sample at the latest point", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    let release = () => undefined;
    const pending = new Promise((resolve) => {
        release = resolve;
    });
    const { contents, emitter, captures } = createContents(() => pending);
    const { win } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    move(emitter, 1, 1);
    move(emitter, 2, 2);
    move(emitter, 9, 9);
    release(OPAQUE);
    await tick();
    strict_1.default.deepEqual(captures, [
        { x: 1, y: 1 },
        { x: 9, y: 9 },
    ]);
});
(0, node_test_1.test)("the Live window focuses when the cursor reaches opaque chrome", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    const { contents, emitter } = createContents();
    const { win, ignores, getFocusCount } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, true);
    move(emitter, 10, 10);
    await tick();
    strict_1.default.deepEqual(ignores, [false]);
    strict_1.default.equal(getFocusCount(), 1);
});
(0, node_test_1.test)("a replaced sampler unhooks its window listeners", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    const { contents } = createContents();
    const { win, emitter, getListenerCount } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    // The compact window is reused across mode switches; each replacement
    // must drop the old pair or listeners accumulate to the warning cap.
    strict_1.default.equal(getListenerCount("close"), 1);
    strict_1.default.equal(getListenerCount("closed"), 1);
    emitter.emit("close");
    strict_1.default.equal(getListenerCount("close"), 0);
    strict_1.default.equal(getListenerCount("closed"), 0);
});
(0, node_test_1.test)("a stopped sampler's in-flight capture cannot overwrite its replacement", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    let release = () => undefined;
    const pending = new Promise((resolve) => {
        release = resolve;
    });
    const { contents, emitter } = createContents(() => pending);
    const { win, ignores } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    move(emitter, 10, 10); // sampler 1's capture is now in flight
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false); // stops it
    release(OPAQUE);
    await tick();
    strict_1.default.deepEqual(ignores, [true, true], "the stale capture wrote nothing");
});
(0, node_test_1.test)("a second sampler on the same window replaces the first", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    const { contents, emitter, captures } = createContents();
    const { win } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    startIgnoreMouseEventsByAlpha(win, contents, 60000, false);
    strict_1.default.equal(emitter.listenerCount("input-event"), 1);
    move(emitter, 10, 10);
    await tick();
    strict_1.default.equal(captures.length, 1, "one sampler captures each move");
});
(0, node_test_1.test)("the fallback poll still samples when no input events arrive", async () => {
    const { startIgnoreMouseEventsByAlpha } = await loadMouse();
    const { contents, captures } = createContents();
    const { win, ignores } = createWindow(contents);
    startIgnoreMouseEventsByAlpha(win, contents, 5, false);
    cursor.x = 50;
    cursor.y = 50;
    await tick();
    strict_1.default.ok(captures.length > 0, "the poll samples the cursor position");
    strict_1.default.deepEqual(ignores, [true, false]);
});
//# sourceMappingURL=mouse.test.js.map
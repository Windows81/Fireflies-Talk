"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_stream_1 = require("node:stream");
const node_test_1 = require("node:test");
class FakeHelper extends node_events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.stdout = new node_stream_1.PassThrough();
        this.stderr = new node_events_1.EventEmitter();
        this.kill = () => true;
    }
}
const helpers = [];
node_test_1.mock.module("child_process", {
    namedExports: {
        spawn: () => {
            const helper = new FakeHelper();
            helpers.push(helper);
            return helper;
        },
    },
});
node_test_1.mock.module("electron", { namedExports: { app: { isPackaged: false } } });
node_test_1.mock.module("electron-log", {
    namedExports: { error: () => undefined, info: () => undefined },
});
// Imported lazily, inside the tests, so the mocks above are already in place.
const loadListener = () => import("./macos-chord-listener.js");
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
function recordCallbacks() {
    const calls = [];
    const callbacks = {
        onDown: () => calls.push("down"),
        onHandsFreeDown: () => calls.push("handsFreeDown"),
        onInterrupted: () => calls.push("interrupted"),
        onPolish: () => calls.push("polish"),
        onShiftChange: (down) => calls.push(down ? "shiftDown" : "shiftUp"),
        onUp: () => calls.push("up"),
    };
    return { calls, callbacks };
}
async function emitLines(lines) {
    helpers.at(-1).stdout.write(lines.map((line) => `${line}\n`).join(""));
    await tick();
}
const HELPER_LINES = [
    "SHIFT_DOWN",
    "KEY_DOWN",
    "KEY_INTERRUPTED",
    "KEY_UP",
    "SHIFT_UP",
];
(0, node_test_1.test)("a polish chord only reports its press", async (t) => {
    const { startMacosChordListener, stopMacosChordListener } = await loadListener();
    t.after(() => stopMacosChordListener());
    const { calls, callbacks } = recordCallbacks();
    startMacosChordListener("polish", callbacks, ["--ctrl", "--shift"]);
    await emitLines(HELPER_LINES);
    strict_1.default.deepEqual(calls, ["polish"]);
});
(0, node_test_1.test)("a hands-free chord still reports interruptions", async (t) => {
    const { startMacosChordListener, stopMacosChordListener } = await loadListener();
    t.after(() => stopMacosChordListener());
    const { calls, callbacks } = recordCallbacks();
    startMacosChordListener("handsFree", callbacks, ["--ctrl", "--shift"]);
    await emitLines(HELPER_LINES);
    strict_1.default.deepEqual(calls, ["handsFreeDown", "interrupted"]);
});
//# sourceMappingURL=macos-chord-listener.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_stream_1 = require("node:stream");
const node_test_1 = require("node:test");
const windows_listener_supervisor_1 = require("./windows-listener-supervisor");
class FakeChild extends node_events_1.EventEmitter {
    constructor(args) {
        super();
        this.stdout = new node_stream_1.PassThrough();
        this.stderr = new node_stream_1.PassThrough();
        this.stdin = new node_stream_1.PassThrough();
        this.killed = false;
        this.exited = false;
        this.args = args;
        FakeChild.spawned.push(this);
    }
    kill() {
        this.killed = true;
        return true;
    }
    /** The OS reports the exit on a later tick, after any replacement spawned. */
    exit(signal = "SIGTERM") {
        this.exited = true;
        this.emit("exit", signal ? null : 0, signal);
    }
    writeLine(line) {
        this.stdout.write(`${line}\n`);
    }
}
FakeChild.spawned = [];
function mockModule(specifier, exports) {
    node_test_1.mock.module(specifier, {
        exports,
    });
}
mockModule("electron", {
    app: { isPackaged: false },
    BrowserWindow: { getAllWindows: () => [] },
});
mockModule("electron-log", {
    default: { info() { }, warn() { }, error() { } },
});
mockModule("child_process", {
    spawn: (_binary, args) => new FakeChild(args),
});
const loadListener = () => import("./windows-key-listener.js");
function callbacks() {
    const cb = {
        downs: 0,
        onDown() {
            cb.downs++;
        },
        onUp() { },
        onShiftChange() { },
        onInterrupted() { },
    };
    return cb;
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
node_test_1.test.beforeEach(async () => {
    (await loadListener()).stopWindowsKeyListener();
    for (const child of FakeChild.spawned) {
        if (!child.exited)
            child.exit();
    }
    FakeChild.spawned.length = 0;
});
(0, node_test_1.test)("replacing the shortcut keeps the new listener after the old one exits", async () => {
    const listener = await loadListener();
    const cb = callbacks();
    listener.startWindowsKeyListener(cb, ["--dictation=Mouse4"]);
    listener.stopWindowsKeyListener();
    listener.startWindowsKeyListener(cb, ["--dictation=Ctrl+Win"]);
    const [mouse] = FakeChild.spawned;
    strict_1.default.ok(mouse.killed);
    strict_1.default.equal(FakeChild.spawned.length, 1, "the replacement waits until the old helper has exited");
    mouse.exit();
    const chord = FakeChild.spawned[1];
    strict_1.default.deepEqual(chord.args, ["--dictation=Ctrl+Win"]);
    strict_1.default.equal(listener.isWindowsKeyListenerRunning(), true);
    listener.stopWindowsKeyListener();
    strict_1.default.ok(chord.killed, "the replacement must still be reachable to stop");
});
(0, node_test_1.test)("a replaced listener cannot start dictation while it shuts down", async () => {
    const listener = await loadListener();
    const cb = callbacks();
    listener.startWindowsKeyListener(cb, ["--dictation=Mouse4"]);
    listener.stopWindowsKeyListener();
    listener.startWindowsKeyListener(cb, ["--dictation=Ctrl+Win"]);
    const [mouse] = FakeChild.spawned;
    mouse.writeLine("KEY_DOWN");
    await flush();
    strict_1.default.equal(cb.downs, 0);
    mouse.exit();
    const chord = FakeChild.spawned[1];
    chord.writeLine("KEY_DOWN");
    await flush();
    strict_1.default.equal(cb.downs, 1);
});
(0, node_test_1.test)("a stopped helper that ignores the kill is forced out, then waited for", async () => {
    const listener = await loadListener();
    node_test_1.mock.timers.enable({ apis: ["setTimeout"] });
    try {
        listener.startWindowsKeyListener(callbacks(), ["--dictation=Ctrl+Win"]);
        listener.stopWindowsKeyListener();
        const [stuck] = FakeChild.spawned;
        const kill = node_test_1.mock.method(stuck, "kill");
        node_test_1.mock.timers.tick(windows_listener_supervisor_1.RETIRE_GRACE_MS);
        strict_1.default.deepEqual(kill.mock.calls.at(-1)?.arguments, ["SIGKILL"]);
        listener.startWindowsKeyListener(callbacks(), ["--dictation=Ctrl+Win"]);
        strict_1.default.equal(FakeChild.spawned.length, 1, "no replacement while the forced helper may still hold its hooks");
        stuck.exit("SIGKILL");
        strict_1.default.equal(FakeChild.spawned.length, 2);
    }
    finally {
        node_test_1.mock.timers.reset();
    }
});
(0, node_test_1.test)("a helper that never reports its exit is abandoned after the second grace", async () => {
    const listener = await loadListener();
    node_test_1.mock.timers.enable({ apis: ["setTimeout"] });
    try {
        listener.startWindowsKeyListener(callbacks(), ["--dictation=Ctrl+Win"]);
        listener.stopWindowsKeyListener();
        listener.startWindowsKeyListener(callbacks(), ["--dictation=Ctrl+Win"]);
        node_test_1.mock.timers.tick(windows_listener_supervisor_1.RETIRE_GRACE_MS);
        strict_1.default.equal(FakeChild.spawned.length, 1);
        node_test_1.mock.timers.tick(windows_listener_supervisor_1.RETIRE_GRACE_MS);
        strict_1.default.equal(FakeChild.spawned.length, 2, "a wedged helper must not keep the hotkey dead forever");
    }
    finally {
        node_test_1.mock.timers.reset();
    }
});
(0, node_test_1.test)("stopping without a replacement clears the running state", async () => {
    const listener = await loadListener();
    listener.startWindowsKeyListener(callbacks(), ["--dictation=Ctrl+Win"]);
    listener.stopWindowsKeyListener();
    FakeChild.spawned[0].exit();
    strict_1.default.equal(listener.isWindowsKeyListenerRunning(), false);
    strict_1.default.equal(FakeChild.spawned.length, 1);
});
//# sourceMappingURL=windows-key-listener.test.js.map
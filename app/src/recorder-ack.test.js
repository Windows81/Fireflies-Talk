"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_test_1 = require("node:test");
const recorder_ack_1 = require("./recorder-ack");
function createHarness(timeoutMs = recorder_ack_1.RECORDING_DISCARD_ACK_TIMEOUT_MS, channel = "recording:discard-done") {
    const ipcEvents = new node_events_1.EventEmitter();
    const rendererEvents = new node_events_1.EventEmitter();
    const result = (0, recorder_ack_1.waitForRecorderAck)({
        ipc: ipcEvents,
        channel,
        recorderContents: rendererEvents,
        meetingId: "meeting-a",
        timeoutMs,
    });
    return { ipcEvents, rendererEvents, result, channel };
}
function assertListenersRemoved({ ipcEvents, rendererEvents, channel, }) {
    strict_1.default.equal(ipcEvents.listenerCount(channel), 0);
    strict_1.default.equal(rendererEvents.listenerCount("destroyed"), 0);
    strict_1.default.equal(rendererEvents.listenerCount("render-process-gone"), 0);
}
(0, node_test_1.test)("waits beyond the old deadline for a matching teardown acknowledgement", async () => {
    strict_1.default.ok(recorder_ack_1.RECORDING_DISCARD_ACK_TIMEOUT_MS > 5000);
    const harness = createHarness();
    const { ipcEvents, rendererEvents, result } = harness;
    let settled = false;
    void result.then(() => {
        settled = true;
    });
    ipcEvents.emit("recording:discard-done", { sender: rendererEvents }, { meetingId: "meeting-b", success: true });
    await Promise.resolve();
    strict_1.default.equal(settled, false);
    ipcEvents.emit("recording:discard-done", { sender: rendererEvents }, { meetingId: "meeting-a", success: true });
    strict_1.default.equal(await result, true);
    assertListenersRemoved(harness);
});
(0, node_test_1.test)("ignores acknowledgements from a foreign renderer", async () => {
    const harness = createHarness();
    const { ipcEvents, rendererEvents, result } = harness;
    let settled = false;
    void result.then(() => {
        settled = true;
    });
    ipcEvents.emit("recording:discard-done", { sender: new node_events_1.EventEmitter() }, { meetingId: "meeting-a", success: true });
    await Promise.resolve();
    strict_1.default.equal(settled, false);
    strict_1.default.equal(ipcEvents.listenerCount("recording:discard-done"), 1);
    ipcEvents.emit("recording:discard-done", { sender: rendererEvents }, { meetingId: "meeting-a", success: true });
    strict_1.default.equal(await result, true);
    assertListenersRemoved(harness);
});
(0, node_test_1.test)("reports an explicit recorder teardown failure", async () => {
    const harness = createHarness();
    const { ipcEvents, rendererEvents, result } = harness;
    ipcEvents.emit("recording:discard-done", { sender: rendererEvents }, { meetingId: "meeting-a", success: false });
    strict_1.default.equal(await result, false);
    assertListenersRemoved(harness);
});
(0, node_test_1.test)("reports failure if the recorder renderer disappears", async () => {
    const harness = createHarness();
    const { rendererEvents, result } = harness;
    rendererEvents.emit("render-process-gone");
    strict_1.default.equal(await result, false);
    assertListenersRemoved(harness);
});
(0, node_test_1.test)("reports timeout as failure instead of successful teardown", async () => {
    const harness = createHarness(1);
    const { result } = harness;
    strict_1.default.equal(await result, false);
    assertListenersRemoved(harness);
});
(0, node_test_1.test)("waits on whichever channel the caller names", async () => {
    strict_1.default.ok(recorder_ack_1.RECORDING_STOP_ACK_TIMEOUT_MS > recorder_ack_1.RECORDING_DISCARD_ACK_TIMEOUT_MS);
    const harness = createHarness(recorder_ack_1.RECORDING_STOP_ACK_TIMEOUT_MS, "recording:stop-done");
    const { ipcEvents, rendererEvents, result } = harness;
    // The other recorder channel must not settle this wait.
    ipcEvents.emit("recording:discard-done", { sender: rendererEvents }, { meetingId: "meeting-a", success: true });
    await Promise.resolve();
    strict_1.default.equal(ipcEvents.listenerCount("recording:stop-done"), 1);
    ipcEvents.emit("recording:stop-done", { sender: rendererEvents }, { meetingId: "meeting-a", success: true });
    strict_1.default.equal(await result, true);
    assertListenersRemoved(harness);
});
//# sourceMappingURL=recorder-ack.test.js.map
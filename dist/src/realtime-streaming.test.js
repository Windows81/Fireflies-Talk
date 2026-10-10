"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_path_1 = __importDefault(require("node:path"));
/**
 * One RealtimeStreamingManager serves every recording this process makes, so
 * its client/target/meeting fields are shared state. stopInternal() awaits a
 * disconnect before clearing them, which is long enough for the renderer to
 * stop one recording and start the next.
 */
// import.meta is unavailable in this project's CommonJS output, and the test
// script runs from electron/, so resolve the mocked modules from there.
const srcDir = node_path_1.default.resolve(process.cwd(), "src");
// logger reaches electron's app module, which does not exist under node:test.
node_test_1.mock.module(node_path_1.default.join(srcDir, "logger.ts"), {
    namedExports: {
        logger: { info() { }, warn() { }, error() { }, debug() { } },
    },
});
node_test_1.mock.module(node_path_1.default.join(srcDir, "cloud-log-buffer.ts"), {
    namedExports: { cloudLog: () => { } },
});
/** Disconnects resolve when the test says so, per client. */
class FakeClient {
    constructor(config) {
        this.config = config;
        this.disconnectCalls = 0;
        /** Callbacks the manager registered, so a test can fire them late. */
        this.handlers = {};
        this.release = null;
        FakeClient.instances.push(this);
    }
    disconnect() {
        this.disconnectCalls++;
        // Only the FIRST disconnect waits. A second call on an already-closing
        // client returns at once — that asymmetry is what lets a late teardown
        // outlive the start that replaced it.
        if (this.disconnectCalls > 1)
            return Promise.resolve();
        return new Promise((resolve) => {
            this.release = resolve;
        });
    }
    finishDisconnect() {
        this.release?.();
        this.release = null;
    }
    getConnectionState() {
        return "CONNECTED";
    }
    getReconnectAttempts() {
        return 0;
    }
    connect() { }
    sendAudioData() { }
    sendMicActivity() { }
    sendMediaStreamEnd() { }
    onConnectionStateChange(cb) {
        this.handlers.connectionState = cb;
    }
    onStreamStart(cb) {
        this.handlers.streamStart = cb;
    }
    onStreamComplete(cb) {
        this.handlers.streamComplete = cb;
    }
    onTranscript(cb) {
        this.handlers.transcript = cb;
    }
    onError(cb) {
        this.handlers.error = cb;
    }
    onReconnect(cb) {
        this.handlers.reconnect = cb;
    }
}
FakeClient.instances = [];
node_test_1.mock.module("@firefliesai/realtime-ff-streaming-client", {
    namedExports: {
        RealtimeStreamingClient: FakeClient,
        ConnectionState: {
            CONNECTED: "CONNECTED",
            DISCONNECTED: "DISCONNECTED",
            CONNECTING: "CONNECTING",
        },
    },
});
const fakeSender = (id) => ({
    id,
    isDestroyed: () => false,
    send: () => { },
});
const startConfig = (meetingId) => ({
    baseUrl: "wss://example.test",
    meetingId,
});
(0, node_test_1.test)("a late teardown must not clear the session that replaced it", async () => {
    FakeClient.instances = [];
    const { RealtimeStreamingManager } = await import("./realtime-streaming.js");
    const manager = new RealtimeStreamingManager();
    const sender = fakeSender(1);
    await manager.start(startConfig("meeting-a"), sender);
    const clientA = FakeClient.instances[0];
    // The renderer fire-and-forgets stop, so nothing waits for this.
    const stoppingA = manager.stop(sender);
    // The user starts the next recording. Its own restart-teardown sees the
    // closing client and returns immediately, so session B installs first.
    await manager.start(startConfig("meeting-b"), sender);
    strict_1.default.equal(FakeClient.instances.length, 2, "session B must have a client");
    // Only now does session A's disconnect complete.
    clientA.finishDisconnect();
    await stoppingA;
    const health = manager.getHealth();
    strict_1.default.notEqual(health, null, "session B's client must survive session A's teardown");
    // The clearest symptom of the bug: chunks are silently dropped afterwards.
    manager.sendChunk(Buffer.from([1, 2, 3]), sender);
    strict_1.default.equal(manager.getHealth()?.wsBytesSent, 3, "session B must still be able to stream");
});
(0, node_test_1.test)("a stop cancels a start that is still waiting on the old teardown", async () => {
    FakeClient.instances = [];
    const { RealtimeStreamingManager } = await import("./realtime-streaming.js");
    const manager = new RealtimeStreamingManager();
    const sender = fakeSender(1);
    await manager.start(startConfig("meeting-a"), sender);
    const clientA = FakeClient.instances[0];
    // Session B's start parks in its restart-teardown, waiting on A's socket.
    const startingB = manager.start(startConfig("meeting-b"), sender);
    // The user stops before B ever connects.
    await manager.stop(sender);
    clientA.finishDisconnect();
    await startingB;
    strict_1.default.equal(FakeClient.instances.length, 1, "a start the user cancelled must not connect a client afterwards");
    strict_1.default.equal(manager.getHealth(), null, "no session may be left running");
});
(0, node_test_1.test)("a replaced client's late completion cannot stop the live session", async () => {
    FakeClient.instances = [];
    const { RealtimeStreamingManager } = await import("./realtime-streaming.js");
    const manager = new RealtimeStreamingManager();
    const sender = fakeSender(1);
    await manager.start(startConfig("meeting-a"), sender);
    const clientA = FakeClient.instances[0];
    // A's disconnect completes normally, so B installs cleanly.
    const restarting = manager.start(startConfig("meeting-b"), sender);
    clientA.finishDisconnect();
    await restarting;
    strict_1.default.equal(FakeClient.instances.length, 2, "session B must be installed");
    // A's callbacks close over the manager, not over A. Its completion event
    // arrives late — after B took over — and used to tear B down with it.
    const clientB = FakeClient.instances[1];
    clientA.handlers.streamComplete?.({});
    await new Promise((resolve) => setTimeout(resolve, 10));
    strict_1.default.equal(clientB.disconnectCalls, 0, "a past session's completion must not disconnect the live client");
    manager.sendChunk(Buffer.from([1, 2, 3]), sender);
    strict_1.default.equal(manager.getHealth()?.wsBytesSent, 3, "the live session must survive a past session's completion");
});
(0, node_test_1.test)("health counts transcript events, sentences and characters per session", async () => {
    FakeClient.instances = [];
    const { RealtimeStreamingManager } = await import("./realtime-streaming.js");
    const manager = new RealtimeStreamingManager();
    const sender = fakeSender(1);
    await manager.start(startConfig("meeting-a"), sender);
    const clientA = FakeClient.instances[0];
    strict_1.default.equal(manager.getHealth()?.transcriptEvents, 0);
    strict_1.default.equal(manager.getHealth()?.transcriptAgeMs, null);
    const sentence = (parseId, text) => ({
        parseId,
        transcriptId: parseId,
        sentence: text,
        time: 0,
        endTime: 1,
        speakerName: "",
    });
    // The first sentence arrives twice as it grows; only its final form counts.
    clientA.handlers.transcript?.(sentence("p1", "Hello"));
    clientA.handlers.transcript?.(sentence("p1", "Hello there"));
    clientA.handlers.transcript?.(sentence("p2", "Second one"));
    const health = manager.getHealth();
    strict_1.default.equal(health?.transcriptEvents, 3);
    strict_1.default.equal(health?.transcriptSegments, 2);
    strict_1.default.equal(health?.transcriptChars, "Hello there".length + "Second one".length);
    strict_1.default.ok((health?.transcriptAgeMs ?? -1) >= 0, "age counts from the last message");
    // The next session starts from zero.
    const restarting = manager.start(startConfig("meeting-b"), sender);
    clientA.finishDisconnect();
    await restarting;
    strict_1.default.equal(manager.getHealth()?.transcriptEvents, 0);
    strict_1.default.equal(manager.getHealth()?.transcriptChars, 0);
});
//# sourceMappingURL=realtime-streaming.test.js.map
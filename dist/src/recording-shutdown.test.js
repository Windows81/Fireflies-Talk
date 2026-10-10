"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_test_1 = require("node:test");
const recording_shutdown_1 = require("./recording-shutdown");
(0, node_test_1.test)("recording stop waits for the matching renderer acknowledgement", async () => {
    const ipcMain = new node_events_1.EventEmitter();
    const sent = [];
    const webContents = Object.assign(new node_events_1.EventEmitter(), {
        send: (channel, payload) => {
            sent.push({ channel, payload });
        },
    });
    const targetWindow = {
        isDestroyed: () => false,
        webContents,
    };
    const stop = (0, recording_shutdown_1.requestRecordingStop)(ipcMain, targetWindow, "meeting-1", 100);
    ipcMain.emit("recording:stop-done", { sender: webContents }, { meetingId: "meeting-2", success: true });
    ipcMain.emit("recording:stop-done", { sender: webContents }, { meetingId: "meeting-1", success: true });
    strict_1.default.equal(await stop, true);
    strict_1.default.deepEqual(sent, [
        {
            channel: "recording:stop",
            payload: { meetingId: "meeting-1", forShutdown: true },
        },
    ]);
});
(0, node_test_1.test)("recording stop resolves false when the renderer does not acknowledge", async () => {
    const ipcMain = new node_events_1.EventEmitter();
    const targetWindow = {
        isDestroyed: () => false,
        webContents: Object.assign(new node_events_1.EventEmitter(), {
            send: () => { },
        }),
    };
    strict_1.default.equal(await (0, recording_shutdown_1.requestRecordingStop)(ipcMain, targetWindow, undefined, 1), false);
});
(0, node_test_1.test)("shutdown skips renderer acknowledgement when nothing is recording", async () => {
    let stopCalls = 0;
    strict_1.default.equal(await (0, recording_shutdown_1.requestActiveRecordingStop)(() => null, async () => {
        stopCalls++;
        return true;
    }), "idle");
    strict_1.default.equal(stopCalls, 0);
});
(0, node_test_1.test)("shutdown skips an inactive renderer without pending finalization", async () => {
    let stopCalls = 0;
    strict_1.default.equal(await (0, recording_shutdown_1.requestActiveRecordingStop)(() => ({ state: "inactive", isFinalizing: false }), async () => {
        stopCalls++;
        return true;
    }), "idle");
    strict_1.default.equal(stopCalls, 0);
});
(0, node_test_1.test)("shutdown waits for pending finalization after a manual stop", async () => {
    let requestedMeetingId;
    let finishStop;
    const stopCompleted = new Promise((resolve) => {
        finishStop = resolve;
    });
    const result = (0, recording_shutdown_1.requestActiveRecordingStop)(() => ({
        state: "inactive",
        isFinalizing: true,
        finalizingMeetingId: "meeting-1",
    }), async (meetingId) => {
        requestedMeetingId = meetingId;
        return stopCompleted;
    });
    strict_1.default.equal(requestedMeetingId, "meeting-1");
    finishStop?.(true);
    strict_1.default.equal(await result, "stopped");
});
(0, node_test_1.test)("shutdown stops the active recording by meeting id", async () => {
    let requestedMeetingId;
    strict_1.default.equal(await (0, recording_shutdown_1.requestActiveRecordingStop)(() => ({ meetingId: "meeting-1", state: "recording" }), async (meetingId) => {
        requestedMeetingId = meetingId;
        return true;
    }), "stopped");
    strict_1.default.equal(requestedMeetingId, "meeting-1");
});
(0, node_test_1.test)("quit and window close share one recording finalization", async () => {
    let finishStop;
    const stop = new Promise((resolve) => {
        finishStop = resolve;
    });
    let stopCalls = 0;
    let quitCalls = 0;
    let cleanupCalls = 0;
    let retryCloseCalls = 0;
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => {
            stopCalls++;
            if (stopCalls > 1)
                return "idle";
            await stop;
            return "stopped";
        },
        quit: () => {
            quitCalls++;
        },
        cleanup: () => {
            cleanupCalls++;
        },
        onError: () => { },
    });
    const closeHandler = (0, recording_shutdown_1.createRecordingAwareWindowCloseHandler)({
        isAppQuitting: () => true,
        getShutdownCoordinator: () => shutdown,
        closeAfterShutdown: () => {
            retryCloseCalls++;
        },
        hideWindow: () => strict_1.default.fail(),
    });
    let closePrevented = false;
    closeHandler({
        preventDefault: () => {
            closePrevented = true;
        },
    });
    let quitPrevented = false;
    shutdown.handleBeforeQuit({
        preventDefault: () => {
            quitPrevented = true;
        },
    });
    strict_1.default.equal(closePrevented, true);
    strict_1.default.equal(quitPrevented, true);
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.equal(stopCalls, 1);
    strict_1.default.equal(cleanupCalls, 0);
    finishStop?.();
    await stop;
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.equal(quitCalls, 1);
    strict_1.default.equal(retryCloseCalls, 1);
    shutdown.handleBeforeQuit({
        preventDefault: () => strict_1.default.fail(),
    });
    shutdown.handleBeforeQuit({
        preventDefault: () => strict_1.default.fail(),
    });
    strict_1.default.equal(cleanupCalls, 1);
});
(0, node_test_1.test)("shutdown finalizes a recording started during preparation", async () => {
    let finishFirst;
    let finishSecond;
    const firstStop = new Promise((resolve) => {
        finishFirst = resolve;
    });
    const secondStop = new Promise((resolve) => {
        finishSecond = resolve;
    });
    let stopCalls = 0;
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => {
            stopCalls++;
            if (stopCalls === 1) {
                await firstStop;
                return "stopped";
            }
            if (stopCalls === 2) {
                await secondStop;
                return "stopped";
            }
            return "idle";
        },
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
    });
    const preparation = shutdown.prepare();
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.equal(stopCalls, 1);
    finishFirst?.();
    await firstStop;
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.equal(stopCalls, 2);
    strict_1.default.equal(shutdown.isReady(), false);
    finishSecond?.();
    await preparation;
    strict_1.default.equal(stopCalls, 3);
    strict_1.default.equal(shutdown.isReady(), true);
});
(0, node_test_1.test)("normal window close hides without preparing app shutdown", () => {
    let hidden = false;
    const closeHandler = (0, recording_shutdown_1.createRecordingAwareWindowCloseHandler)({
        isAppQuitting: () => false,
        getShutdownCoordinator: () => null,
        closeAfterShutdown: () => strict_1.default.fail(),
        hideWindow: () => {
            hidden = true;
        },
    });
    let prevented = false;
    closeHandler({
        preventDefault: () => {
            prevented = true;
        },
    });
    strict_1.default.equal(prevented, true);
    strict_1.default.equal(hidden, true);
});
(0, node_test_1.test)("cancelled shutdown can prepare a later recording", async () => {
    let stopCalls = 0;
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => {
            stopCalls++;
            return "idle";
        },
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
    });
    await shutdown.prepare();
    shutdown.reset();
    await shutdown.prepare();
    strict_1.default.equal(stopCalls, 2);
});
(0, node_test_1.test)("shutdown cancelled mid-preparation does not become ready", async () => {
    let releaseStop;
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: () => new Promise((resolve) => {
            releaseStop = () => resolve("idle");
        }),
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
    });
    const preparation = shutdown.prepare();
    await new Promise((resolve) => setImmediate(resolve));
    shutdown.reset();
    releaseStop?.();
    await preparation;
    strict_1.default.equal(shutdown.isReady(), false);
});
(0, node_test_1.test)("recording stop resolves false when the renderer is gone", async () => {
    const ipcMain = new node_events_1.EventEmitter();
    const webContents = Object.assign(new node_events_1.EventEmitter(), {
        send: () => { },
    });
    const targetWindow = {
        isDestroyed: () => false,
        webContents,
    };
    const stop = (0, recording_shutdown_1.requestRecordingStop)(ipcMain, targetWindow, undefined, 60000);
    webContents.emit("render-process-gone");
    strict_1.default.equal(await stop, false);
});
(0, node_test_1.test)("a stop that always reports more work still lets the app quit", async () => {
    let stopCalls = 0;
    let quitCalls = 0;
    const errors = [];
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        // A renderer whose snapshot never empties: every stop succeeds and the
        // main process still sees something left to stop.
        requestRecordingStop: async () => {
            stopCalls++;
            return "stopped";
        },
        quit: () => {
            quitCalls++;
        },
        cleanup: () => { },
        onError: (error) => errors.push(error),
        maxStops: 3,
    });
    shutdown.handleBeforeQuit({ preventDefault: () => { } });
    await shutdown.prepare();
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.equal(stopCalls, 3);
    strict_1.default.equal(quitCalls, 1);
    strict_1.default.equal(shutdown.isReady(), true);
    strict_1.default.equal(errors.length, 1);
    strict_1.default.match(String(errors[0]), /did not settle after 3 stops/);
});
(0, node_test_1.test)("a finalization that outruns the budget still lets the app quit", async () => {
    let now = 0;
    let quitCalls = 0;
    const errors = [];
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => {
            now += 40000;
            return "stopped";
        },
        quit: () => {
            quitCalls++;
        },
        cleanup: () => { },
        onError: (error) => errors.push(error),
        budgetMs: 60000,
        now: () => now,
    });
    shutdown.handleBeforeQuit({ preventDefault: () => { } });
    await shutdown.prepare();
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.equal(quitCalls, 1);
    strict_1.default.equal(shutdown.isReady(), true);
    strict_1.default.equal(errors.length, 1);
    strict_1.default.match(String(errors[0]), /exceeded its 60000ms shutdown budget/);
});
(0, node_test_1.test)("finalization is announced around the whole stop sequence", async () => {
    const finalizing = [];
    let releaseStop;
    const stop = new Promise((resolve) => {
        releaseStop = resolve;
    });
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => {
            await stop;
            return "idle";
        },
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
        onFinalizing: (active) => finalizing.push(active),
    });
    const prepared = shutdown.prepare();
    strict_1.default.deepEqual(finalizing, [true]);
    releaseStop?.();
    await prepared;
    strict_1.default.deepEqual(finalizing, [true, false]);
});
(0, node_test_1.test)("a reset shutdown clears finalization without a later attempt undoing it", async () => {
    const finalizing = [];
    const gates = [];
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        // Each attempt blocks on its own gate, so the abandoned one can be settled
        // while the run that replaced it is still in flight.
        requestRecordingStop: () => new Promise((resolve) => {
            gates.push(() => resolve("idle"));
        }),
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
        onFinalizing: (active) => finalizing.push(active),
    });
    const abandoned = shutdown.prepare();
    // prepare() defers the stop by a microtask, so let each attempt reach its gate.
    await new Promise((resolve) => setImmediate(resolve));
    shutdown.reset();
    strict_1.default.deepEqual(finalizing, [true, false]);
    const current = shutdown.prepare();
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.deepEqual(finalizing, [true, false, true]);
    strict_1.default.equal(gates.length, 2);
    // Settle the abandoned attempt: it must not clear the current run.
    gates[0]();
    await abandoned;
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.deepEqual(finalizing, [true, false, true]);
    strict_1.default.equal(shutdown.isReady(), false);
    gates[1]();
    await current;
    strict_1.default.deepEqual(finalizing, [true, false, true, false]);
    strict_1.default.equal(shutdown.isReady(), true);
});
(0, node_test_1.test)("a failed stop for a stale recording does not end the shutdown scan", async () => {
    // A stale snapshot can name an old recording; the renderer rejects that stop
    // ("failed"), but a newer recording may be live. Only "idle" — decided from
    // the snapshot without asking the renderer — may end the scan.
    const attempts = ["failed", "stopped", "idle"];
    let stopCalls = 0;
    let quitCalls = 0;
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => {
            stopCalls++;
            return attempts.shift() ?? "idle";
        },
        quit: () => {
            quitCalls++;
        },
        cleanup: () => { },
        onError: () => strict_1.default.fail(),
    });
    shutdown.handleBeforeQuit({ preventDefault: () => { } });
    await shutdown.prepare();
    await new Promise((resolve) => setImmediate(resolve));
    strict_1.default.equal(stopCalls, 3);
    strict_1.default.equal(quitCalls, 1);
    strict_1.default.equal(shutdown.isReady(), true);
});
(0, node_test_1.test)("a start in flight is not read as nothing to stop", async () => {
    // start() publishes its context only after createMeeting and local capture
    // both resolve, so mid-start the recorder still looks inactive.
    let requested = false;
    let requestedMeetingId = "unset";
    strict_1.default.equal(await (0, recording_shutdown_1.requestActiveRecordingStop)(() => ({ state: "inactive", isStarting: true }), async (meetingId) => {
        requested = true;
        requestedMeetingId = meetingId;
        return true;
    }), "stopped");
    strict_1.default.equal(requested, true);
    // No id exists yet — the renderer resolves it once the start settles.
    strict_1.default.equal(requestedMeetingId, undefined);
});
(0, node_test_1.test)("each acknowledgement is capped to the remaining shutdown budget", async () => {
    let now = 0;
    const timeouts = [];
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async (timeoutMs) => {
            timeouts.push(timeoutMs);
            now += 35000;
            return "stopped";
        },
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
        budgetMs: 90000,
        now: () => now,
    });
    await shutdown.prepare();
    // 90s left, then 55s, then 20s — never the full ack timeout once the budget
    // is nearly spent, so prepare() cannot overrun by a whole acknowledgement.
    strict_1.default.deepEqual(timeouts, [90000, 55000, 20000]);
});
//# sourceMappingURL=recording-shutdown.test.js.map
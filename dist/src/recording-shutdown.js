"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRecordingStop = requestRecordingStop;
exports.requestActiveRecordingStop = requestActiveRecordingStop;
exports.createRecordingShutdownCoordinator = createRecordingShutdownCoordinator;
exports.createRecordingAwareWindowCloseHandler = createRecordingAwareWindowCloseHandler;
const recorder_ack_1 = require("./recorder-ack");
// Upper bound on the whole finalization, across however many stops it takes.
// Roughly two acknowledgement timeouts, so a stop that uncovers one more still
// gets to finish. Each pass is separately bounded, but the loop below is not,
// and a quit that never completes is worse than a recording that ends late: an
// abandoned desktop recording is reconciled server-side within the streaming
// service's reconnect grace period, while an app that will not quit has no way
// out at all.
const RECORDING_SHUTDOWN_BUDGET_MS = 90000;
// A second guard for the case the budget cannot catch: a renderer that
// acknowledges instantly and forever, which would spin without ever spending
// wall-clock time.
const RECORDING_SHUTDOWN_MAX_STOPS = 8;
function requestRecordingStop(ipcMain, targetWindow, meetingId, timeoutMs = recorder_ack_1.RECORDING_STOP_ACK_TIMEOUT_MS) {
    if (!targetWindow || targetWindow.isDestroyed())
        return Promise.resolve(false);
    const recorderContents = targetWindow.webContents;
    const acked = (0, recorder_ack_1.waitForRecorderAck)({
        ipc: ipcMain,
        channel: "recording:stop-done",
        recorderContents,
        meetingId,
        timeoutMs,
    });
    // forShutdown tells the renderer the app is going away, so it must not
    // abandon its network waits the way it does for an ordinary stop.
    recorderContents.send("recording:stop", { meetingId, forShutdown: true });
    return acked;
}
async function requestActiveRecordingStop(getRecording, requestStop) {
    const recording = getRecording();
    if (!recording ||
        (recording.state === "inactive" &&
            !recording.isFinalizing &&
            !recording.isStarting)) {
        return "idle";
    }
    // A start in flight has no meeting id yet — it is published only once
    // createMeeting and local capture have both resolved. Ask without one and
    // let the renderer answer after the start settles, rather than reading the
    // gap as "nothing is recording" and quitting into a meeting going live.
    const meetingId = recording.isStarting
        ? undefined
        : recording.state === "inactive"
            ? recording.finalizingMeetingId
            : recording.meetingId;
    return (await requestStop(meetingId)) ? "stopped" : "failed";
}
function createRecordingShutdownCoordinator({ requestRecordingStop, quit, cleanup, onError, onFinalizing = () => { }, budgetMs = RECORDING_SHUTDOWN_BUDGET_MS, maxStops = RECORDING_SHUTDOWN_MAX_STOPS, now = Date.now, }) {
    let shutdownState = "idle";
    let pendingShutdown = null;
    let quitScheduled = false;
    let cleanupComplete = false;
    let generation = 0;
    const prepare = () => {
        if (shutdownState === "ready")
            return Promise.resolve();
        if (pendingShutdown)
            return pendingShutdown;
        const attempt = ++generation;
        shutdownState = "stopping";
        onFinalizing(true);
        pendingShutdown = Promise.resolve()
            .then(async () => {
            // One stop can uncover another: a manual stop already finalizing when
            // the quit arrives is awaited first, and only then does the snapshot
            // reveal whatever is still recording. Keep going while there is more to
            // stop — but never past the budget, because the exit condition depends
            // on the renderer's snapshot going empty, and a renderer that never
            // reports that would otherwise hold the quit open forever.
            const deadline = now() + budgetMs;
            for (let stops = 0; stops < maxStops; stops++) {
                // Checked before the stop, not after, so a slow pass cannot earn
                // another one. Each pass is separately bounded by the ack timeout,
                // which is what makes the worst case roughly one more ack than the
                // budget rather than maxStops of them.
                const remaining = deadline - now();
                if (remaining <= 0) {
                    onError(new Error(`Recording finalization exceeded its ${budgetMs}ms shutdown budget; quitting anyway`));
                    return;
                }
                // Each acknowledgement is capped to what is left of the budget, so a
                // stop starting just under the deadline cannot overrun it by a whole
                // acknowledgement timeout.
                const attempt = await requestRecordingStop(remaining);
                // Only "idle" proves nothing is left. "stopped" may have uncovered
                // more work, and "failed" means the acknowledgement was for a stale
                // id, timed out, or the renderer died — re-read the snapshot rather
                // than conclude nothing is recording. Both stay bounded by the
                // budget and the stop cap, so a renderer that keeps failing cannot
                // hold the quit open.
                if (attempt === "idle")
                    return;
            }
            onError(new Error(`Recording finalization did not settle after ${maxStops} stops; quitting anyway`));
        })
            .catch(onError)
            .then(() => {
            // Only the current attempt reports finished. A shutdown that was reset
            // mid-flight — an update install that rolled back — is cleared by
            // reset() itself, so an older attempt settling later must not clear the
            // state of the run that replaced it.
            if (attempt !== generation)
                return;
            onFinalizing(false);
            shutdownState = "ready";
        });
        return pendingShutdown;
    };
    const handleBeforeQuit = (event) => {
        if (shutdownState === "ready") {
            if (!cleanupComplete) {
                cleanup();
                cleanupComplete = true;
            }
            return;
        }
        event.preventDefault();
        if (quitScheduled)
            return;
        quitScheduled = true;
        void prepare().finally(quit);
    };
    return {
        prepare,
        reset: () => {
            generation++;
            shutdownState = "idle";
            pendingShutdown = null;
            quitScheduled = false;
            cleanupComplete = false;
            onFinalizing(false);
        },
        isReady: () => shutdownState === "ready",
        handleBeforeQuit,
    };
}
function createRecordingAwareWindowCloseHandler({ isAppQuitting, getShutdownCoordinator, closeAfterShutdown, hideWindow, }) {
    return (event) => {
        // The before-quit wiring sets the quit flag for every quit path, app menu
        // included, so an ordinary close can always be told apart from a quit. The
        // ready-shutdown bypass therefore only applies during a real quit — checked
        // the other way around, a prepared-but-abandoned shutdown would let a
        // normal close destroy the window instead of hiding it to the tray.
        if (!isAppQuitting()) {
            event.preventDefault();
            hideWindow();
            return;
        }
        const shutdown = getShutdownCoordinator();
        if (!shutdown || shutdown.isReady())
            return;
        event.preventDefault();
        void shutdown.prepare().finally(closeAfterShutdown);
    };
}
//# sourceMappingURL=recording-shutdown.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECORDING_STOP_ACK_TIMEOUT_MS = exports.RECORDING_DISCARD_ACK_TIMEOUT_MS = void 0;
exports.waitForRecorderAck = waitForRecorderAck;
// Discard is user-initiated and the caller is about to delete the meeting, so a
// slow teardown is worth waiting out. A stop on the quit path is waiting out the
// whole finalization — attendee sync and the realtime stop mutation — so it gets
// longer, bounded overall by the shutdown coordinator's own budget.
exports.RECORDING_DISCARD_ACK_TIMEOUT_MS = 30000;
exports.RECORDING_STOP_ACK_TIMEOUT_MS = 60000;
/**
 * Wait for real recorder work to finish, without treating a timeout or a dead
 * renderer as success.
 *
 * Shared by every request the main process makes of the recorder, because each
 * one needs the same three guards: the reply has to come from the window we
 * asked, it has to be about the recording we asked about, and a renderer that
 * goes away has to resolve now rather than sit out the full timeout.
 */
function waitForRecorderAck({ ipc, channel, recorderContents, meetingId, timeoutMs, }) {
    return new Promise((resolve) => {
        const onDone = (event, payload) => {
            if (event.sender !== recorderContents)
                return;
            // An unlabelled request takes any reply from this renderer on purpose:
            // it means "whatever is recording", and the recorder cannot echo an id it
            // was never given. The tray's Stop item asks that way too, so its reply
            // can settle an unlabelled wait — harmless, since both mean the recorder
            // finished the work we were waiting on.
            if (meetingId && payload?.meetingId !== meetingId)
                return;
            cleanup();
            resolve(payload?.success === true);
        };
        const onRendererGone = () => {
            cleanup();
            resolve(false);
        };
        const timer = setTimeout(onRendererGone, timeoutMs);
        const cleanup = () => {
            clearTimeout(timer);
            ipc.removeListener(channel, onDone);
            recorderContents.removeListener("destroyed", onRendererGone);
            recorderContents.removeListener("render-process-gone", onRendererGone);
        };
        ipc.on(channel, onDone);
        recorderContents.once("destroyed", onRendererGone);
        recorderContents.once("render-process-gone", onRendererGone);
    });
}
//# sourceMappingURL=recorder-ack.js.map
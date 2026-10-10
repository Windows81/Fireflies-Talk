"use strict";
// Media paused for a dictation is resumed only once the microphone capture
// has been released, not on the hotkey release itself. Resuming while the
// input stream is still open lets the media come back before the output
// route has settled (Bluetooth headsets switch back from their call profile
// only once the mic closes), which is heard as a two-step volume change.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMediaResumeGate = createMediaResumeGate;
function createMediaResumeGate(onResume, fallbackMs, timers) {
    let awaitingCapture = false;
    let captureReleased = false;
    let releasedAt = 0;
    let fallback = null;
    const clearFallback = () => {
        if (fallback === null)
            return;
        timers.clearTimer(fallback);
        fallback = null;
    };
    const fire = (trigger) => {
        clearFallback();
        awaitingCapture = false;
        captureReleased = false;
        onResume(trigger, timers.now() - releasedAt);
    };
    return {
        onPressed: () => {
            clearFallback();
            awaitingCapture = false;
            captureReleased = false;
        },
        onReleased: () => {
            if (awaitingCapture)
                return;
            releasedAt = timers.now();
            if (captureReleased) {
                fire("capture-already-released");
                return;
            }
            awaitingCapture = true;
            fallback = timers.setTimer(() => fire("fallback-timeout"), fallbackMs);
        },
        onCaptureReleased: () => {
            if (awaitingCapture) {
                fire("capture-released");
                return;
            }
            captureReleased = true;
        },
    };
}
//# sourceMappingURL=system-media-resume-gate.js.map
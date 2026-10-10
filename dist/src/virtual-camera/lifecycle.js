"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRelayState = computeRelayState;
/**
 * Decides what the camera relay should be doing.
 *
 * Kept pure and free of I/O because it enforces the one invariant that matters
 * most here: the webcam may only be open while something is actually consuming
 * the virtual camera. Otherwise the green privacy light burns whenever
 * Fireflies is running, which is not acceptable.
 */
function computeRelayState(input) {
    if (!input.installed)
        return "stopped";
    if (input.consumers <= 0)
        return "stopped";
    // "paused" still counts as an active recording session: the notice must stay
    // up, because the user can resume at any moment.
    return input.recordingState === "inactive" ? "passthrough" : "badged";
}
//# sourceMappingURL=lifecycle.js.map
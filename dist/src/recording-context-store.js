"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecordingContextSnapshot = getRecordingContextSnapshot;
exports.setRecordingContextSnapshot = setRecordingContextSnapshot;
let recordingContextSnapshot = null;
function getRecordingContextSnapshot() {
    return recordingContextSnapshot;
}
function setRecordingContextSnapshot(snapshot) {
    recordingContextSnapshot = snapshot;
}
//# sourceMappingURL=recording-context-store.js.map
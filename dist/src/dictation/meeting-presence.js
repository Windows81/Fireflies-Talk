"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_MEETING = void 0;
exports.isMeetingPresent = isMeetingPresent;
exports.withSessionOpen = withSessionOpen;
exports.withRecording = withRecording;
exports.withMeetingEnded = withMeetingEnded;
exports.NO_MEETING = {
    sessionOpen: false,
    recording: false,
    endedMeetingId: null,
};
/**
 * Two independent signals, because either can outlive the other: the windows
 * go away on a restart while the recording keeps running server-side, and a
 * session's windows exist briefly before its recording starts.
 */
function isMeetingPresent(presence) {
    return presence.sessionOpen || presence.recording;
}
/** The live windows opened, or went away. */
function withSessionOpen(presence, open) {
    return { ...presence, sessionOpen: open };
}
/** The recording context the main window syncs — the tray's signal. */
function withRecording(presence, active, meetingId) {
    // A trailing "still recording" for a session the user has ended. Ignore it
    // and wait for the recorder to catch up.
    if (active && meetingId != null && meetingId === presence.endedMeetingId) {
        return presence;
    }
    // Anything else is the recorder speaking for the present, so the end it was
    // racing is settled either way.
    return { ...presence, recording: active, endedMeetingId: null };
}
/**
 * The meeting is over — signalled once per session, from whichever path ended
 * it. The windows may live on to show the notepad, so this is separate from
 * the session closing: it is what returns the pill to its idle launcher the
 * moment the user clicks stop, rather than whenever the recorder catches up.
 */
function withMeetingEnded(presence, meetingId) {
    return { ...presence, recording: false, endedMeetingId: meetingId ?? null };
}
//# sourceMappingURL=meeting-presence.js.map
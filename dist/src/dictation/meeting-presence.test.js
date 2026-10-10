"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const meeting_presence_1 = require("./meeting-presence");
(0, node_test_1.test)("either signal alone keeps the meeting present", () => {
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(meeting_presence_1.NO_MEETING), false);
    // The windows exist before the recorder starts.
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)((0, meeting_presence_1.withSessionOpen)(meeting_presence_1.NO_MEETING, true)), true);
    // And the recording outlives them across a restart.
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)((0, meeting_presence_1.withRecording)(meeting_presence_1.NO_MEETING, true, "m1")), true);
});
(0, node_test_1.test)("ending the meeting drops it even while the recorder still reports it", () => {
    let presence = (0, meeting_presence_1.withSessionOpen)(meeting_presence_1.NO_MEETING, true);
    presence = (0, meeting_presence_1.withRecording)(presence, true, "m1");
    // The user clicks stop: the session's windows stay up to show the notepad,
    // and the recorder is still closing its file.
    presence = (0, meeting_presence_1.withMeetingEnded)(presence, "m1");
    presence = (0, meeting_presence_1.withSessionOpen)(presence, false);
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(presence), false);
    // The frame that was already in flight must not put it back.
    presence = (0, meeting_presence_1.withRecording)(presence, true, "m1");
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(presence), false);
    // Nor a repeat of it.
    presence = (0, meeting_presence_1.withRecording)(presence, true, "m1");
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(presence), false);
});
(0, node_test_1.test)("the recorder confirming the stop settles the ended session", () => {
    let presence = (0, meeting_presence_1.withRecording)((0, meeting_presence_1.withSessionOpen)(meeting_presence_1.NO_MEETING, true), true, "m1");
    presence = (0, meeting_presence_1.withMeetingEnded)(presence, "m1");
    presence = (0, meeting_presence_1.withSessionOpen)(presence, false);
    // An empty snapshot is the recorder agreeing it is done.
    presence = (0, meeting_presence_1.withRecording)(presence, false);
    strict_1.default.equal(presence.endedMeetingId, null);
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(presence), false);
});
(0, node_test_1.test)("a fresh meeting is not suppressed by the one before it", () => {
    let presence = (0, meeting_presence_1.withMeetingEnded)((0, meeting_presence_1.withRecording)((0, meeting_presence_1.withSessionOpen)(meeting_presence_1.NO_MEETING, true), true, "m1"), "m1");
    presence = (0, meeting_presence_1.withSessionOpen)(presence, false);
    presence = (0, meeting_presence_1.withRecording)(presence, true, "m2");
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(presence), true);
    strict_1.default.equal(presence.endedMeetingId, null);
});
(0, node_test_1.test)("a paused recording still counts as a meeting", () => {
    // Pause reaches this as recording: true, so the pill holds its place.
    const presence = (0, meeting_presence_1.withRecording)(meeting_presence_1.NO_MEETING, true, "m1");
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(presence), true);
});
(0, node_test_1.test)("an unidentified recording is never suppressed", () => {
    // Without an id there is nothing to match against the ended session, so the
    // report is taken at face value rather than silently dropped.
    let presence = (0, meeting_presence_1.withMeetingEnded)(meeting_presence_1.NO_MEETING, "m1");
    presence = (0, meeting_presence_1.withRecording)(presence, true);
    strict_1.default.equal((0, meeting_presence_1.isMeetingPresent)(presence), true);
});
//# sourceMappingURL=meeting-presence.test.js.map
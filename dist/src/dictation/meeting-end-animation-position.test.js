"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const meeting_end_animation_position_1 = require("./meeting-end-animation-position");
const WORK_AREA = { x: 0, y: 0, width: 1280, height: 680 };
const SIZE = { width: 195, height: 46 };
const CAPSULE_BAND = dictation_pill_layout_1.DICTATION_PILL_THICKNESS + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD * 2;
(0, node_test_1.test)("opens top-centre when no pill is showing", () => {
    strict_1.default.deepEqual((0, meeting_end_animation_position_1.meetingEndAnimationBounds)(SIZE, WORK_AREA, null), {
        x: 542,
        y: meeting_end_animation_position_1.MEETING_END_ANIMATION_TOP_MARGIN,
        width: 195,
        height: 46,
    });
});
(0, node_test_1.test)("top-centre honours a work area that does not start at the origin", () => {
    const offset = { x: 1280, y: 40, width: 1920, height: 1040 };
    const bounds = (0, meeting_end_animation_position_1.meetingEndAnimationBounds)(SIZE, offset, null);
    strict_1.default.equal(bounds.x, 1280 + Math.floor((1920 - 195) / 2));
    strict_1.default.equal(bounds.y, 40 + meeting_end_animation_position_1.MEETING_END_ANIMATION_TOP_MARGIN);
});
(0, node_test_1.test)("steps below a top-docked pill's capsule instead of overlapping it", () => {
    const pill = {
        bounds: { x: 460, y: 12, width: 360, height: 100 },
        side: "top",
    };
    const bounds = (0, meeting_end_animation_position_1.meetingEndAnimationBounds)(SIZE, WORK_AREA, pill);
    strict_1.default.equal(bounds.x, 542);
    strict_1.default.equal(bounds.y, 12 + CAPSULE_BAND + dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN);
    strict_1.default.ok(bounds.y < 12 + 100, "does not fall past the whole host window");
});
(0, node_test_1.test)("a top pill dragged far along the edge leaves the default spot alone", () => {
    const pill = {
        bounds: { x: 20, y: 12, width: 360, height: 100 },
        side: "top",
    };
    strict_1.default.equal((0, meeting_end_animation_position_1.meetingEndAnimationBounds)(SIZE, WORK_AREA, pill).y, meeting_end_animation_position_1.MEETING_END_ANIMATION_TOP_MARGIN);
});
(0, node_test_1.test)("bottom and side docks never move the animation", () => {
    const bottom = {
        bounds: { x: 460, y: 568, width: 360, height: 100 },
        side: "bottom",
    };
    const left = {
        bounds: { x: -12, y: 240, width: 276, height: 200 },
        side: "left",
    };
    for (const pill of [bottom, left]) {
        strict_1.default.equal((0, meeting_end_animation_position_1.meetingEndAnimationBounds)(SIZE, WORK_AREA, pill).y, meeting_end_animation_position_1.MEETING_END_ANIMATION_TOP_MARGIN);
    }
});
(0, node_test_1.test)("capsule band hugs the docked edge of the host window", () => {
    const top = (0, meeting_end_animation_position_1.dictationPillCapsuleBand)({
        bounds: { x: 0, y: 12, width: 360, height: 100 },
        side: "top",
    });
    strict_1.default.deepEqual(top, { x: 0, y: 12, width: 360, height: CAPSULE_BAND });
    const bottom = (0, meeting_end_animation_position_1.dictationPillCapsuleBand)({
        bounds: { x: 0, y: 568, width: 360, height: 100 },
        side: "bottom",
    });
    strict_1.default.equal(bottom.y + bottom.height, 668);
    strict_1.default.equal(bottom.height, CAPSULE_BAND);
    const rail = { x: -12, y: 240, width: 276, height: 200 };
    strict_1.default.deepEqual((0, meeting_end_animation_position_1.dictationPillCapsuleBand)({ bounds: rail, side: "right" }), rail);
});
(0, node_test_1.test)("stays inside the work area when there is no room below the pill", () => {
    const shortArea = { x: 0, y: 0, width: 1280, height: 80 };
    const pill = {
        bounds: { x: 460, y: 12, width: 360, height: 100 },
        side: "top",
    };
    const bounds = (0, meeting_end_animation_position_1.meetingEndAnimationBounds)(SIZE, shortArea, pill);
    strict_1.default.equal(bounds.y + bounds.height, shortArea.height);
});
//# sourceMappingURL=meeting-end-animation-position.test.js.map
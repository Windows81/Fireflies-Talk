"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const dictation_pill_position_1 = require("./dictation-pill-position");
const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
const bottomMargin = 12;
const platform = "darwin";
const homeHalfX = (0, dictation_pill_position_1.dictationDockHomeZoneHalfLength)("bottom", workArea);
const homeHalfY = (0, dictation_pill_position_1.dictationDockHomeZoneHalfLength)("left", workArea);
function dropAt(x, y) {
    return {
        x,
        y,
        width: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT,
    };
}
function visualCenter(bounds, side) {
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(bounds, side, platform);
    return {
        x: visual.x + visual.width / 2,
        y: visual.y + visual.height / 2,
    };
}
function plan(centre, side) {
    return (0, dictation_pill_position_1.planDictationPillDrop)({
        side,
        visualCentre: centre,
        workArea,
        bottomMargin,
        platform,
    });
}
function docked(side) {
    return (0, dictation_pill_layout_1.getDictationPillBounds)(side, workArea, bottomMargin);
}
(0, node_test_1.test)("home zone is a quarter of the edge, centred on the default marker", () => {
    strict_1.default.equal(homeHalfX, (1920 * dictation_pill_position_1.DICTATION_DOCK_HOME_ZONE_FRACTION) / 2);
    strict_1.default.equal(homeHalfY, (1080 * dictation_pill_position_1.DICTATION_DOCK_HOME_ZONE_FRACTION) / 2);
    strict_1.default.ok((0, dictation_pill_position_1.isWithinDictationDockHomeZone)("bottom", 960 + homeHalfX, workArea));
    strict_1.default.ok(!(0, dictation_pill_position_1.isWithinDictationDockHomeZone)("bottom", 961 + homeHalfX, workArea));
    strict_1.default.ok((0, dictation_pill_position_1.isWithinDictationDockHomeZone)("right", 540 - homeHalfY, workArea));
    strict_1.default.ok(!(0, dictation_pill_position_1.isWithinDictationDockHomeZone)("right", 539 - homeHalfY, workArea));
});
(0, node_test_1.test)("snapPillToEdge always pins flush, however far the drop was", () => {
    const far = (0, dictation_pill_position_1.snapPillToEdge)(dropAt(800, 400), "bottom", workArea, bottomMargin);
    strict_1.default.equal(far.y, docked("bottom").y);
    strict_1.default.equal(far.x, 800);
});
(0, node_test_1.test)("a mid-screen drop docks to the bottom default spot", () => {
    const result = plan(visualCenter(dropAt(800, 400), "bottom"), "bottom");
    strict_1.default.deepEqual(result.bounds, docked("bottom"));
    strict_1.default.equal(result.edgeAnchor, 0.5);
    strict_1.default.ok(result.returnedHome);
});
(0, node_test_1.test)("choosing a side in Settings docks at that edge's default spot", () => {
    for (const side of ["top", "left", "right", "bottom"]) {
        const result = (0, dictation_pill_position_1.planDictationPillSideChoice)(side, workArea, bottomMargin);
        strict_1.default.deepEqual(result.bounds, docked(side), side);
        strict_1.default.equal(result.edgeAnchor, dictation_pill_position_1.DICTATION_PILL_DEFAULT_EDGE_ANCHOR);
        strict_1.default.ok(result.returnedHome);
    }
});
(0, node_test_1.test)("a chosen top dock is centred along the top edge of the work area", () => {
    const menuBar = { x: 0, y: 25, width: 1920, height: 1055 };
    const { bounds } = (0, dictation_pill_position_1.planDictationPillSideChoice)("top", menuBar, bottomMargin);
    strict_1.default.equal(bounds.y, menuBar.y + bottomMargin);
    strict_1.default.equal(bounds.x + bounds.width / 2, menuBar.x + menuBar.width / 2);
});
(0, node_test_1.test)("a drop far from the left edge still docks to the left rail", () => {
    const result = plan(visualCenter(dropAt(200, 400), "bottom"), "left");
    strict_1.default.equal(result.bounds.x, docked("left").x);
    strict_1.default.equal(result.bounds.width, (0, dictation_pill_layout_1.getDictationPillWindowSize)("left").width);
});
(0, node_test_1.test)("a drop just inside the home zone returns to the default anchor", () => {
    const centre = { x: 960 + homeHalfX - 1, y: 1000 };
    const result = plan(centre, "bottom");
    strict_1.default.deepEqual(result.bounds, docked("bottom"));
    strict_1.default.ok(result.returnedHome);
});
(0, node_test_1.test)("a drop clearly along the edge keeps its place, flush to the edge", () => {
    const centre = { x: 400, y: 1000 };
    const result = plan(centre, "bottom");
    strict_1.default.equal(result.bounds.y, docked("bottom").y);
    strict_1.default.equal(result.bounds.x, 400 - dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH / 2);
    strict_1.default.ok(!result.returnedHome);
    strict_1.default.ok(result.edgeAnchor < 0.5);
});
(0, node_test_1.test)("a side drop far up the edge keeps its height on the rail", () => {
    const result = plan({ x: 30, y: 200 }, "left");
    const size = (0, dictation_pill_layout_1.getDictationPillWindowSize)("left");
    strict_1.default.equal(result.bounds.x, docked("left").x);
    strict_1.default.equal(result.bounds.y, 200 - size.height / 2);
    strict_1.default.ok(!result.returnedHome);
});
(0, node_test_1.test)("a drop into a corner is pushed clear of it", () => {
    const bottomLeft = plan({ x: 10, y: 1070 }, "bottom");
    strict_1.default.equal(bottomLeft.bounds.x, dictation_pill_position_1.DICTATION_PILL_CORNER_CLEARANCE_PX);
    const bottomRight = plan({ x: 1915, y: 1070 }, "bottom");
    strict_1.default.equal(bottomRight.bounds.x, 1920 - dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH - dictation_pill_position_1.DICTATION_PILL_CORNER_CLEARANCE_PX);
    const topOfRight = plan({ x: 1910, y: 5 }, "right");
    strict_1.default.equal(topOfRight.bounds.y, dictation_pill_position_1.DICTATION_PILL_CORNER_CLEARANCE_PX);
    const bottomOfLeft = plan({ x: 5, y: 1075 }, "left");
    const size = (0, dictation_pill_layout_1.getDictationPillWindowSize)("left");
    strict_1.default.equal(bottomOfLeft.bounds.y, 1080 - size.height - dictation_pill_position_1.DICTATION_PILL_CORNER_CLEARANCE_PX);
});
(0, node_test_1.test)("clampPillAlongEdge centres when the edge is too short for clearance", () => {
    const tiny = { x: 0, y: 0, width: 400, height: 300 };
    const clamped = (0, dictation_pill_position_1.clampPillAlongEdge)(dropAt(0, 0), "bottom", tiny);
    strict_1.default.equal(clamped.x, (400 - dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH) / 2);
});
(0, node_test_1.test)("a saved mid-screen position is redocked to its nearest edge default", () => {
    const redocked = (0, dictation_pill_position_1.redockSavedDictationPill)({ side: "bottom", x: 800, y: 700 }, workArea, bottomMargin, platform);
    strict_1.default.equal(redocked.side, "bottom");
    strict_1.default.deepEqual(redocked.bounds, docked("bottom"));
    strict_1.default.equal(redocked.edgeAnchor, 0.5);
});
(0, node_test_1.test)("a saved position nearest another edge redocks there", () => {
    const redocked = (0, dictation_pill_position_1.redockSavedDictationPill)({ side: "bottom", x: 60, y: 300 }, workArea, bottomMargin, platform);
    strict_1.default.equal(redocked.side, "left");
    strict_1.default.equal(redocked.bounds.x, docked("left").x);
});
(0, node_test_1.test)("a saved position already docked along the edge maps onto itself", () => {
    const first = (0, dictation_pill_position_1.planDictationPillDrop)({
        side: "bottom",
        visualCentre: { x: 400, y: 1000 },
        workArea,
        bottomMargin,
        platform,
    });
    const again = (0, dictation_pill_position_1.redockSavedDictationPill)({ side: "bottom", x: first.bounds.x, y: first.bounds.y }, workArea, bottomMargin, platform);
    strict_1.default.equal(again.side, "bottom");
    strict_1.default.deepEqual(again.bounds, first.bounds);
    strict_1.default.equal(again.edgeAnchor, first.edgeAnchor);
});
(0, node_test_1.test)("horizontal to left keeps the visible pill under the release point", () => {
    const drop = dropAt(400, 500);
    const resized = (0, dictation_pill_position_1.resizePillAroundVisualCenter)(visualCenter(drop, "bottom"), "left", workArea, platform);
    const before = visualCenter(drop, "bottom");
    const after = visualCenter(resized, "left");
    strict_1.default.ok(Math.abs(before.x - after.x) <= 1);
    strict_1.default.ok(Math.abs(before.y - after.y) <= 1);
});
(0, node_test_1.test)("left to bottom keeps the visible pill under the release point", () => {
    const drop = {
        x: 370,
        y: 400,
        width: 176,
        height: 200,
    };
    const resized = (0, dictation_pill_position_1.resizePillAroundVisualCenter)(visualCenter(drop, "left"), "bottom", workArea, platform);
    const before = visualCenter(drop, "left");
    const after = visualCenter(resized, "bottom");
    strict_1.default.ok(Math.abs(before.x - after.x) <= 1);
    strict_1.default.ok(Math.abs(before.y - after.y) <= 1);
});
(0, node_test_1.test)("clamp keeps a free pill inside the work area", () => {
    const clamped = (0, dictation_pill_position_1.clampPillToWorkArea)({ x: -40, y: -20, width: 360, height: 64 }, workArea);
    strict_1.default.equal(clamped.x, 0);
    strict_1.default.equal(clamped.y, 0);
});
//# sourceMappingURL=dictation-pill-position.test.js.map
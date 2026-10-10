"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const dictation_pill_position_1 = require("./dictation-pill-position");
// macOS work areas: the menu bar takes the top 25px and the Dock its own side.
const MENU_BAR = 25;
const DOCK = 70;
const MARGIN = (0, dictation_pill_layout_1.dictationPillBottomMargin)("darwin");
const bottomDock = {
    x: 0,
    y: MENU_BAR,
    width: 1920,
    height: 1080 - MENU_BAR - DOCK,
};
const leftDock = {
    x: DOCK,
    y: MENU_BAR,
    width: 1920 - DOCK,
    height: 1080 - MENU_BAR,
};
const rightDock = {
    x: 0,
    y: MENU_BAR,
    width: 1920 - DOCK,
    height: 1080 - MENU_BAR,
};
const dockHidden = { x: 0, y: MENU_BAR, width: 1920, height: 1055 };
/** An external display arranged to the left of the primary. */
const leftMonitor = {
    x: -1440,
    y: -80,
    width: 1440,
    height: 900 - DOCK,
};
function visualOn(side, workArea) {
    return (0, dictation_pill_layout_1.getDictationPillVisualBounds)((0, dictation_pill_layout_1.getDictationPillBounds)(side, workArea, MARGIN), side, "darwin");
}
function assertInside(rect, workArea) {
    strict_1.default.ok(rect.x >= workArea.x, "left edge inside");
    strict_1.default.ok(rect.y >= workArea.y, "top edge inside");
    strict_1.default.ok(rect.x + rect.width <= workArea.x + workArea.width, "right inside");
    strict_1.default.ok(rect.y + rect.height <= workArea.y + workArea.height, "bottom inside");
}
(0, node_test_1.test)("a bottom pill rests just above a bottom Dock, never behind it", () => {
    const host = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", bottomDock, MARGIN);
    const visual = visualOn("bottom", bottomDock);
    assertInside(host, bottomDock);
    strict_1.default.equal(bottomDock.y + bottomDock.height - (visual.y + visual.height), dictation_pill_layout_1.DICTATION_PILL_BOTTOM_MARGIN_MAC + dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_INSET);
});
(0, node_test_1.test)("the Dock hiding and showing moves the pill by the space it frees", () => {
    const shown = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", bottomDock, MARGIN, 0.3);
    const hidden = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", dockHidden, MARGIN, 0.3);
    strict_1.default.equal(hidden.y - shown.y, DOCK);
    strict_1.default.equal(hidden.x, shown.x);
    strict_1.default.deepEqual((0, dictation_pill_layout_1.getDictationPillBounds)("bottom", bottomDock, MARGIN, 0.3), shown);
});
(0, node_test_1.test)("a left rail sits beside a left Dock and a right rail beside a right Dock", () => {
    const left = visualOn("left", leftDock);
    const right = visualOn("right", rightDock);
    assertInside(left, leftDock);
    assertInside(right, rightDock);
    strict_1.default.equal(left.x, DOCK + dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN);
    strict_1.default.equal(right.x + right.width, 1920 - DOCK - dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN);
});
(0, node_test_1.test)("a bottom pill on a left-side monitor is centred in negative coordinates", () => {
    const host = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", leftMonitor, MARGIN);
    assertInside(host, leftMonitor);
    strict_1.default.equal(host.x + host.width / 2, leftMonitor.x + leftMonitor.width / 2);
    strict_1.default.equal((0, dictation_pill_layout_1.edgeAnchorFraction)("bottom", host, leftMonitor), 0.5);
});
(0, node_test_1.test)("an anchor set on the primary lands at the same spot on a left-side monitor", () => {
    const onPrimary = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", bottomDock, MARGIN, 0.2);
    const anchor = (0, dictation_pill_layout_1.edgeAnchorFraction)("bottom", onPrimary, bottomDock);
    const onLeft = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", leftMonitor, MARGIN, anchor);
    assertInside(onLeft, leftMonitor);
    strict_1.default.equal((0, dictation_pill_layout_1.edgeAnchorFraction)("bottom", onLeft, leftMonitor), 0.2);
});
(0, node_test_1.test)("a pill dragged off a left-side monitor is pulled back onto it", () => {
    const host = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", leftMonitor, MARGIN);
    const clamped = (0, dictation_pill_position_1.clampPillToWorkArea)({ ...host, x: leftMonitor.x - 200 }, leftMonitor, "bottom");
    strict_1.default.equal(clamped.x, leftMonitor.x);
    const drop = (0, dictation_pill_position_1.planDictationPillDrop)({
        side: "bottom",
        visualCentre: { x: leftMonitor.x + 40, y: leftMonitor.y + 400 },
        workArea: leftMonitor,
        bottomMargin: MARGIN,
        platform: "darwin",
    });
    assertInside(drop.bounds, leftMonitor);
    strict_1.default.equal(drop.returnedHome, false);
});
(0, node_test_1.test)("a saved position from a left-side monitor redocks onto that monitor", () => {
    const saved = (0, dictation_pill_layout_1.getDictationPillBounds)("right", leftMonitor, MARGIN, 0.7);
    const redocked = (0, dictation_pill_position_1.redockSavedDictationPill)({ side: "right", x: saved.x, y: saved.y }, leftMonitor, MARGIN, "darwin");
    strict_1.default.equal(redocked.side, "right");
    strict_1.default.deepEqual(redocked.bounds, saved);
    assertInside((0, dictation_pill_layout_1.getDictationPillVisualBounds)(redocked.bounds, "right", "darwin"), leftMonitor);
});
//# sourceMappingURL=dictation-pill-work-area.test.js.map
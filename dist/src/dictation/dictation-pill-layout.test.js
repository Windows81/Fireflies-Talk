"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_anchored_layout_1 = require("./dictation-pill-anchored-layout");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const dictation_pill_position_1 = require("./dictation-pill-position");
const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
(0, node_test_1.test)("left and right are vertical, top and bottom are horizontal", () => {
    strict_1.default.equal((0, dictation_pill_layout_1.isDictationPillSideDock)("left"), true);
    strict_1.default.equal((0, dictation_pill_layout_1.isDictationPillSideDock)("right"), true);
    strict_1.default.equal((0, dictation_pill_layout_1.isDictationPillSideDock)("bottom"), false);
    strict_1.default.equal((0, dictation_pill_layout_1.isDictationPillSideDock)("top"), false);
});
(0, node_test_1.test)("vertical sides use a slim host, horizontal sides use a wide host", () => {
    strict_1.default.deepEqual((0, dictation_pill_layout_1.getDictationPillWindowSize)("bottom"), {
        width: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT,
    });
    strict_1.default.deepEqual((0, dictation_pill_layout_1.getDictationPillWindowSize)("top"), {
        width: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT,
    });
    strict_1.default.deepEqual((0, dictation_pill_layout_1.getDictationPillWindowSize)("left"), {
        width: dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_SIDE_HEIGHT,
    });
});
(0, node_test_1.test)("bottom bounds sit centered on the work-area floor", () => {
    const bounds = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 12);
    strict_1.default.equal(bounds.y, 1080 - dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT - 12);
    strict_1.default.equal(bounds.x, Math.floor((1920 - dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH) / 2));
});
(0, node_test_1.test)("left and right bounds stay vertically centered", () => {
    const left = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 12);
    const right = (0, dictation_pill_layout_1.getDictationPillBounds)("right", workArea, 12);
    const expectedY = Math.floor((1080 - dictation_pill_layout_1.DICTATION_PILL_SIDE_HEIGHT) / 2);
    strict_1.default.equal(left.y, expectedY);
    strict_1.default.equal(right.y, expectedY);
    strict_1.default.ok(left.x < right.x);
});
(0, node_test_1.test)("side docks hang the host so the visible rail sits on the edge margin", () => {
    const left = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 12);
    const right = (0, dictation_pill_layout_1.getDictationPillBounds)("right", workArea, 12);
    const leftVisual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(left, "left");
    const rightVisual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(right, "right");
    strict_1.default.equal(left.x, workArea.x + dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN - dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET);
    strict_1.default.equal(leftVisual.x, workArea.x + dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN);
    strict_1.default.equal(rightVisual.x + rightVisual.width, workArea.x + workArea.width - dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN);
});
(0, node_test_1.test)("a drop near the top edge docks to the top", () => {
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)({ x: 900, y: 10, width: 40, height: 40 }, workArea), "top");
});
(0, node_test_1.test)("nearest side picks left, right, or bottom from the window center", () => {
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)({ x: 8, y: 500, width: 40, height: 40 }, workArea), "left");
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)({ x: 1860, y: 500, width: 40, height: 40 }, workArea), "right");
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)({ x: 900, y: 1000, width: 40, height: 40 }, workArea), "bottom");
});
(0, node_test_1.test)("snap proximity brightens as the pill nears an edge", () => {
    const far = (0, dictation_pill_position_1.getDictationSnapProximity)({ x: 900, y: 500, width: 40, height: 40 }, workArea);
    const nearLeft = (0, dictation_pill_position_1.getDictationSnapProximity)({ x: 12, y: 500, width: 40, height: 40 }, workArea);
    strict_1.default.equal(nearLeft.side, "left");
    strict_1.default.ok(nearLeft.intensity > far.intensity);
    strict_1.default.ok(nearLeft.intensity > 0.8);
});
(0, node_test_1.test)("a wide pill flush to the left still lights the left edge", () => {
    const near = (0, dictation_pill_position_1.getDictationSnapProximity)({ x: 0, y: 500, width: 360, height: 64 }, workArea);
    strict_1.default.equal(near.side, "left");
    strict_1.default.ok(near.intensity > 0.8);
});
(0, node_test_1.test)("Windows drag-end never uses stillness, macOS only does without a mouse-button reader", () => {
    strict_1.default.equal((0, dictation_pill_layout_1.shouldUseStillnessAsDragEnd)("win32", false), false);
    strict_1.default.equal((0, dictation_pill_layout_1.shouldUseStillnessAsDragEnd)("win32", true), false);
    strict_1.default.equal((0, dictation_pill_layout_1.shouldUseStillnessAsDragEnd)("darwin", true), false);
    strict_1.default.equal((0, dictation_pill_layout_1.shouldUseStillnessAsDragEnd)("darwin", false), true);
});
(0, node_test_1.test)("a click-sized wobble is not a drag, four pixels is", () => {
    strict_1.default.equal((0, dictation_pill_layout_1.hasDictationDragMoved)({ x: 10, y: 10 }, { x: 12, y: 11 }), false);
    strict_1.default.equal((0, dictation_pill_layout_1.hasDictationDragMoved)({ x: 10, y: 10 }, { x: 14, y: 10 }), true);
    strict_1.default.equal((0, dictation_pill_layout_1.hasDictationDragMoved)({ x: 10, y: 10 }, { x: 10, y: 14 }), true);
});
(0, node_test_1.test)("follow-display pauses only while dragging, snapping, or in a caption move", () => {
    strict_1.default.equal((0, dictation_pill_layout_1.shouldHoldDictationReposition)({
        dragging: false,
        snapping: false,
        captionLoopActive: false,
    }), false);
    strict_1.default.equal((0, dictation_pill_layout_1.shouldHoldDictationReposition)({
        dragging: true,
        snapping: false,
        captionLoopActive: false,
    }), true);
    strict_1.default.equal((0, dictation_pill_layout_1.shouldHoldDictationReposition)({
        dragging: false,
        snapping: true,
        captionLoopActive: false,
    }), true);
    strict_1.default.equal((0, dictation_pill_layout_1.shouldHoldDictationReposition)({
        dragging: false,
        snapping: false,
        captionLoopActive: true,
    }), true);
});
(0, node_test_1.test)("accessibility prompt sits above a bottom pill and stays in the work area", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 12);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const prompt = (0, dictation_pill_anchored_layout_1.getDictationAccessibilityPromptBounds)(pill, "bottom", workArea, true);
    strict_1.default.equal(prompt.width, dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_WIDTH);
    strict_1.default.equal(prompt.height, dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_HEIGHT);
    strict_1.default.equal(prompt.x, pill.x + Math.floor((pill.width - dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_WIDTH) / 2));
    strict_1.default.equal(prompt.y, visual.y -
        dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_HEIGHT -
        dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_GAP +
        dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_GUTTER_Y);
    strict_1.default.ok(prompt.y >= workArea.y);
    strict_1.default.ok(prompt.x >= workArea.x);
    strict_1.default.ok(prompt.x + prompt.width <= workArea.x + workArea.width);
});
(0, node_test_1.test)("accessibility prompt sits inward of a left pill, not off the left edge", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 12);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "left");
    const prompt = (0, dictation_pill_anchored_layout_1.getDictationAccessibilityPromptBounds)(pill, "left", workArea, true);
    const cardX = prompt.x + dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_GUTTER_X;
    strict_1.default.equal(cardX, visual.x + visual.width + dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_GAP);
    strict_1.default.ok(cardX < pill.x + pill.width);
    strict_1.default.ok(prompt.x >= workArea.x);
    strict_1.default.ok(prompt.x + prompt.width <= workArea.x + workArea.width);
    strict_1.default.ok(prompt.y >= workArea.y);
    strict_1.default.ok(prompt.y + prompt.height <= workArea.y + workArea.height);
});
(0, node_test_1.test)("accessibility prompt sits inward of a right pill, not off the right edge", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("right", workArea, 12);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "right");
    const prompt = (0, dictation_pill_anchored_layout_1.getDictationAccessibilityPromptBounds)(pill, "right", workArea, true);
    const cardRight = prompt.x +
        dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_GUTTER_X +
        dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_CARD_WIDTH;
    strict_1.default.equal(cardRight, visual.x - dictation_pill_anchored_layout_1.DICTATION_A11Y_PROMPT_GAP);
    strict_1.default.ok(cardRight > pill.x);
    strict_1.default.ok(prompt.x >= workArea.x);
    strict_1.default.ok(prompt.x + prompt.width <= workArea.x + workArea.width);
});
(0, node_test_1.test)("side hover hit-tests sit on the edge-aligned rail, not the tooltip", () => {
    const left = (0, dictation_pill_layout_1.getDictationHoverRegion)("left");
    const right = (0, dictation_pill_layout_1.getDictationHoverRegion)("right");
    strict_1.default.ok(left.centerX < dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH / 2);
    strict_1.default.ok(right.centerX > dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH / 2);
    strict_1.default.ok(left.collapseHalfW > left.expandHalfW);
    strict_1.default.ok(right.collapseHalfW > right.expandHalfW);
});
(0, node_test_1.test)("bottom expand box covers the collapsed grabber", () => {
    // The expected strip below uses the macOS inset, so pin the platform: with
    // no pad around the nub, the Windows inset would no longer be hidden by slack.
    const region = (0, dictation_pill_layout_1.getDictationHoverRegion)("bottom", "darwin");
    const sliverTop = dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT -
        dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_INSET -
        dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_THICKNESS;
    const sliverBottom = dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT - dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_INSET;
    strict_1.default.ok(region.centerY - region.expandHalfH <= sliverTop);
    strict_1.default.ok(region.centerY + region.expandHalfH >= sliverBottom);
});
(0, node_test_1.test)("expand boxes stay on the grabber instead of the empty host", () => {
    const bottom = (0, dictation_pill_layout_1.getDictationHoverRegion)("bottom");
    const left = (0, dictation_pill_layout_1.getDictationHoverRegion)("left");
    strict_1.default.ok(bottom.expandHalfW <=
        dictation_pill_layout_1.DICTATION_PILL_GRABBER_LENGTH / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
    strict_1.default.ok(bottom.expandHalfH <=
        dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_THICKNESS / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
    strict_1.default.ok(left.expandHalfW <=
        dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_THICKNESS / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
    strict_1.default.ok(left.expandHalfH <=
        dictation_pill_layout_1.DICTATION_PILL_GRABBER_LENGTH / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
});
(0, node_test_1.test)("side collapse box keeps an inward shortcut chip under the cursor", () => {
    const left = (0, dictation_pill_layout_1.getDictationHoverRegion)("left");
    const chipEnd = dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET +
        dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_THICKNESS +
        6 +
        120;
    strict_1.default.ok(left.centerX + left.collapseHalfW >= chipEnd);
});
(0, node_test_1.test)("resting un-minimized widens the hover target to the whole pill", () => {
    // The nub's strip would leave most of the visible pill dead to the cursor.
    const nub = (0, dictation_pill_layout_1.getDictationHoverRegion)("bottom", "darwin");
    const pill = (0, dictation_pill_layout_1.getDictationHoverRegion)("bottom", "darwin", false);
    strict_1.default.ok(pill.expandHalfW > nub.expandHalfW, "length");
    strict_1.default.ok(pill.expandHalfH > nub.expandHalfH, "thickness");
    strict_1.default.equal(pill.expandHalfW, dictation_pill_layout_1.DICTATION_PILL_RESTING_LENGTH / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
    strict_1.default.equal(pill.expandHalfH, dictation_pill_layout_1.DICTATION_PILL_RESTING_THICKNESS / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
    // A thicker pill also stands further off the docked edge.
    strict_1.default.ok(pill.centerY < nub.centerY, "centre moves inboard");
});
(0, node_test_1.test)("a side dock widens the same way, on the other axis", () => {
    const nub = (0, dictation_pill_layout_1.getDictationHoverRegion)("right", "darwin");
    const pill = (0, dictation_pill_layout_1.getDictationHoverRegion)("right", "darwin", false);
    strict_1.default.equal(pill.expandHalfH, dictation_pill_layout_1.DICTATION_PILL_RESTING_LENGTH / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
    strict_1.default.equal(pill.expandHalfW, dictation_pill_layout_1.DICTATION_PILL_RESTING_THICKNESS / 2 + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD);
    strict_1.default.ok(pill.centerX < nub.centerX, "centre moves inboard");
});
const ANCHOR_WA = { x: 0, y: 25, width: 1440, height: 875 };
(0, node_test_1.test)("an edge anchor survives a move to a differently sized display", () => {
    // Dropped a quarter of the way along a wide display...
    const wide = { x: 0, y: 25, width: 2000, height: 1200 };
    const bounds = { x: 400, y: 900, width: 400, height: 200 };
    const f = (0, dictation_pill_layout_1.edgeAnchorFraction)("bottom", bounds, wide);
    strict_1.default.equal(f, 400 / (2000 - 400));
    // ...lands a quarter of the way along a narrow one, not off the end of it.
    const narrow = { x: 0, y: 0, width: 800, height: 600 };
    const placed = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", narrow, 8, f);
    strict_1.default.ok(placed.x >= narrow.x);
    strict_1.default.ok(placed.x + placed.width <= narrow.x + narrow.width);
});
(0, node_test_1.test)("a fraction of 0.5 keeps the historical centred dock", () => {
    for (const side of ["bottom", "top", "left", "right"]) {
        const centred = (0, dictation_pill_layout_1.getDictationPillBounds)(side, ANCHOR_WA, 8, 0.5);
        const def = (0, dictation_pill_layout_1.getDictationPillBounds)(side, ANCHOR_WA, 8);
        strict_1.default.deepEqual(centred, def, side);
    }
});
(0, node_test_1.test)("the anchor round-trips through a dock and back", () => {
    for (const side of ["bottom", "top", "left", "right"]) {
        const placed = (0, dictation_pill_layout_1.getDictationPillBounds)(side, ANCHOR_WA, 8, 0.2);
        const back = (0, dictation_pill_layout_1.edgeAnchorFraction)(side, placed, ANCHOR_WA);
        strict_1.default.ok(Math.abs(back - 0.2) < 0.01, `${side} ${back}`);
    }
});
(0, node_test_1.test)("a surface wider than its work area is not thrown off the edge", () => {
    const tiny = { x: 0, y: 0, width: 10, height: 10 };
    for (const anchor of [0, 0.5, 1]) {
        const b = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", tiny, 8, anchor);
        strict_1.default.equal(b.x, tiny.x, "clamped to the origin");
    }
});
(0, node_test_1.test)("a side host leaves room for the tooltip it opens inward", () => {
    // The window clips anything past its edge and the tooltip is one line, so
    // the host has to span the rail plus the tooltip's full width.
    const reserved = dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH -
        dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET -
        dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_THICKNESS -
        dictation_pill_layout_1.DICTATION_PILL_TOOLTIP_GAP;
    strict_1.default.equal(reserved, dictation_pill_layout_1.DICTATION_PILL_TOOLTIP_MAX_WIDTH);
});
(0, node_test_1.test)("a side rail dropped in a corner snaps to its own edge", () => {
    const wa = { x: 0, y: 25, width: 1440, height: 875 };
    // A right-docked host near the bottom-right corner. The host reserves 220px
    // inward for its tooltip, so its centre is nowhere near the visible rail.
    const host = {
        x: wa.width - dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH,
        y: 700,
        width: dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_SIDE_HEIGHT,
    };
    // Measuring the host picks the bottom: its centre is further from the right
    // edge than from the foot, even though the rail is hard against the right.
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)(host, wa), "bottom");
    // Measuring what the user can see picks the edge the rail is on.
    const rail = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(host, "right", "darwin");
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)(rail, wa), "right");
});
(0, node_test_1.test)("a horizontal pill's edge choice is unaffected by measuring the rail", () => {
    // Its visible rail shares the host's horizontal centre, so left/right
    // distances are identical either way — the case the side fix must not touch.
    const host = {
        x: 200,
        y: 760,
        width: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT,
    };
    const rail = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(host, "bottom", "darwin");
    strict_1.default.equal(rail.x + rail.width / 2, host.x + host.width / 2);
});
const CROSS_WA = { x: 0, y: 25, width: 1440, height: 875 };
/**
 * The visible surface's centre along the axis the destination edge runs. The
 * destination decides which coordinate matters, not the edge being left.
 */
function railCentre(host, on, along) {
    const rail = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(host, on, "darwin");
    return along === "bottom" || along === "top"
        ? rail.x + rail.width / 2
        : rail.y + rail.height / 2;
}
function dropOnto(host, from, to) {
    const anchor = (0, dictation_pill_layout_1.edgeAnchorForCentre)(to, railCentre(host, from, to), CROSS_WA, (0, dictation_pill_layout_1.getDictationPillWindowSize)(to));
    return (0, dictation_pill_layout_1.getDictationPillBounds)(to, CROSS_WA, 8, anchor);
}
(0, node_test_1.test)("crossing between edges keeps the pill where it was let go", () => {
    // A right-docked host, whose rail sits 228px from the host's own left edge.
    const sideHost = {
        x: CROSS_WA.width - dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH,
        y: 300,
        width: dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_SIDE_HEIGHT,
    };
    const landed = dropOnto(sideHost, "right", "left");
    strict_1.default.ok(Math.abs(railCentre(landed, "left", "left") -
        railCentre(sideHost, "right", "left")) <= 1, "a side-to-side drop holds its height");
    // And the horizontal pair, which changes host shape the other way.
    const barHost = {
        x: 400,
        y: CROSS_WA.height - dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT,
        width: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_HORIZONTAL_HEIGHT,
    };
    const toTop = dropOnto(barHost, "bottom", "top");
    strict_1.default.ok(Math.abs(railCentre(toTop, "top", "top") - railCentre(barHost, "bottom", "top")) <= 1, "a bottom-to-top drop holds its place across");
});
(0, node_test_1.test)("a corner drop onto a perpendicular edge lands at that end of it", () => {
    // A right rail dropped onto the bottom cannot be centred that far across —
    // a 360-wide host would hang off the screen — so it pins to the right end
    // rather than sliding back to the middle.
    const sideHost = {
        x: CROSS_WA.width - dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH,
        y: 300,
        width: dictation_pill_layout_1.DICTATION_PILL_SIDE_WIDTH,
        height: dictation_pill_layout_1.DICTATION_PILL_SIDE_HEIGHT,
    };
    const anchor = (0, dictation_pill_layout_1.edgeAnchorForCentre)("bottom", railCentre(sideHost, "right", "bottom"), CROSS_WA, (0, dictation_pill_layout_1.getDictationPillWindowSize)("bottom"));
    strict_1.default.equal(anchor, 1);
    const landed = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", CROSS_WA, 8, anchor);
    strict_1.default.equal(landed.x + landed.width, CROSS_WA.x + CROSS_WA.width, "flush with the right end of the bottom edge");
});
(0, node_test_1.test)("the open launcher's box sits on the nub's edge and contains the nub", () => {
    for (const side of ["bottom", "top", "left", "right"]) {
        const host = { x: 0, y: 0, ...(0, dictation_pill_layout_1.getDictationPillWindowSize)(side) };
        const launcher = (0, dictation_pill_layout_1.getDictationLauncherBounds)(side, "win32");
        const nub = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(host, side, "win32");
        strict_1.default.ok(launcher.width > 0 && launcher.height > 0, `${side} has area`);
        // Inside the host window.
        strict_1.default.ok(launcher.x >= 0 && launcher.y >= 0, `${side} starts inside`);
        strict_1.default.ok(launcher.x + launcher.width <= host.width, `${side} fits wide`);
        strict_1.default.ok(launcher.y + launcher.height <= host.height, `${side} fits tall`);
        // The nub's centre is on the launcher: hovering the nub is hovering it.
        const centre = { x: nub.x + nub.width / 2, y: nub.y + nub.height / 2 };
        strict_1.default.ok((0, dictation_pill_layout_1.isPointInRect)(centre, launcher), `${side} covers the nub`);
        // Just off the box is not on it.
        strict_1.default.equal((0, dictation_pill_layout_1.isPointInRect)({ x: launcher.x - 1, y: launcher.y - 1 }, launcher), false);
    }
});
//# sourceMappingURL=dictation-pill-layout.test.js.map
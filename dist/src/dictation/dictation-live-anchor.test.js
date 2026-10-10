"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_live_anchor_1 = require("./dictation-live-anchor");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const dictation_pill_position_1 = require("./dictation-pill-position");
const WORK_AREA = { x: 0, y: 25, width: 1440, height: 875 };
(0, node_test_1.test)("a drop docks to the edge nearest the rail, not the window's centre", () => {
    // A top bar in a window tall enough for its panels, let go in the upper
    // third of the screen: the window's centre is far below the bar.
    const bounds = { x: 100, y: 200, width: 1100, height: 560 };
    const rail = (0, dictation_live_anchor_1.liveBarRailRect)("top", bounds);
    strict_1.default.deepEqual(rail, {
        x: 100,
        y: 200,
        width: 1100,
        height: dictation_live_anchor_1.LIVE_BAR_HEIGHT,
    });
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)(rail, WORK_AREA), "top");
    strict_1.default.equal((0, dictation_pill_position_1.nearestDictationPillSide)(bounds, WORK_AREA), "bottom");
    // A bottom bar sits at the window's foot; a side rail hugs its edge and top.
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarRailRect)("bottom", bounds).y, bounds.y + bounds.height - dictation_live_anchor_1.LIVE_BAR_HEIGHT);
    const right = (0, dictation_live_anchor_1.liveBarRailRect)("right", bounds);
    strict_1.default.deepEqual(right, {
        x: bounds.x + bounds.width - dictation_live_anchor_1.LIVE_BAR_HEIGHT,
        y: bounds.y,
        width: dictation_live_anchor_1.LIVE_BAR_HEIGHT,
        height: dictation_live_anchor_1.VERTICAL_RAIL_HEIGHT,
    });
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarRailRect)("left", bounds).x, bounds.x);
});
(0, node_test_1.test)("a fresh bar opens on top unless the dictation pill is already there", () => {
    const pillAt = (side) => ({
        side,
        bounds: (0, dictation_pill_layout_1.getDictationPillBounds)(side, WORK_AREA, 0),
    });
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarOpeningSide)(null, WORK_AREA), "top");
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarOpeningSide)(pillAt("bottom"), WORK_AREA), "top");
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarOpeningSide)(pillAt("left"), WORK_AREA), "top");
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarOpeningSide)(pillAt("right"), WORK_AREA), "top");
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarOpeningSide)(pillAt("top"), WORK_AREA), "bottom");
});
(0, node_test_1.test)("a top pill on another display leaves the bar's top edge free", () => {
    const otherDisplay = {
        x: WORK_AREA.x + WORK_AREA.width,
        y: 0,
        width: 1920,
        height: 1080,
    };
    const pill = {
        side: "top",
        bounds: (0, dictation_pill_layout_1.getDictationPillBounds)("top", WORK_AREA, 0),
    };
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarOpeningSide)(pill, otherDisplay), "top");
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarOpeningSide)(pill, WORK_AREA), "bottom");
});
(0, node_test_1.test)("only a bottom dock opens upward", () => {
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarGrowsUpward)("bottom"), true);
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarGrowsUpward)("top"), false);
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarGrowsUpward)("left"), false);
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarGrowsUpward)("right"), false);
});
(0, node_test_1.test)("the rail's height covers everything stacked in it, the mark included", () => {
    // Anything added to the rail has to be added here too: the window is sized
    // from this number and the rail is centred on the pill by it, so a stale
    // value both clips the stop control and slides the rail off the pill.
    const circle = dictation_live_anchor_1.LIVE_BAR_HEIGHT;
    const tabs = dictation_live_anchor_1.LIVE_BAR_HEIGHT * 3;
    const stop = dictation_live_anchor_1.LIVE_BAR_HEIGHT * 2;
    const mark = dictation_live_anchor_1.LIVE_BAR_LOGO_SIZE + dictation_live_anchor_1.LIVE_BAR_LOGO_GAP * 2;
    strict_1.default.ok(dictation_live_anchor_1.VERTICAL_RAIL_HEIGHT >= dictation_live_anchor_1.LIVE_BAR_TOP_PADDING + circle + tabs + stop + mark, `rail ${dictation_live_anchor_1.VERTICAL_RAIL_HEIGHT} is too short for its contents`);
});
(0, node_test_1.test)("a drop keeps its place along the edge instead of flying to the middle", () => {
    const size = { width: 300, height: 200 };
    // Dropped hard into the bottom-left corner.
    const corner = { x: WORK_AREA.x + 12, y: 700, ...size };
    const bottom = (0, dictation_live_anchor_1.liveBarDropBounds)("bottom", "top", corner, WORK_AREA);
    strict_1.default.equal(bottom.x, corner.x, "stays left");
    strict_1.default.equal(bottom.y + bottom.height, WORK_AREA.y + WORK_AREA.height - 8, "pinned to the bottom edge");
    // ...and the same going the other way.
    const high = { x: 900, y: WORK_AREA.y + 4, ...size };
    const right = (0, dictation_live_anchor_1.liveBarDropBounds)("right", "right", high, WORK_AREA);
    strict_1.default.equal(right.y, high.y, "stays high");
    strict_1.default.equal(right.x + right.width, WORK_AREA.x + WORK_AREA.width - 8, "pinned to the right edge");
});
(0, node_test_1.test)("a drop past the work area is pulled back inside it", () => {
    const size = { width: 300, height: 200 };
    for (const bounds of [
        { x: -400, y: -400, ...size },
        { x: 99999, y: 99999, ...size },
    ]) {
        for (const side of ["bottom", "top", "left", "right"]) {
            for (const from of ["bottom", "top", "left", "right"]) {
                const b = (0, dictation_live_anchor_1.liveBarDropBounds)(side, from, bounds, WORK_AREA);
                strict_1.default.ok(b.x >= WORK_AREA.x, `${from}>${side} x`);
                strict_1.default.ok(b.y >= WORK_AREA.y, `${from}>${side} y`);
                strict_1.default.ok(b.x + b.width <= WORK_AREA.x + WORK_AREA.width, `${from}>${side} w`);
                strict_1.default.ok(b.y + b.height <= WORK_AREA.y + WORK_AREA.height, `${from}>${side} h`);
            }
            const b = (0, dictation_live_anchor_1.liveBarDropBounds)(side, side, bounds, WORK_AREA);
            strict_1.default.ok(b.x >= WORK_AREA.x, `${side} x`);
            strict_1.default.ok(b.y >= WORK_AREA.y, `${side} y`);
            strict_1.default.ok(b.x + b.width <= WORK_AREA.x + WORK_AREA.width, `${side} w`);
            strict_1.default.ok(b.y + b.height <= WORK_AREA.y + WORK_AREA.height, `${side} h`);
        }
    }
});
(0, node_test_1.test)("a side dock resolves its anchor against the rail, not the host window", () => {
    // The window is far taller than the rail pinned to its top, so resolving the
    // anchor against the window height leaves the rail high up the screen.
    const tall = 560;
    const y = (0, dictation_live_anchor_1.liveBarSideAnchoredY)(0.5, WORK_AREA, tall);
    const railCentre = y + dictation_live_anchor_1.VERTICAL_RAIL_HEIGHT / 2;
    const areaCentre = WORK_AREA.y + WORK_AREA.height / 2;
    strict_1.default.ok(Math.abs(railCentre - areaCentre) <= 1, `rail at ${railCentre}`);
    // Resolving against the window would have put it far above the centre.
    const naive = WORK_AREA.y + (WORK_AREA.height - tall) / 2 + dictation_live_anchor_1.VERTICAL_RAIL_HEIGHT / 2;
    strict_1.default.ok(areaCentre - naive > 100, "the bug this guards against");
});
(0, node_test_1.test)("an unclamped side anchor survives the round trip exactly", () => {
    const height = 560;
    const maxY = WORK_AREA.y + WORK_AREA.height - height;
    for (const anchor of [0, 0.25, 0.5]) {
        const y = (0, dictation_live_anchor_1.liveBarSideAnchoredY)(anchor, WORK_AREA, height);
        strict_1.default.ok(y < maxY, `${anchor} should not be clamped by this fixture`);
        const back = (0, dictation_live_anchor_1.liveBarSideAnchorFraction)({ x: 0, y, width: 0, height }, WORK_AREA);
        // Only rounding to whole pixels should separate them.
        strict_1.default.ok(Math.abs(back - anchor) < 0.002, `${anchor} -> ${back}`);
    }
});
(0, node_test_1.test)("a clamped side anchor stays on screen and stops climbing", () => {
    const height = 560;
    const maxY = WORK_AREA.y + WORK_AREA.height - height;
    for (const anchor of [0.9, 1]) {
        const y = (0, dictation_live_anchor_1.liveBarSideAnchoredY)(anchor, WORK_AREA, height);
        strict_1.default.equal(y, maxY, `${anchor} pinned to the last on-screen row`);
    }
});
(0, node_test_1.test)("a side drop past the screen foot records where it landed", () => {
    const size = { width: 300, height: 560 };
    // Let go well below where a window this tall can actually sit.
    const dropped = { x: 1200, y: 700, ...size };
    const landed = (0, dictation_live_anchor_1.liveBarDropBounds)("right", "right", dropped, WORK_AREA);
    strict_1.default.ok(landed.y < dropped.y, "the drop was clamped on screen");
    const recorded = (0, dictation_live_anchor_1.liveBarSideAnchorFraction)(landed, WORK_AREA);
    const raw = (0, dictation_live_anchor_1.liveBarSideAnchorFraction)(dropped, WORK_AREA);
    strict_1.default.ok(recorded < raw, "recording the raw drop would sit lower");
    // What we record puts the bar back exactly where it landed...
    strict_1.default.equal((0, dictation_live_anchor_1.liveBarSideAnchoredY)(recorded, WORK_AREA, size.height), landed.y);
    // ...and anything else resolving the same anchor against a shorter box
    // lands level with the bar instead of below it.
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("right", WORK_AREA, 8, recorded);
    const fromRaw = (0, dictation_pill_layout_1.getDictationPillBounds)("right", WORK_AREA, 8, raw);
    strict_1.default.ok(pill.y < fromRaw.y, "the raw drop would have pushed it lower");
});
(0, node_test_1.test)("a bottom rail stays put when the window shrinks from the top", () => {
    const tall = { x: 100, y: 100, width: 400, height: 400 };
    const short = { x: 100, y: 464, width: 400, height: 36 };
    const cursor = { x: 180, y: 480 };
    const origin = (0, dictation_live_anchor_1.liveBarRailOrigin)("bottom", tall);
    const offsetY = cursor.y - origin.y;
    const next = (0, dictation_live_anchor_1.liveBarRailOrigin)("bottom", short);
    strict_1.default.equal(next.y + offsetY, cursor.y);
    strict_1.default.equal(origin.y, next.y);
});
(0, node_test_1.test)("a right rail stays on the docked edge when panels close", () => {
    const open = { x: 800, y: 200, width: 360, height: 260 };
    const closed = { x: 1084, y: 200, width: 76, height: 260 };
    const originOpen = (0, dictation_live_anchor_1.liveBarRailOrigin)("right", open);
    const originClosed = (0, dictation_live_anchor_1.liveBarRailOrigin)("right", closed);
    strict_1.default.equal(originOpen.x, originClosed.x);
    strict_1.default.equal(originOpen.y, originClosed.y);
});
(0, node_test_1.test)("the legacy bar opens flush top-centre, with no dock margin", () => {
    const workArea = { x: 100, y: 25, width: 1600, height: 900 };
    strict_1.default.deepEqual((0, dictation_live_anchor_1.legacyLiveBarBounds)({ width: 1100, height: 560 }, workArea), {
        x: 350,
        y: 25,
        width: 1100,
        height: 560,
    });
});
(0, node_test_1.test)("the compact window floor follows the flag", () => {
    const compact = { width: 1100, height: 560 };
    strict_1.default.deepEqual((0, dictation_live_anchor_1.liveCompactWindowMinSize)(true, compact), {
        minWidth: dictation_live_anchor_1.LIVE_BAR_COMPACT_MIN,
        minHeight: dictation_live_anchor_1.LIVE_BAR_COMPACT_MIN,
    });
    strict_1.default.deepEqual((0, dictation_live_anchor_1.liveCompactWindowMinSize)(false, compact), {
        minWidth: 1020,
        minHeight: 300,
    });
    strict_1.default.deepEqual((0, dictation_live_anchor_1.liveCompactWindowMinSize)(false, { width: 900, height: 560 }), { minWidth: 900, minHeight: 300 });
});
//# sourceMappingURL=dictation-live-anchor.test.js.map
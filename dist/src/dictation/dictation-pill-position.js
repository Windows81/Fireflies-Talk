"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DICTATION_PILL_DEFAULT_EDGE_ANCHOR = exports.DICTATION_PILL_CORNER_CLEARANCE_PX = exports.DICTATION_DOCK_HOME_ZONE_FRACTION = void 0;
exports.nearestDictationPillSide = nearestDictationPillSide;
exports.distanceToDockEdge = distanceToDockEdge;
exports.getDictationSnapProximity = getDictationSnapProximity;
exports.clampPillToWorkArea = clampPillToWorkArea;
exports.resizePillAroundVisualCenter = resizePillAroundVisualCenter;
exports.snapPillToEdge = snapPillToEdge;
exports.dictationDockEdgeCentre = dictationDockEdgeCentre;
exports.dictationDockHomeZoneHalfLength = dictationDockHomeZoneHalfLength;
exports.isWithinDictationDockHomeZone = isWithinDictationDockHomeZone;
exports.clampPillAlongEdge = clampPillAlongEdge;
exports.planDictationPillSideChoice = planDictationPillSideChoice;
exports.planDictationPillDrop = planDictationPillDrop;
exports.redockSavedDictationPill = redockSavedDictationPill;
const dictation_pill_layout_1 = require("./dictation-pill-layout");
/**
 * Share of an edge, centred on its default marker, inside which a drop goes
 * back to the default spot instead of staying where it landed. A quarter of
 * the edge is ±240 px on a 1920 px wide display and ±135 px on its 1080 px
 * sides, so a pill that still overlaps its default spot returns there while
 * one clearly carried past it keeps the place the user chose. A fraction
 * rather than pixels so the zone means the same thing on every display size.
 */
exports.DICTATION_DOCK_HOME_ZONE_FRACTION = 0.25;
/**
 * Room kept clear at each corner along an edge: one rail thickness plus its
 * margin on both sides, so a bar along the bottom or top never overlaps where
 * a side rail sits, and a side rail never overlaps a bottom or top bar.
 */
exports.DICTATION_PILL_CORNER_CLEARANCE_PX = dictation_pill_layout_1.DICTATION_PILL_THICKNESS + 2 * dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN;
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function isHorizontalDock(side) {
    return side === "bottom" || side === "top";
}
function nearestDictationPillSide(bounds, workArea) {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const distTop = cy - workArea.y;
    const distBottom = workArea.y + workArea.height - cy;
    const distLeft = cx - workArea.x;
    const distRight = workArea.x + workArea.width - cx;
    const min = Math.min(distTop, distBottom, distLeft, distRight);
    if (min === distLeft)
        return "left";
    if (min === distRight)
        return "right";
    if (min === distTop)
        return "top";
    return "bottom";
}
function distanceToDockEdge(side, bounds, workArea) {
    switch (side) {
        case "left":
            return Math.max(0, bounds.x - workArea.x);
        case "right":
            return Math.max(0, workArea.x + workArea.width - (bounds.x + bounds.width));
        case "bottom":
            return Math.max(0, workArea.y + workArea.height - (bounds.y + bounds.height));
        case "top":
            return Math.max(0, bounds.y - workArea.y);
        default: {
            const _exhaustive = side;
            return _exhaustive;
        }
    }
}
function getDictationSnapProximity(bounds, workArea) {
    const side = nearestDictationPillSide(bounds, workArea);
    const dist = distanceToDockEdge(side, bounds, workArea);
    const intensity = Math.max(0, Math.min(1, 1 - dist / dictation_pill_layout_1.DICTATION_SNAP_FALLOFF_PX));
    return { side, intensity };
}
function clampPillToWorkArea(bounds, workArea, side) {
    const overhang = side === "left" || side === "right"
        ? dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET - dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN
        : 0;
    return {
        x: clamp(bounds.x, workArea.x - overhang, workArea.x + workArea.width - bounds.width + overhang),
        y: clamp(bounds.y, workArea.y, workArea.y + workArea.height - bounds.height),
        width: bounds.width,
        height: bounds.height,
    };
}
function resizePillAroundVisualCenter(visualCenter, newSide, workArea, platform = process.platform) {
    const { width, height } = (0, dictation_pill_layout_1.getDictationPillWindowSize)(newSide);
    const origin = hostOriginForVisualCenter(visualCenter, newSide, { width, height }, platform);
    return clampPillToWorkArea({ ...origin, width, height }, workArea, newSide);
}
function hostOriginForVisualCenter(visualCenter, side, size, platform) {
    const railInset = (0, dictation_pill_layout_1.dictationPillBottomRailInset)(platform);
    switch (side) {
        case "left":
            return {
                x: Math.round(visualCenter.x -
                    dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET -
                    dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_THICKNESS / 2),
                y: Math.round(visualCenter.y - size.height / 2),
            };
        case "right":
            return {
                x: Math.round(visualCenter.x +
                    dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET +
                    dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_THICKNESS / 2 -
                    size.width),
                y: Math.round(visualCenter.y - size.height / 2),
            };
        case "top":
            return {
                x: Math.round(visualCenter.x - size.width / 2),
                y: Math.round(visualCenter.y - railInset - dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_THICKNESS / 2),
            };
        case "bottom":
            return {
                x: Math.round(visualCenter.x - size.width / 2),
                y: Math.round(visualCenter.y +
                    railInset +
                    dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_THICKNESS / 2 -
                    size.height),
            };
        default: {
            const _exhaustive = side;
            return _exhaustive;
        }
    }
}
/** Pins the host flush to its edge, keeping where it sits along that edge. */
function snapPillToEdge(bounds, side, workArea, bottomMargin) {
    const docked = (0, dictation_pill_layout_1.getDictationPillBounds)(side, workArea, bottomMargin);
    switch (side) {
        case "bottom":
        case "top":
            return { ...bounds, y: docked.y };
        case "left":
        case "right":
            return { ...bounds, x: docked.x };
        default: {
            const _exhaustive = side;
            return _exhaustive;
        }
    }
}
/** Midpoint of the edge along its length: where the default marker sits. */
function dictationDockEdgeCentre(side, workArea) {
    return isHorizontalDock(side)
        ? workArea.x + workArea.width / 2
        : workArea.y + workArea.height / 2;
}
function dictationDockHomeZoneHalfLength(side, workArea) {
    const length = isHorizontalDock(side) ? workArea.width : workArea.height;
    return (length * exports.DICTATION_DOCK_HOME_ZONE_FRACTION) / 2;
}
/** Whether a visible centre this far along the edge counts as "at home". */
function isWithinDictationDockHomeZone(side, alongCentre, workArea) {
    return (Math.abs(alongCentre - dictationDockEdgeCentre(side, workArea)) <=
        dictationDockHomeZoneHalfLength(side, workArea));
}
/** Keeps a docked host inside the edge, clear of both corners. */
function clampPillAlongEdge(bounds, side, workArea) {
    const clearance = exports.DICTATION_PILL_CORNER_CLEARANCE_PX;
    if (isHorizontalDock(side)) {
        const min = workArea.x + clearance;
        const max = workArea.x + workArea.width - bounds.width - clearance;
        const x = min > max
            ? workArea.x + Math.round((workArea.width - bounds.width) / 2)
            : clamp(bounds.x, min, max);
        return { ...bounds, x };
    }
    const min = workArea.y + clearance;
    const max = workArea.y + workArea.height - bounds.height - clearance;
    const y = min > max
        ? workArea.y + Math.round((workArea.height - bounds.height) / 2)
        : clamp(bounds.y, min, max);
    return { ...bounds, y };
}
/** The default spot along any edge: centred, where a home-zone drop returns. */
exports.DICTATION_PILL_DEFAULT_EDGE_ANCHOR = 0.5;
/**
 * Where the pill rests when the user picks an edge in Settings rather than
 * dragging to it: that edge's default spot on the given display.
 */
function planDictationPillSideChoice(side, workArea, bottomMargin) {
    return {
        bounds: (0, dictation_pill_layout_1.getDictationPillBounds)(side, workArea, bottomMargin, exports.DICTATION_PILL_DEFAULT_EDGE_ANCHOR),
        edgeAnchor: exports.DICTATION_PILL_DEFAULT_EDGE_ANCHOR,
        returnedHome: true,
    };
}
/**
 * Where a released pill comes to rest. It always docks flush to `side`; along
 * that edge it goes back to the default spot when let go inside the home zone
 * and otherwise stays under the release point, clear of the corners.
 */
function planDictationPillDrop(input) {
    const { side, visualCentre, workArea, bottomMargin } = input;
    const platform = input.platform ?? process.platform;
    const along = isHorizontalDock(side) ? visualCentre.x : visualCentre.y;
    if (isWithinDictationDockHomeZone(side, along, workArea)) {
        return planDictationPillSideChoice(side, workArea, bottomMargin);
    }
    const resized = resizePillAroundVisualCenter(visualCentre, side, workArea, platform);
    const bounds = clampPillAlongEdge(snapPillToEdge(resized, side, workArea, bottomMargin), side, workArea);
    return {
        bounds,
        edgeAnchor: (0, dictation_pill_layout_1.edgeAnchorFraction)(side, bounds, workArea),
        returnedHome: false,
    };
}
/**
 * Re-applies the drop rules to a remembered position, so a pill saved before
 * they existed — or on a display of another shape — never comes back floating
 * mid-screen. Already-docked positions map onto themselves.
 */
function redockSavedDictationPill(saved, workArea, bottomMargin, platform = process.platform) {
    const host = {
        x: saved.x,
        y: saved.y,
        ...(0, dictation_pill_layout_1.getDictationPillWindowSize)(saved.side),
    };
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(host, saved.side, platform);
    const side = nearestDictationPillSide((0, dictation_pill_layout_1.isDictationPillSideDock)(saved.side) ? visual : host, workArea);
    const plan = planDictationPillDrop({
        side,
        visualCentre: {
            x: visual.x + visual.width / 2,
            y: visual.y + visual.height / 2,
        },
        workArea,
        bottomMargin,
        platform,
    });
    return { side, ...plan };
}
//# sourceMappingURL=dictation-pill-position.js.map
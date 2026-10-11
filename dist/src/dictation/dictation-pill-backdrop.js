"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKDROP_DARK_BELOW = exports.BACKDROP_LIGHT_ABOVE = void 0;
exports.dictationPillBackdropRegion = dictationPillBackdropRegion;
exports.classifyDictationPillBackdrop = classifyDictationPillBackdrop;
exports.clipRect = clipRect;
const dictation_pill_layout_1 = require("./dictation-pill-layout");
/**
 * What the pill floats over: where to read it, and the light/dark call made
 * from the reading. Pure, kept free of Electron so the rules are
 * unit-testable. The sampler that takes the reading lives next door.
 */
/** The band read is this thick, this far in from the pill, and overhangs it by this much on each side. */
const REGION_BAND = 12;
const REGION_GAP = 2;
const REGION_OVERHANG = 16;
/**
 * How far in from the docked edge the pill can reach: the launcher and the
 * meter are this thick, while the nub is far thinner. The strip is read from
 * beyond that, so an open pill never covers it and reads as its own dark shell
 * — the idle frame after it closes would otherwise wear the wrong treatment.
 */
const REGION_CLEARANCE = dictation_pill_layout_1.DICTATION_PILL_THICKNESS;
/**
 * The strip of screen the pill sits against: a band just inward of the
 * resting nub (above a bottom-docked one), a little wider than it. Not the
 * whole host window — that is mostly empty air, and on a monitor where it
 * straddles a window edge the average lands in the mid-grey nobody sees.
 * Not the pill itself either, whose own dark pixels would bias the read.
 */
function dictationPillBackdropRegion(host, side, platform) {
    const pill = nubBounds(host, side, platform);
    // Measured from the pill's outer edge, the one on the docked side.
    const inward = REGION_CLEARANCE + REGION_GAP;
    switch (side) {
        case "bottom":
            return {
                x: pill.x - REGION_OVERHANG,
                y: pill.y + pill.height - inward - REGION_BAND,
                width: pill.width + 2 * REGION_OVERHANG,
                height: REGION_BAND,
            };
        case "top":
            return {
                x: pill.x - REGION_OVERHANG,
                y: pill.y + inward,
                width: pill.width + 2 * REGION_OVERHANG,
                height: REGION_BAND,
            };
        case "left":
            return {
                x: pill.x + inward,
                y: pill.y - REGION_OVERHANG,
                width: REGION_BAND,
                height: pill.height + 2 * REGION_OVERHANG,
            };
        case "right":
            return {
                x: pill.x + pill.width - inward - REGION_BAND,
                y: pill.y - REGION_OVERHANG,
                width: REGION_BAND,
                height: pill.height + 2 * REGION_OVERHANG,
            };
        default: {
            const _exhaustive = side;
            return _exhaustive;
        }
    }
}
/** Average brightness (0..1) above which the backdrop is called light… */
exports.BACKDROP_LIGHT_ABOVE = 0.55;
/** …and below which it is called dark again. The gap keeps a mid-grey from flickering. */
exports.BACKDROP_DARK_BELOW = 0.45;
/** A reading in the band between the two thresholds keeps the previous call. */
function classifyDictationPillBackdrop(previous, luminance) {
    if (luminance > exports.BACKDROP_LIGHT_ABOVE)
        return "light";
    if (luminance < exports.BACKDROP_DARK_BELOW)
        return "dark";
    return previous ?? "dark";
}
/**
 * The visible rail spans the whole host along the docked edge; the nub itself
 * is only its middle stretch. What the pill sits against is what is beside
 * the nub, not what is beside the rest of the rail.
 */
function nubBounds(host, side, platform) {
    const rail = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(host, side, platform);
    const length = dictation_pill_layout_1.DICTATION_PILL_GRABBER_LENGTH;
    return side === "left" || side === "right"
        ? { ...rail, y: rail.y + (rail.height - length) / 2, height: length }
        : { ...rail, x: rail.x + (rail.width - length) / 2, width: length };
}
/** The part of `rect` inside `bounds`, or null when none of it is. */
function clipRect(rect, bounds) {
    const x0 = Math.max(rect.x, bounds.x);
    const y0 = Math.max(rect.y, bounds.y);
    const x1 = Math.min(rect.x + rect.width, bounds.x + bounds.width);
    const y1 = Math.min(rect.y + rect.height, bounds.y + bounds.height);
    if (x1 <= x0 || y1 <= y0)
        return null;
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}
//# sourceMappingURL=dictation-pill-backdrop.js.map
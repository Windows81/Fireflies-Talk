"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEETING_END_ANIMATION_TOP_MARGIN = void 0;
exports.dictationPillCapsuleBand = dictationPillCapsuleBand;
exports.meetingEndAnimationBounds = meetingEndAnimationBounds;
const dictation_pill_layout_1 = require("./dictation-pill-layout");
exports.MEETING_END_ANIMATION_TOP_MARGIN = 30;
/**
 * Band of the pill host window the capsule actually paints. The host is much
 * taller than the capsule to leave room for its tooltip, so avoiding the whole
 * window would push the animation far down the screen.
 */
function dictationPillCapsuleBand(pill) {
    const { bounds, side } = pill;
    const thickness = dictation_pill_layout_1.DICTATION_PILL_THICKNESS + dictation_pill_layout_1.DICTATION_PILL_HOVER_PAD * 2;
    if (side === "top") {
        return { ...bounds, height: Math.min(bounds.height, thickness) };
    }
    if (side === "bottom") {
        const height = Math.min(bounds.height, thickness);
        return { ...bounds, y: bounds.y + bounds.height - height, height };
    }
    return bounds;
}
function intersects(a, b) {
    return (a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y);
}
/**
 * Top-centre of the work area, unless the dictation pill sits there. Both
 * surfaces are translucent, so overlapping them reads as the animation being
 * behind the pill even when it is on top; step below the capsule instead.
 */
function meetingEndAnimationBounds(size, workArea, pill) {
    const placed = {
        x: workArea.x + Math.floor((workArea.width - size.width) / 2),
        y: workArea.y + exports.MEETING_END_ANIMATION_TOP_MARGIN,
        width: size.width,
        height: size.height,
    };
    if (!pill)
        return placed;
    const band = dictationPillCapsuleBand(pill);
    if (!intersects(placed, band))
        return placed;
    const below = band.y + band.height + dictation_pill_layout_1.DICTATION_PILL_EDGE_MARGIN;
    const maxY = workArea.y + workArea.height - size.height;
    return { ...placed, y: Math.min(below, maxY) };
}
//# sourceMappingURL=meeting-end-animation-position.js.map
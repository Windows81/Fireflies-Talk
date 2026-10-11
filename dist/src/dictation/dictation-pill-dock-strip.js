"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dockStripSide = dockStripSide;
exports.workAreaClearOfDock = workAreaClearOfDock;
// The strip's backing extends slightly past the icon list; the work area macOS
// reserves for a permanently visible Dock ends this far inside the strip.
const DOCK_STRIP_OVERSHOOT = 4;
// How far a strip may sit from a display edge and still count as that
// display's Dock (covers the gap macOS leaves under a magnified Dock).
const DOCK_EDGE_SLACK = 16;
// Which edge of `bounds` the strip is attached to, or null when the strip
// belongs to another display.
function dockStripSide(strip, bounds) {
    const right = bounds.x + bounds.width;
    const bottom = bounds.y + bounds.height;
    const centreX = strip.x + strip.width / 2;
    const centreY = strip.y + strip.height / 2;
    if (strip.width >= strip.height) {
        const onThisDisplay = centreX >= bounds.x && centreX < right;
        const atBottom = strip.y <= bottom && strip.y + strip.height >= bottom - DOCK_EDGE_SLACK;
        return onThisDisplay && atBottom ? "bottom" : null;
    }
    // macOS only shows a left/right Dock on the main display, so a vertical
    // strip is never a neighbouring display's Dock even when its hidden
    // position overlaps that display's coordinates.
    const mainDisplay = bounds.x === 0 && bounds.y === 0;
    if (!mainDisplay || centreY < bounds.y || centreY >= bottom)
        return null;
    if (strip.x + strip.width >= bounds.x &&
        strip.x <= bounds.x + DOCK_EDGE_SLACK)
        return "left";
    if (strip.x <= right && strip.x + strip.width >= right - DOCK_EDGE_SLACK)
        return "right";
    return null;
}
// The area the pill may use on `display` given where the Dock strip is right
// now. Falls back to `display.workArea` when the strip is unknown or belongs
// to another display.
//
// `workArea` alone is wrong in two live situations: an auto-hidden Dock that
// has slid in (workArea still spans the full display, so the pill sits on the
// Dock), and a fullscreen space where the Dock is gone but workArea still
// reserves room for it (so the pill floats above a bottom composer). Both are
// resolved by trusting the strip's current position over the reservation.
function workAreaClearOfDock(display, strip) {
    const { bounds, workArea } = display;
    if (!strip)
        return workArea;
    const side = dockStripSide(strip, bounds);
    if (!side)
        return workArea;
    const workRight = workArea.x + workArea.width;
    const workBottom = workArea.y + workArea.height;
    const boundsRight = bounds.x + bounds.width;
    const boundsBottom = bounds.y + bounds.height;
    switch (side) {
        case "bottom": {
            const hidden = strip.y >= boundsBottom;
            const bottom = hidden
                ? boundsBottom
                : Math.min(workBottom, strip.y + DOCK_STRIP_OVERSHOOT);
            return { ...workArea, height: bottom - workArea.y };
        }
        case "left": {
            const hidden = strip.x + strip.width <= bounds.x;
            const left = hidden
                ? bounds.x
                : Math.max(workArea.x, strip.x + strip.width - DOCK_STRIP_OVERSHOOT);
            return { ...workArea, x: left, width: workRight - left };
        }
        case "right": {
            const hidden = strip.x >= boundsRight;
            const right = hidden
                ? boundsRight
                : Math.min(workRight, strip.x + DOCK_STRIP_OVERSHOOT);
            return { ...workArea, width: right - workArea.x };
        }
    }
}
//# sourceMappingURL=dictation-pill-dock-strip.js.map
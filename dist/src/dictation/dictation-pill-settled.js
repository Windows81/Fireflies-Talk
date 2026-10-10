"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sameRect = sameRect;
exports.pillNeedsMove = pillNeedsMove;
function sameRect(a, b) {
    return (a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height);
}
/**
 * Whether the pill window needs another `setBounds`. Skips the call when the
 * same frame was already requested and the window still sits where the OS put
 * it then, so a constrained frame is not re-applied on every reposition tick.
 */
function pillNeedsMove(current, next, last) {
    if (sameRect(current, next))
        return false;
    if (!last)
        return true;
    return !(sameRect(next, last.requested) && sameRect(current, last.applied));
}
//# sourceMappingURL=dictation-pill-settled.js.map
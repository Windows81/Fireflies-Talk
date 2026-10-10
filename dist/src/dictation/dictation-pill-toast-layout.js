"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DICTATION_PILL_TOAST_GAP = exports.DICTATION_PILL_TOAST_MAX_WIDTH = exports.DICTATION_PILL_TOAST_HEIGHT = exports.DICTATION_PILL_TOAST_KEYCAP_PAD_Y = exports.DICTATION_PILL_TOAST_LINE_HEIGHT = exports.DICTATION_PILL_TOAST_PADDING_Y = void 0;
exports.dictationPillToastInset = dictationPillToastInset;
exports.dictationPillToastDepth = dictationPillToastDepth;
exports.getDictationPillToastAnchor = getDictationPillToastAnchor;
const dictation_pill_layout_1 = require("./dictation-pill-layout");
/**
 * The "Ready to paste" toast renders inside the pill's own host window,
 * in the room the host already keeps past the capsule for its tooltip. These
 * are its measurements, shared with the renderer so the two agree.
 */
exports.DICTATION_PILL_TOAST_PADDING_Y = 6;
exports.DICTATION_PILL_TOAST_LINE_HEIGHT = 16;
exports.DICTATION_PILL_TOAST_KEYCAP_PAD_Y = 1;
/** A single "<label> · <keys>" line. */
exports.DICTATION_PILL_TOAST_HEIGHT = exports.DICTATION_PILL_TOAST_PADDING_Y * 2 + exports.DICTATION_PILL_TOAST_LINE_HEIGHT;
exports.DICTATION_PILL_TOAST_MAX_WIDTH = dictation_pill_layout_1.DICTATION_PILL_TOOLTIP_MAX_WIDTH;
/** Air between the pill and the toast it hangs off. */
exports.DICTATION_PILL_TOAST_GAP = 4;
/**
 * Room between the docked edge and the toast that is not the pill itself: the
 * rail inset the pill sits at, plus the gap. The pill's thickness comes on top
 * (see `dictationPillToastDepth`) — it changes with the pill's shape, and the
 * toast keeps hugging whichever shape the pill wears while the toast is up.
 */
function dictationPillToastInset(side, platform) {
    const railInset = side === "left" || side === "right"
        ? dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET
        : (0, dictation_pill_layout_1.dictationPillBottomRailInset)(platform);
    return railInset + exports.DICTATION_PILL_TOAST_GAP;
}
/** Where the toast's near edge sits, measured from the docked edge. */
function dictationPillToastDepth(side, platform, pillThickness) {
    return dictationPillToastInset(side, platform) + pillThickness;
}
/** Flex anchoring that pins the toast to the pill end of its slot. */
function getDictationPillToastAnchor(side) {
    switch (side) {
        case "bottom":
            return { justifyContent: "flex-end", alignItems: "center" };
        case "top":
            return { justifyContent: "flex-start", alignItems: "center" };
        case "left":
            return { justifyContent: "center", alignItems: "flex-start" };
        case "right":
            return { justifyContent: "center", alignItems: "flex-end" };
    }
}
//# sourceMappingURL=dictation-pill-toast-layout.js.map
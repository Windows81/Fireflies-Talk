"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DICTATION_FEEDBACK_GUTTER_Y = exports.DICTATION_FEEDBACK_GUTTER_X = exports.DICTATION_FEEDBACK_HEIGHT = exports.DICTATION_FEEDBACK_WIDTH = exports.DICTATION_FEEDBACK_GAP = exports.DICTATION_FEEDBACK_POSITIVE_CARD_HEIGHT = exports.DICTATION_FEEDBACK_CARD_HEIGHT = exports.DICTATION_FEEDBACK_CARD_WIDTH = exports.DICTATION_SLACK_ASSISTANT_GUTTER_Y = exports.DICTATION_SLACK_ASSISTANT_GUTTER_X = exports.DICTATION_SLACK_ASSISTANT_HEIGHT = exports.DICTATION_SLACK_ASSISTANT_WIDTH = exports.DICTATION_SLACK_ASSISTANT_GAP = exports.DICTATION_SLACK_ASSISTANT_CARD_HEIGHT = exports.DICTATION_SLACK_ASSISTANT_CARD_WIDTH = exports.DICTATION_EMAIL_ASSISTANT_GUTTER_Y = exports.DICTATION_EMAIL_ASSISTANT_GUTTER_X = exports.DICTATION_EMAIL_ASSISTANT_HEIGHT = exports.DICTATION_EMAIL_ASSISTANT_WIDTH = exports.DICTATION_EMAIL_ASSISTANT_GAP = exports.DICTATION_EMAIL_ASSISTANT_CARD_HEIGHT = exports.DICTATION_EMAIL_ASSISTANT_CARD_WIDTH = exports.DICTATION_TALK_TEASER_GUTTER_Y = exports.DICTATION_TALK_TEASER_GUTTER_X = exports.DICTATION_TALK_TEASER_HEIGHT = exports.DICTATION_TALK_TEASER_WIDTH = exports.DICTATION_TALK_TEASER_GAP = exports.DICTATION_TALK_TEASER_CARD_HEIGHT = exports.DICTATION_TALK_TEASER_CARD_WIDTH = exports.DICTATION_PILL_CARD_ARROW_SPAN = exports.DICTATION_PILL_CARD_ARROW_OVERLAP = exports.DICTATION_PILL_CARD_ARROW_LENGTH = exports.DICTATION_A11Y_PROMPT_GUTTER_Y = exports.DICTATION_A11Y_PROMPT_GUTTER_X = exports.DICTATION_A11Y_PROMPT_GAP = exports.DICTATION_A11Y_PROMPT_CARD_WIDTH = exports.DICTATION_A11Y_PROMPT_HEIGHT = exports.DICTATION_A11Y_PROMPT_WIDTH = void 0;
exports.getPillAnchoredBounds = getPillAnchoredBounds;
exports.getDictationAccessibilityPromptBounds = getDictationAccessibilityPromptBounds;
exports.getDictationTalkTeaserBounds = getDictationTalkTeaserBounds;
exports.getDictationEmailAssistantBounds = getDictationEmailAssistantBounds;
exports.getDictationSlackAssistantBounds = getDictationSlackAssistantBounds;
exports.getDictationFeedbackPopoverBounds = getDictationFeedbackPopoverBounds;
const dictation_pill_layout_1 = require("./dictation-pill-layout");
exports.DICTATION_A11Y_PROMPT_WIDTH = 360;
exports.DICTATION_A11Y_PROMPT_HEIGHT = 210;
exports.DICTATION_A11Y_PROMPT_CARD_WIDTH = 320;
exports.DICTATION_A11Y_PROMPT_GAP = 8;
exports.DICTATION_A11Y_PROMPT_GUTTER_X = Math.floor((exports.DICTATION_A11Y_PROMPT_WIDTH - exports.DICTATION_A11Y_PROMPT_CARD_WIDTH) / 2);
exports.DICTATION_A11Y_PROMPT_GUTTER_Y = 4;
/** The arrow hangs past the card's edge, pointing at the pill. Shared by every pill-anchored card. */
exports.DICTATION_PILL_CARD_ARROW_LENGTH = 11;
exports.DICTATION_PILL_CARD_ARROW_OVERLAP = 4;
exports.DICTATION_PILL_CARD_ARROW_SPAN = 20;
exports.DICTATION_TALK_TEASER_CARD_WIDTH = 314;
exports.DICTATION_TALK_TEASER_CARD_HEIGHT = 130;
exports.DICTATION_TALK_TEASER_GAP = 6;
exports.DICTATION_TALK_TEASER_WIDTH = exports.DICTATION_TALK_TEASER_CARD_WIDTH +
    exports.DICTATION_PILL_CARD_ARROW_LENGTH -
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP +
    20;
exports.DICTATION_TALK_TEASER_HEIGHT = exports.DICTATION_TALK_TEASER_CARD_HEIGHT +
    exports.DICTATION_PILL_CARD_ARROW_LENGTH -
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP +
    20;
// The card and its arrow sit centred in the window, so the gutter on the axis
// facing the pill is whatever the window has left past the arrow's tip.
exports.DICTATION_TALK_TEASER_GUTTER_X = Math.floor((exports.DICTATION_TALK_TEASER_WIDTH -
    exports.DICTATION_TALK_TEASER_CARD_WIDTH -
    exports.DICTATION_PILL_CARD_ARROW_LENGTH +
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2);
exports.DICTATION_TALK_TEASER_GUTTER_Y = Math.floor((exports.DICTATION_TALK_TEASER_HEIGHT -
    exports.DICTATION_TALK_TEASER_CARD_HEIGHT -
    exports.DICTATION_PILL_CARD_ARROW_LENGTH +
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2);
exports.DICTATION_EMAIL_ASSISTANT_CARD_WIDTH = exports.DICTATION_TALK_TEASER_CARD_WIDTH;
exports.DICTATION_EMAIL_ASSISTANT_CARD_HEIGHT = exports.DICTATION_TALK_TEASER_CARD_HEIGHT;
exports.DICTATION_EMAIL_ASSISTANT_GAP = exports.DICTATION_TALK_TEASER_GAP;
exports.DICTATION_EMAIL_ASSISTANT_WIDTH = exports.DICTATION_TALK_TEASER_WIDTH;
exports.DICTATION_EMAIL_ASSISTANT_HEIGHT = exports.DICTATION_TALK_TEASER_HEIGHT;
exports.DICTATION_EMAIL_ASSISTANT_GUTTER_X = exports.DICTATION_TALK_TEASER_GUTTER_X;
exports.DICTATION_EMAIL_ASSISTANT_GUTTER_Y = exports.DICTATION_TALK_TEASER_GUTTER_Y;
exports.DICTATION_SLACK_ASSISTANT_CARD_WIDTH = exports.DICTATION_TALK_TEASER_CARD_WIDTH;
exports.DICTATION_SLACK_ASSISTANT_CARD_HEIGHT = exports.DICTATION_TALK_TEASER_CARD_HEIGHT;
exports.DICTATION_SLACK_ASSISTANT_GAP = exports.DICTATION_TALK_TEASER_GAP;
exports.DICTATION_SLACK_ASSISTANT_WIDTH = exports.DICTATION_TALK_TEASER_WIDTH;
exports.DICTATION_SLACK_ASSISTANT_HEIGHT = exports.DICTATION_TALK_TEASER_HEIGHT;
exports.DICTATION_SLACK_ASSISTANT_GUTTER_X = exports.DICTATION_TALK_TEASER_GUTTER_X;
exports.DICTATION_SLACK_ASSISTANT_GUTTER_Y = exports.DICTATION_TALK_TEASER_GUTTER_Y;
exports.DICTATION_FEEDBACK_CARD_WIDTH = 320;
// Sized for the low-rating details step; the window takes the tallest step
// and shorter steps hug its pill-facing edge.
exports.DICTATION_FEEDBACK_CARD_HEIGHT = 224;
/** The high-rating details step: same layout, a shorter chip list. */
exports.DICTATION_FEEDBACK_POSITIVE_CARD_HEIGHT = 270;
const DICTATION_FEEDBACK_MAX_CARD_HEIGHT = Math.max(exports.DICTATION_FEEDBACK_CARD_HEIGHT, exports.DICTATION_FEEDBACK_POSITIVE_CARD_HEIGHT);
exports.DICTATION_FEEDBACK_GAP = 6;
exports.DICTATION_FEEDBACK_WIDTH = exports.DICTATION_FEEDBACK_CARD_WIDTH +
    exports.DICTATION_PILL_CARD_ARROW_LENGTH -
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP +
    20;
exports.DICTATION_FEEDBACK_HEIGHT = DICTATION_FEEDBACK_MAX_CARD_HEIGHT +
    exports.DICTATION_PILL_CARD_ARROW_LENGTH -
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP +
    20;
// The card hugs the pill-facing edge rather than centring, so this gutter is
// exactly the space the overlay leaves past the arrow's tip on that axis.
exports.DICTATION_FEEDBACK_GUTTER_X = Math.floor((exports.DICTATION_FEEDBACK_WIDTH -
    exports.DICTATION_FEEDBACK_CARD_WIDTH -
    exports.DICTATION_PILL_CARD_ARROW_LENGTH +
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2);
exports.DICTATION_FEEDBACK_GUTTER_Y = Math.floor((exports.DICTATION_FEEDBACK_HEIGHT -
    DICTATION_FEEDBACK_MAX_CARD_HEIGHT -
    exports.DICTATION_PILL_CARD_ARROW_LENGTH +
    exports.DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2);
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
// The card's page renders at the window's zoom, so the window is sized in
// the same scale.
function scalePillAnchoredSurface(surface, zoom) {
    if (zoom === 1)
        return surface;
    return {
        width: Math.round(surface.width * zoom),
        height: Math.round(surface.height * zoom),
        gap: Math.round(surface.gap * zoom),
        gutterX: Math.round(surface.gutterX * zoom),
        gutterY: Math.round(surface.gutterY * zoom),
    };
}
function getPillAnchoredBounds(pill, side, workArea, surface, minimized, zoom = 1) {
    const { width, height, gap, gutterX, gutterY } = scalePillAnchoredSurface(surface, zoom);
    const visual = (0, dictation_pill_layout_1.getDictationPillAnchorBounds)(pill, side, minimized);
    let x;
    let y;
    switch (side) {
        case "left":
            x = visual.x + visual.width + gap - gutterX;
            y = pill.y + Math.floor((pill.height - height) / 2);
            break;
        case "right":
            x = visual.x - width - gap + gutterX;
            y = pill.y + Math.floor((pill.height - height) / 2);
            break;
        case "top":
            x = pill.x + Math.floor((pill.width - width) / 2);
            y = visual.y + visual.height + gap - gutterY;
            break;
        case "bottom":
            x = pill.x + Math.floor((pill.width - width) / 2);
            y = visual.y - height - gap + gutterY;
            break;
    }
    const maxX = workArea.x + workArea.width - width;
    const maxY = workArea.y + workArea.height - height;
    return {
        x: clamp(x, workArea.x, maxX),
        y: clamp(y, workArea.y, maxY),
        width,
        height,
    };
}
function getDictationAccessibilityPromptBounds(pill, side, workArea, minimized, zoom = 1) {
    return getPillAnchoredBounds(pill, side, workArea, {
        width: exports.DICTATION_A11Y_PROMPT_WIDTH,
        height: exports.DICTATION_A11Y_PROMPT_HEIGHT,
        gap: exports.DICTATION_A11Y_PROMPT_GAP,
        gutterX: exports.DICTATION_A11Y_PROMPT_GUTTER_X,
        gutterY: exports.DICTATION_A11Y_PROMPT_GUTTER_Y,
    }, minimized, zoom);
}
function getDictationTalkTeaserBounds(pill, side, workArea, minimized, zoom = 1) {
    return getPillAnchoredBounds(pill, side, workArea, {
        width: exports.DICTATION_TALK_TEASER_WIDTH,
        height: exports.DICTATION_TALK_TEASER_HEIGHT,
        gap: exports.DICTATION_TALK_TEASER_GAP,
        gutterX: exports.DICTATION_TALK_TEASER_GUTTER_X,
        gutterY: exports.DICTATION_TALK_TEASER_GUTTER_Y,
    }, minimized, zoom);
}
function getDictationEmailAssistantBounds(pill, side, workArea, minimized, zoom = 1) {
    return getPillAnchoredBounds(pill, side, workArea, {
        width: exports.DICTATION_EMAIL_ASSISTANT_WIDTH,
        height: exports.DICTATION_EMAIL_ASSISTANT_HEIGHT,
        gap: exports.DICTATION_EMAIL_ASSISTANT_GAP,
        gutterX: exports.DICTATION_EMAIL_ASSISTANT_GUTTER_X,
        gutterY: exports.DICTATION_EMAIL_ASSISTANT_GUTTER_Y,
    }, minimized, zoom);
}
function getDictationSlackAssistantBounds(pill, side, workArea, minimized, zoom = 1) {
    return getPillAnchoredBounds(pill, side, workArea, {
        width: exports.DICTATION_SLACK_ASSISTANT_WIDTH,
        height: exports.DICTATION_SLACK_ASSISTANT_HEIGHT,
        gap: exports.DICTATION_SLACK_ASSISTANT_GAP,
        gutterX: exports.DICTATION_SLACK_ASSISTANT_GUTTER_X,
        gutterY: exports.DICTATION_SLACK_ASSISTANT_GUTTER_Y,
    }, minimized, zoom);
}
function getDictationFeedbackPopoverBounds(pill, side, workArea, minimized, zoom = 1) {
    return getPillAnchoredBounds(pill, side, workArea, {
        width: exports.DICTATION_FEEDBACK_WIDTH,
        height: exports.DICTATION_FEEDBACK_HEIGHT,
        gap: exports.DICTATION_FEEDBACK_GAP,
        gutterX: exports.DICTATION_FEEDBACK_GUTTER_X,
        gutterY: exports.DICTATION_FEEDBACK_GUTTER_Y,
    }, minimized, zoom);
}
//# sourceMappingURL=dictation-pill-anchored-layout.js.map
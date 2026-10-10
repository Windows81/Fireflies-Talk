"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_anchored_layout_1 = require("./dictation-pill-anchored-layout");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
function assertInside(rect, area) {
    strict_1.default.ok(rect.x >= area.x);
    strict_1.default.ok(rect.y >= area.y);
    strict_1.default.ok(rect.x + rect.width <= area.x + area.width);
    strict_1.default.ok(rect.y + rect.height <= area.y + area.height);
}
(0, node_test_1.test)("the teaser window has room for the card, its arrow and the close chip", () => {
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_WIDTH >=
        dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_CARD_WIDTH + dictation_pill_anchored_layout_1.DICTATION_PILL_CARD_ARROW_LENGTH);
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_HEIGHT >=
        dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_CARD_HEIGHT + dictation_pill_anchored_layout_1.DICTATION_PILL_CARD_ARROW_LENGTH);
    // The close chip floats 4px above the card, so the gutter must cover it.
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GUTTER_Y >= 4);
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GUTTER_X >= 4);
});
(0, node_test_1.test)("teaser sits centred above a bottom pill, arrow tip a gap from the rail", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const teaser = (0, dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds)(pill, "bottom", workArea, true);
    strict_1.default.equal(teaser.width, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_WIDTH);
    strict_1.default.equal(teaser.height, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_HEIGHT);
    strict_1.default.equal(teaser.x, pill.x + Math.floor((pill.width - teaser.width) / 2), "centred on the pill");
    const arrowTip = teaser.y + teaser.height - dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GUTTER_Y;
    strict_1.default.equal(arrowTip, visual.y - dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GAP);
    assertInside(teaser, workArea);
});
(0, node_test_1.test)("teaser hangs centred below a top pill", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("top", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "top");
    const teaser = (0, dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds)(pill, "top", workArea, true);
    strict_1.default.equal(teaser.x, pill.x + Math.floor((pill.width - teaser.width) / 2));
    const arrowTip = teaser.y + dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GUTTER_Y;
    strict_1.default.equal(arrowTip, visual.y + visual.height + dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GAP);
    assertInside(teaser, workArea);
});
(0, node_test_1.test)("teaser sits inward of a left pill, vertically centred on it", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "left");
    const teaser = (0, dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds)(pill, "left", workArea, true);
    const arrowTip = teaser.x + dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GUTTER_X;
    strict_1.default.equal(arrowTip, visual.x + visual.width + dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GAP);
    strict_1.default.equal(teaser.y, pill.y + Math.floor((pill.height - teaser.height) / 2));
    assertInside(teaser, workArea);
});
(0, node_test_1.test)("teaser sits inward of a right pill, not off the right edge", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("right", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "right");
    const teaser = (0, dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds)(pill, "right", workArea, true);
    const arrowTip = teaser.x + teaser.width - dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GUTTER_X;
    strict_1.default.equal(arrowTip, visual.x - dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_GAP);
    strict_1.default.equal(teaser.y, pill.y + Math.floor((pill.height - teaser.height) / 2));
    assertInside(teaser, workArea);
});
(0, node_test_1.test)("teaser is clamped into the work area when the pill sits in a corner", () => {
    const offsetArea = { x: 100, y: 50, width: 1280, height: 720 };
    // A bottom pill mid-drag past the left edge would carry the card off-screen.
    const cornerPill = {
        ...(0, dictation_pill_layout_1.getDictationPillBounds)("bottom", offsetArea, 4, 0),
        x: offsetArea.x - 60,
    };
    const bottom = (0, dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds)(cornerPill, "bottom", offsetArea, true);
    strict_1.default.equal(bottom.x, offsetArea.x);
    assertInside(bottom, offsetArea);
    // A side pill hanging past the work-area floor pulls the card up.
    const lowPill = {
        ...(0, dictation_pill_layout_1.getDictationPillBounds)("left", offsetArea, 4, 1),
        y: offsetArea.y + offsetArea.height - 80,
    };
    const left = (0, dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds)(lowPill, "left", offsetArea, true);
    strict_1.default.equal(left.y + left.height, offsetArea.y + offsetArea.height, "pulled up to the work-area floor");
    assertInside(left, offsetArea);
    // A right pill hanging past the top is pushed down likewise.
    const highPill = {
        ...(0, dictation_pill_layout_1.getDictationPillBounds)("right", offsetArea, 4, 0),
        y: offsetArea.y - 80,
    };
    const right = (0, dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds)(highPill, "right", offsetArea, true);
    strict_1.default.equal(right.y, offsetArea.y);
    assertInside(right, offsetArea);
});
(0, node_test_1.test)("the Email Assistant card keeps the teaser's footprint", () => {
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_CARD_WIDTH, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_CARD_WIDTH);
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_CARD_HEIGHT, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_CARD_HEIGHT);
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_WIDTH, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_WIDTH);
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_HEIGHT, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_HEIGHT);
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GUTTER_Y >= 4);
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GUTTER_X >= 4);
});
(0, node_test_1.test)("Email Assistant card sits centred above a bottom pill, arrow tip a gap from the rail", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const card = (0, dictation_pill_anchored_layout_1.getDictationEmailAssistantBounds)(pill, "bottom", workArea, true);
    strict_1.default.equal(card.width, dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_WIDTH);
    strict_1.default.equal(card.height, dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_HEIGHT);
    strict_1.default.equal(card.x, pill.x + Math.floor((pill.width - card.width) / 2));
    const arrowTip = card.y + card.height - dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GUTTER_Y;
    strict_1.default.equal(arrowTip, visual.y - dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GAP);
    assertInside(card, workArea);
});
(0, node_test_1.test)("Email Assistant card sits inward of a left or right pill", () => {
    const left = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 4);
    const leftVisual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(left, "left");
    const leftCard = (0, dictation_pill_anchored_layout_1.getDictationEmailAssistantBounds)(left, "left", workArea, true);
    strict_1.default.equal(leftCard.x + dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GUTTER_X, leftVisual.x + leftVisual.width + dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GAP);
    assertInside(leftCard, workArea);
    const right = (0, dictation_pill_layout_1.getDictationPillBounds)("right", workArea, 4);
    const rightVisual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(right, "right");
    const rightCard = (0, dictation_pill_anchored_layout_1.getDictationEmailAssistantBounds)(right, "right", workArea, true);
    strict_1.default.equal(rightCard.x + rightCard.width - dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GUTTER_X, rightVisual.x - dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GAP);
    assertInside(rightCard, workArea);
});
(0, node_test_1.test)("Email Assistant card scales with zoom and stays in the work area", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const card = (0, dictation_pill_anchored_layout_1.getDictationEmailAssistantBounds)(pill, "bottom", workArea, true, 1.3);
    strict_1.default.equal(card.width, Math.round(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_WIDTH * 1.3));
    strict_1.default.equal(card.height, Math.round(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_HEIGHT * 1.3));
    const arrowTip = card.y + card.height - Math.round(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GUTTER_Y * 1.3);
    strict_1.default.equal(arrowTip, visual.y - Math.round(dictation_pill_anchored_layout_1.DICTATION_EMAIL_ASSISTANT_GAP * 1.3));
    const offsetArea = { x: 100, y: 50, width: 1280, height: 720 };
    const cornerPill = {
        ...(0, dictation_pill_layout_1.getDictationPillBounds)("bottom", offsetArea, 4, 0),
        x: offsetArea.x - 60,
    };
    const clamped = (0, dictation_pill_anchored_layout_1.getDictationEmailAssistantBounds)(cornerPill, "bottom", offsetArea, true);
    strict_1.default.equal(clamped.x, offsetArea.x);
    assertInside(clamped, offsetArea);
});
(0, node_test_1.test)("the Slack Assistant card keeps the teaser's footprint", () => {
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_CARD_WIDTH, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_CARD_WIDTH);
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_CARD_HEIGHT, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_CARD_HEIGHT);
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_WIDTH, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_WIDTH);
    strict_1.default.equal(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_HEIGHT, dictation_pill_anchored_layout_1.DICTATION_TALK_TEASER_HEIGHT);
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GUTTER_Y >= 4);
    strict_1.default.ok(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GUTTER_X >= 4);
});
(0, node_test_1.test)("Slack Assistant card sits centred above a bottom pill, arrow tip a gap from the rail", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const card = (0, dictation_pill_anchored_layout_1.getDictationSlackAssistantBounds)(pill, "bottom", workArea, true);
    strict_1.default.equal(card.width, dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_WIDTH);
    strict_1.default.equal(card.height, dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_HEIGHT);
    strict_1.default.equal(card.x, pill.x + Math.floor((pill.width - card.width) / 2));
    const arrowTip = card.y + card.height - dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GUTTER_Y;
    strict_1.default.equal(arrowTip, visual.y - dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GAP);
    assertInside(card, workArea);
});
(0, node_test_1.test)("Slack Assistant card sits inward of a left or right pill", () => {
    const left = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 4);
    const leftVisual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(left, "left");
    const leftCard = (0, dictation_pill_anchored_layout_1.getDictationSlackAssistantBounds)(left, "left", workArea, true);
    strict_1.default.equal(leftCard.x + dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GUTTER_X, leftVisual.x + leftVisual.width + dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GAP);
    assertInside(leftCard, workArea);
    const right = (0, dictation_pill_layout_1.getDictationPillBounds)("right", workArea, 4);
    const rightVisual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(right, "right");
    const rightCard = (0, dictation_pill_anchored_layout_1.getDictationSlackAssistantBounds)(right, "right", workArea, true);
    strict_1.default.equal(rightCard.x + rightCard.width - dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GUTTER_X, rightVisual.x - dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GAP);
    assertInside(rightCard, workArea);
});
(0, node_test_1.test)("Slack Assistant card scales with zoom and stays in the work area", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const card = (0, dictation_pill_anchored_layout_1.getDictationSlackAssistantBounds)(pill, "bottom", workArea, true, 1.3);
    strict_1.default.equal(card.width, Math.round(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_WIDTH * 1.3));
    strict_1.default.equal(card.height, Math.round(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_HEIGHT * 1.3));
    const arrowTip = card.y + card.height - Math.round(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GUTTER_Y * 1.3);
    strict_1.default.equal(arrowTip, visual.y - Math.round(dictation_pill_anchored_layout_1.DICTATION_SLACK_ASSISTANT_GAP * 1.3));
    const offsetArea = { x: 100, y: 50, width: 1280, height: 720 };
    const cornerPill = {
        ...(0, dictation_pill_layout_1.getDictationPillBounds)("bottom", offsetArea, 4, 0),
        x: offsetArea.x - 60,
    };
    const clamped = (0, dictation_pill_anchored_layout_1.getDictationSlackAssistantBounds)(cornerPill, "bottom", offsetArea, true);
    strict_1.default.equal(clamped.x, offsetArea.x);
    assertInside(clamped, offsetArea);
});
(0, node_test_1.test)("feedback popover sits above a bottom pill, hugging its edge", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const popover = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(pill, "bottom", workArea, true);
    strict_1.default.equal(popover.width, dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_WIDTH);
    strict_1.default.equal(popover.height, dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_HEIGHT);
    strict_1.default.equal(popover.x, pill.x + Math.floor((pill.width - popover.width) / 2), "centred on the pill");
    const arrowTip = popover.y + popover.height - dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GUTTER_Y;
    strict_1.default.equal(arrowTip, visual.y - dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GAP);
    assertInside(popover, workArea);
});
(0, node_test_1.test)("feedback popover sits inward of a left pill", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "left");
    const popover = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(pill, "left", workArea, true);
    const arrowTip = popover.x + dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GUTTER_X;
    strict_1.default.equal(arrowTip, visual.x + visual.width + dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GAP);
    assertInside(popover, workArea);
});
(0, node_test_1.test)("feedback popover sits inward of a right pill", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("right", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "right");
    const popover = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(pill, "right", workArea, true);
    const arrowTip = popover.x + popover.width - dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GUTTER_X;
    strict_1.default.equal(arrowTip, visual.x - dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GAP);
    assertInside(popover, workArea);
});
(0, node_test_1.test)("bottom popover clears the un-minimized resting pill", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const popover = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(pill, "bottom", workArea, false);
    const restingTop = pill.y +
        pill.height -
        (0, dictation_pill_layout_1.dictationPillBottomRailInset)(process.platform) -
        dictation_pill_layout_1.DICTATION_PILL_RESTING_THICKNESS;
    const arrowTip = popover.y + popover.height - dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GUTTER_Y;
    strict_1.default.equal(arrowTip, restingTop - dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GAP);
    strict_1.default.ok(arrowTip < restingTop, "the card must not overlap the pill");
    assertInside(popover, workArea);
});
(0, node_test_1.test)("a left dock anchors the same whether the pill is minimized or not", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("left", workArea, 4);
    const minimized = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(pill, "left", workArea, true);
    const resting = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(pill, "left", workArea, false);
    strict_1.default.deepEqual(resting, minimized);
});
(0, node_test_1.test)("zoom 1.3 scales the whole surface and keeps the gap above the pill", () => {
    const pill = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const visual = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(pill, "bottom");
    const popover = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(pill, "bottom", workArea, true, 1.3);
    strict_1.default.equal(popover.width, Math.round(dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_WIDTH * 1.3));
    strict_1.default.equal(popover.height, Math.round(dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_HEIGHT * 1.3));
    const arrowTip = popover.y + popover.height - Math.round(dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GUTTER_Y * 1.3);
    strict_1.default.equal(arrowTip, visual.y - Math.round(dictation_pill_anchored_layout_1.DICTATION_FEEDBACK_GAP * 1.3));
    assertInside(popover, workArea);
});
(0, node_test_1.test)("feedback popover is clamped into the work area", () => {
    const offsetArea = { x: 100, y: 50, width: 1280, height: 720 };
    const cornerPill = {
        ...(0, dictation_pill_layout_1.getDictationPillBounds)("bottom", offsetArea, 4, 0),
        x: offsetArea.x - 60,
    };
    const bottom = (0, dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds)(cornerPill, "bottom", offsetArea, true);
    strict_1.default.equal(bottom.x, offsetArea.x);
    assertInside(bottom, offsetArea);
});
//# sourceMappingURL=dictation-pill-anchored-layout.test.js.map
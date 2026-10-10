"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDictationFeedbackSender = isDictationFeedbackSender;
exports.positionDictationFeedbackPopover = positionDictationFeedbackPopover;
exports.hideDictationFeedbackPopover = hideDictationFeedbackPopover;
exports.isDictationFeedbackPopoverVisible = isDictationFeedbackPopoverVisible;
exports.raiseDictationFeedbackPopover = raiseDictationFeedbackPopover;
exports.rescueDictationFeedbackPopover = rescueDictationFeedbackPopover;
exports.showDictationFeedbackPopover = showDictationFeedbackPopover;
const dictation_pill_anchored_layout_1 = require("./dictation-pill-anchored-layout");
const dictation_pill_card_window_1 = require("./dictation-pill-card-window");
/**
 * The tenth-dictation feedback offer, a card anchored to the pill like the
 * "Try Talk" teaser. Unlike the teaser it is focusable: its second step takes
 * typed feedback, which a non-focusable window cannot receive.
 */
const feedbackWindow = (0, dictation_pill_card_window_1.createDictationPillCardWindow)({
    route: "/dictation-feedback",
    logLabel: "feedback popover",
    focusable: true,
    boundsFor: dictation_pill_anchored_layout_1.getDictationFeedbackPopoverBounds,
});
/** True when these ipc messages came from the card itself. */
function isDictationFeedbackSender(sender) {
    return feedbackWindow.isSender(sender);
}
function positionDictationFeedbackPopover(pill, side) {
    feedbackWindow.position(pill, side);
}
function hideDictationFeedbackPopover() {
    feedbackWindow.hide();
}
/** True once the card has loaded and been shown. */
function isDictationFeedbackPopoverVisible() {
    return feedbackWindow.isVisible();
}
function raiseDictationFeedbackPopover() {
    feedbackWindow.raise();
}
function rescueDictationFeedbackPopover() {
    feedbackWindow.rescue();
}
function showDictationFeedbackPopover(pill, side, onShown) {
    feedbackWindow.show(pill, side, onShown);
}
//# sourceMappingURL=dictation-feedback-window.js.map
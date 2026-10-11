"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDictationSlackAssistantSender = isDictationSlackAssistantSender;
exports.positionDictationSlackAssistantNudge = positionDictationSlackAssistantNudge;
exports.hideDictationSlackAssistantNudge = hideDictationSlackAssistantNudge;
exports.isDictationSlackAssistantNudgeVisible = isDictationSlackAssistantNudgeVisible;
exports.raiseDictationSlackAssistantNudge = raiseDictationSlackAssistantNudge;
exports.rescueDictationSlackAssistantNudge = rescueDictationSlackAssistantNudge;
exports.showDictationSlackAssistantNudge = showDictationSlackAssistantNudge;
const dictation_pill_anchored_layout_1 = require("./dictation-pill-anchored-layout");
const dictation_pill_card_window_1 = require("./dictation-pill-card-window");
/**
 * The Slack Assistant offer made after a few Talk pastes into Slack, a card
 * anchored to the pill like the "Try Talk" teaser. Like the teaser it only
 * takes clicks, so it must not become the key window and pull focus off the
 * message the user is writing.
 */
const slackAssistantWindow = (0, dictation_pill_card_window_1.createDictationPillCardWindow)({
    route: "/dictation-slack-assistant",
    logLabel: "Slack Assistant nudge",
    focusable: false,
    boundsFor: dictation_pill_anchored_layout_1.getDictationSlackAssistantBounds,
});
/** True when these ipc messages came from the card itself. */
function isDictationSlackAssistantSender(sender) {
    return slackAssistantWindow.isSender(sender);
}
function positionDictationSlackAssistantNudge(pill, side) {
    slackAssistantWindow.position(pill, side);
}
function hideDictationSlackAssistantNudge() {
    slackAssistantWindow.hide();
}
/** True once the card has loaded and been shown. */
function isDictationSlackAssistantNudgeVisible() {
    return slackAssistantWindow.isVisible();
}
function raiseDictationSlackAssistantNudge() {
    slackAssistantWindow.raise();
}
function rescueDictationSlackAssistantNudge() {
    slackAssistantWindow.rescue();
}
function showDictationSlackAssistantNudge(pill, side, onShown) {
    slackAssistantWindow.show(pill, side, onShown);
}
//# sourceMappingURL=dictation-slack-assistant-window.js.map
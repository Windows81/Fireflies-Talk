"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDictationEmailAssistantSender = isDictationEmailAssistantSender;
exports.positionDictationEmailAssistantNudge = positionDictationEmailAssistantNudge;
exports.hideDictationEmailAssistantNudge = hideDictationEmailAssistantNudge;
exports.isDictationEmailAssistantNudgeVisible = isDictationEmailAssistantNudgeVisible;
exports.raiseDictationEmailAssistantNudge = raiseDictationEmailAssistantNudge;
exports.rescueDictationEmailAssistantNudge = rescueDictationEmailAssistantNudge;
exports.showDictationEmailAssistantNudge = showDictationEmailAssistantNudge;
const dictation_pill_anchored_layout_1 = require("./dictation-pill-anchored-layout");
const dictation_pill_card_window_1 = require("./dictation-pill-card-window");
/**
 * The Email Assistant offer made after a few Talk pastes into an email
 * client, a card anchored to the pill like the "Try Talk" teaser. Like the
 * teaser it only takes clicks, so it must not become the key window and pull
 * focus off the email the user is writing.
 */
const emailAssistantWindow = (0, dictation_pill_card_window_1.createDictationPillCardWindow)({
    route: "/dictation-email-assistant",
    logLabel: "Email Assistant nudge",
    focusable: false,
    boundsFor: dictation_pill_anchored_layout_1.getDictationEmailAssistantBounds,
});
/** True when these ipc messages came from the card itself. */
function isDictationEmailAssistantSender(sender) {
    return emailAssistantWindow.isSender(sender);
}
function positionDictationEmailAssistantNudge(pill, side) {
    emailAssistantWindow.position(pill, side);
}
function hideDictationEmailAssistantNudge() {
    emailAssistantWindow.hide();
}
/** True once the card has loaded and been shown. */
function isDictationEmailAssistantNudgeVisible() {
    return emailAssistantWindow.isVisible();
}
function raiseDictationEmailAssistantNudge() {
    emailAssistantWindow.raise();
}
function rescueDictationEmailAssistantNudge() {
    emailAssistantWindow.rescue();
}
function showDictationEmailAssistantNudge(pill, side, onShown) {
    emailAssistantWindow.show(pill, side, onShown);
}
//# sourceMappingURL=dictation-email-assistant-window.js.map
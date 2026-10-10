"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDictationTalkTeaserContent = sendDictationTalkTeaserContent;
exports.isDictationTalkTeaserSender = isDictationTalkTeaserSender;
exports.positionDictationTalkTeaser = positionDictationTalkTeaser;
exports.hideDictationTalkTeaser = hideDictationTalkTeaser;
exports.raiseDictationTalkTeaser = raiseDictationTalkTeaser;
exports.rescueDictationTalkTeaser = rescueDictationTalkTeaser;
exports.showDictationTalkTeaser = showDictationTalkTeaser;
const dictation_pill_anchored_layout_1 = require("./dictation-pill-anchored-layout");
const dictation_pill_card_window_1 = require("./dictation-pill-card-window");
/**
 * The "Try Talk" card that sits beside the resting pill for someone who has
 * not made Talk theirs yet. Its own always-on-top window, anchored to the
 * pill's docked side like the Accessibility prompt is — the pill host is far
 * too small for it — and click-through wherever it is transparent, so only
 * the card takes the pointer. Try and the close chip still get clicks, but the
 * card must not become the key window and pull focus off whatever the user is
 * typing in.
 */
const teaserWindow = (0, dictation_pill_card_window_1.createDictationPillCardWindow)({
    route: "/dictation-talk-teaser",
    logLabel: "Talk teaser",
    focusable: false,
    boundsFor: dictation_pill_anchored_layout_1.getDictationTalkTeaserBounds,
});
/** Pushes the card's content to it, if the card is up. */
function sendDictationTalkTeaserContent(content) {
    teaserWindow.send("dictation:teaser-content", content);
}
/** True when these ipc messages came from the card itself. */
function isDictationTalkTeaserSender(sender) {
    return teaserWindow.isSender(sender);
}
function positionDictationTalkTeaser(pill, side) {
    teaserWindow.position(pill, side);
}
function hideDictationTalkTeaser() {
    teaserWindow.hide();
}
function raiseDictationTalkTeaser() {
    teaserWindow.raise();
}
function rescueDictationTalkTeaser() {
    teaserWindow.rescue();
}
function showDictationTalkTeaser(pill, side, onShown) {
    teaserWindow.show(pill, side, onShown);
}
//# sourceMappingURL=dictation-talk-teaser-window.js.map
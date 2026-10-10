"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dictationPillCardOwner = dictationPillCardOwner;
exports.offerCardTakesPillEdge = offerCardTakesPillEdge;
/**
 * Which card, if any, owns the pill's edge. They all anchor to the same side,
 * so only one may be up, and the order is by how much the person needs it:
 *
 * 1. the permission guide, which owns the edge outright — someone who cannot
 *    use Talk yet has nothing to celebrate or review;
 * 2. the introduction, for the same reason;
 * 3. the feedback offer, which is asked for once and gone if missed;
 * 4. the Email Assistant offer, which is made right after an email paste and
 *    turned away rather than queued when it cannot take the edge;
 * 5. the Slack Assistant offer, on the same terms;
 * 6. a nudge, which is the least urgent and comes back on the next sync once
 *    whatever displaced it is gone.
 */
function dictationPillCardOwner(state) {
    if (state.guideOpen)
        return null;
    if (state.teaser === "intro")
        return "teaser";
    if (state.feedbackActive)
        return "feedback";
    if (state.emailAssistantActive)
        return "emailAssistant";
    if (state.slackAssistantActive)
        return "slackAssistant";
    return state.teaser ? "teaser" : null;
}
const OFFER_ACTIVE_KEY = {
    emailAssistant: "emailAssistantActive",
    slackAssistant: "slackAssistantActive",
};
function offerCardTakesPillEdge(card, state) {
    const other = card === "emailAssistant" ? "slackAssistant" : "emailAssistant";
    const otherOfferHoldsEdge = state[OFFER_ACTIVE_KEY[other]];
    const owner = dictationPillCardOwner({
        ...state,
        [OFFER_ACTIVE_KEY[card]]: true,
    });
    return owner === card && !otherOfferHoldsEdge;
}
//# sourceMappingURL=dictation-pill-card-edge.js.map
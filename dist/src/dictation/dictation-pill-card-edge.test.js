"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_card_edge_1 = require("./dictation-pill-card-edge");
const edge = (overrides = {}) => ({
    teaser: null,
    feedbackActive: false,
    emailAssistantActive: false,
    slackAssistantActive: false,
    guideOpen: false,
    ...overrides,
});
(0, node_test_1.test)("nothing owns the edge when nothing wants it", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge()), null);
});
(0, node_test_1.test)("the guide takes the edge from every card", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ teaser: "intro", feedbackActive: true, guideOpen: true })), null);
});
(0, node_test_1.test)("the introduction outranks the feedback offer", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ teaser: "intro", feedbackActive: true })), "teaser");
});
(0, node_test_1.test)("a nudge yields to the feedback offer", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ teaser: "milestone", feedbackActive: true })), "feedback");
});
(0, node_test_1.test)("a nudge takes the edge back once the offer is gone", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ teaser: "milestone" })), "teaser");
});
(0, node_test_1.test)("the guide takes the edge from the Email Assistant offer", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ emailAssistantActive: true, guideOpen: true })), null);
});
(0, node_test_1.test)("the Email Assistant offer yields to the introduction", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ teaser: "intro", emailAssistantActive: true })), "teaser");
});
(0, node_test_1.test)("the Email Assistant offer yields to the feedback offer", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ feedbackActive: true, emailAssistantActive: true })), "feedback");
});
(0, node_test_1.test)("the Email Assistant offer outranks a nudge", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ teaser: "milestone", emailAssistantActive: true })), "emailAssistant");
});
(0, node_test_1.test)("the Email Assistant offer owns an otherwise free edge", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ emailAssistantActive: true })), "emailAssistant");
});
(0, node_test_1.test)("the Slack Assistant offer yields to the Email Assistant offer", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ emailAssistantActive: true, slackAssistantActive: true })), "emailAssistant");
});
(0, node_test_1.test)("the Slack Assistant offer outranks a nudge", () => {
    strict_1.default.equal((0, dictation_pill_card_edge_1.dictationPillCardOwner)(edge({ teaser: "milestone", slackAssistantActive: true })), "slackAssistant");
});
(0, node_test_1.test)("the first offer keeps the edge: email then Slack", () => {
    const taken = edge({ emailAssistantActive: true });
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("emailAssistant", taken), true);
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("slackAssistant", taken), false);
});
(0, node_test_1.test)("the first offer keeps the edge: Slack then email", () => {
    const taken = edge({ slackAssistantActive: true });
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("slackAssistant", taken), true);
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("emailAssistant", taken), false);
});
(0, node_test_1.test)("the guide turns an offer away", () => {
    const taken = edge({ guideOpen: true });
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("emailAssistant", taken), false);
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("slackAssistant", taken), false);
});
(0, node_test_1.test)("the introduction turns an offer away", () => {
    const taken = edge({ teaser: "intro" });
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("emailAssistant", taken), false);
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("slackAssistant", taken), false);
});
(0, node_test_1.test)("the feedback offer turns an assistant offer away", () => {
    const taken = edge({ feedbackActive: true });
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("emailAssistant", taken), false);
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("slackAssistant", taken), false);
});
(0, node_test_1.test)("an offer takes the edge from a nudge", () => {
    const taken = edge({ teaser: "milestone" });
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("emailAssistant", taken), true);
    strict_1.default.equal((0, dictation_pill_card_edge_1.offerCardTakesPillEdge)("slackAssistant", taken), true);
});
//# sourceMappingURL=dictation-pill-card-edge.test.js.map
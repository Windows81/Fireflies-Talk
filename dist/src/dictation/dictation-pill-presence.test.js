"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_presence_1 = require("./dictation-pill-presence");
(0, node_test_1.test)("isDictationEmailAssistantAction accepts the card's two buttons and nothing else", () => {
    for (const action of ["connect", "close"]) {
        strict_1.default.ok((0, dictation_pill_presence_1.isDictationEmailAssistantAction)(action), action);
    }
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationEmailAssistantAction)("try"), false);
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationEmailAssistantAction)("Connect"), false);
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationEmailAssistantAction)(""), false);
});
(0, node_test_1.test)("isDictationSlackAssistantAction accepts the card's two buttons and nothing else", () => {
    for (const action of ["connect", "close"]) {
        strict_1.default.ok((0, dictation_pill_presence_1.isDictationSlackAssistantAction)(action), action);
    }
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationSlackAssistantAction)("try"), false);
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationSlackAssistantAction)("Connect"), false);
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationSlackAssistantAction)(""), false);
});
(0, node_test_1.test)("isDictationEmailAssistantProvider accepts Gmail and Outlook and nothing else", () => {
    for (const provider of ["gmail", "outlook"]) {
        strict_1.default.ok((0, dictation_pill_presence_1.isDictationEmailAssistantProvider)(provider), provider);
    }
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationEmailAssistantProvider)("Gmail"), false);
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationEmailAssistantProvider)(null), false);
    strict_1.default.equal((0, dictation_pill_presence_1.isDictationEmailAssistantProvider)(""), false);
});
//# sourceMappingURL=dictation-pill-presence.test.js.map
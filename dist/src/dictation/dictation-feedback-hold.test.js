"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_feedback_hold_1 = require("./dictation-feedback-hold");
(0, node_test_1.test)("holds a new offer while dictation is not idle", () => {
    strict_1.default.equal((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)("recording", false), true);
    strict_1.default.equal((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)("processing", false), true);
});
(0, node_test_1.test)("never holds an already visible card", () => {
    strict_1.default.equal((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)("recording", true), false);
});
(0, node_test_1.test)("never holds while idle", () => {
    strict_1.default.equal((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)("idle", false), false);
    strict_1.default.equal((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)("idle", true), false);
});
//# sourceMappingURL=dictation-feedback-hold.test.js.map
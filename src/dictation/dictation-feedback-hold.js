"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldHoldFeedbackPopoverForDictation = shouldHoldFeedbackPopoverForDictation;
/**
 * The card waits for the dictation to finish rather than interrupting it;
 * an open card stays open (the user may be typing in the details step).
 */
function shouldHoldFeedbackPopoverForDictation(state, popoverVisible) {
    return state !== "idle" && !popoverVisible;
}
//# sourceMappingURL=dictation-feedback-hold.js.map
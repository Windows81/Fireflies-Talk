"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDictationPillPresence = isDictationPillPresence;
exports.isDictationTeaserContent = isDictationTeaserContent;
exports.isDictationTeaserAction = isDictationTeaserAction;
exports.isDictationEmailAssistantAction = isDictationEmailAssistantAction;
exports.isDictationEmailAssistantProvider = isDictationEmailAssistantProvider;
exports.isDictationSlackAssistantAction = isDictationSlackAssistantAction;
exports.isDictationFeedbackAction = isDictationFeedbackAction;
function isDictationPillPresence(value) {
    return value === "interactive" || value === "teaser" || value === "hidden";
}
function isDictationTeaserContent(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const { variant, milestone } = value;
    if (variant !== "intro" && variant !== "milestone")
        return false;
    // The name is interpolated into the card's copy: anything but a string
    // would be printed as one, and a fresh object every time would also slip past
    // the equality check that stops the card being resent.
    return milestone === undefined || typeof milestone === "string";
}
function isDictationTeaserAction(value) {
    return value === "try" || value === "close";
}
function isDictationEmailAssistantAction(value) {
    return value === "connect" || value === "close";
}
function isDictationEmailAssistantProvider(value) {
    return value === "gmail" || value === "outlook";
}
function isDictationSlackAssistantAction(value) {
    return value === "connect" || value === "close";
}
function isDictationFeedbackAction(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const action = value;
    if (action.type === "dismiss")
        return true;
    if (action.type !== "submit")
        return false;
    return (Number.isInteger(action.rating) &&
        action.rating >= 1 &&
        action.rating <= 5 &&
        typeof action.comment === "string" &&
        Array.isArray(action.categories) &&
        action.categories.every((category) => typeof category === "string"));
}
//# sourceMappingURL=dictation-pill-presence.js.map
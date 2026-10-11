"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_ORB_PASTE_CHARS = void 0;
exports.canPasteFromSender = canPasteFromSender;
/** A whole AskFred answer can be long, but nothing near a document. */
exports.MAX_ORB_PASTE_CHARS = 200000;
/**
 * Both dictation surfaces paste: the owner renderer lands the result of a
 * detached run as it completes, and the overlay pastes when the user presses
 * the button on the orb card. Anything else asking is not one of our windows.
 */
function canPasteFromSender(params) {
    if (!params.isOwner && !params.isOrb)
        return false;
    return params.textLength > 0 && params.textLength <= exports.MAX_ORB_PASTE_CHARS;
}
//# sourceMappingURL=dictation-action-orb-paste-policy.js.map
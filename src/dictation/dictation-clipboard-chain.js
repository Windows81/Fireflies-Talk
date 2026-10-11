"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepDictationForUser = keepDictationForUser;
exports.createChainClipboardState = createChainClipboardState;
exports.beginChainClipboard = beginChainClipboard;
exports.finishChainClipboard = finishChainClipboard;
function keepDictationForUser(state, pending, text, kept) {
    if (pending?.expected === text)
        return "cancel-restore";
    if (state.lastPasted !== text)
        return "too-late";
    state.keepForUser = true;
    state.user = kept;
    return "kept-by-chain";
}
function createChainClipboardState() {
    return {
        user: null,
        lastPasted: null,
        holdsDictation: false,
        keepForUser: false,
        inFlight: 0,
    };
}
/** The chain was idle and a paste is entering it. */
function beginChainClipboard(state, adopted) {
    state.user = adopted?.prior ?? null;
    state.lastPasted = adopted?.expected ?? null;
    state.holdsDictation = adopted !== null;
    state.keepForUser = false;
}
/**
 * The last paste left the chain. Returns the restore the chain owes, if any;
 * the caller schedules it and hands it to the next chain if that starts first.
 */
function finishChainClipboard(state) {
    const due = state.holdsDictation &&
        !state.keepForUser &&
        state.user !== null &&
        state.lastPasted !== null
        ? { prior: state.user, expected: state.lastPasted }
        : null;
    state.user = null;
    state.holdsDictation = false;
    state.keepForUser = false;
    state.lastPasted = null;
    return due;
}
//# sourceMappingURL=dictation-clipboard-chain.js.map
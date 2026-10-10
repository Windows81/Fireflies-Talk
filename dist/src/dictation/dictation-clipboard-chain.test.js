"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_clipboard_chain_1 = require("./dictation-clipboard-chain");
const userText = { type: "text", text: "shopping list" };
const kept = (text) => ({ type: "dictation", text });
function pasted(state, text, keepForUser) {
    state.holdsDictation = true;
    state.lastPasted = text;
    state.keepForUser = keepForUser;
    if (keepForUser)
        state.user = kept(text);
}
(0, node_test_1.test)("a paste that landed owes a restore of the user's clipboard", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, null);
    state.user = userText;
    pasted(state, "hello", false);
    strict_1.default.deepEqual((0, dictation_clipboard_chain_1.finishChainClipboard)(state), {
        prior: userText,
        expected: "hello",
    });
});
(0, node_test_1.test)("a paste kept for the user owes no restore", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, null);
    state.user = userText;
    pasted(state, "hello", true);
    strict_1.default.equal((0, dictation_clipboard_chain_1.finishChainClipboard)(state), null);
});
(0, node_test_1.test)("a chain that starts under a pending restore takes it over", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, { prior: userText, expected: "hello" });
    strict_1.default.equal(state.user, userText);
    strict_1.default.equal(state.lastPasted, "hello");
    strict_1.default.equal(state.holdsDictation, true);
    strict_1.default.equal(state.keepForUser, false);
});
(0, node_test_1.test)("the same text dictated again and kept for the user is not restored over", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    // First "hello" pasted into a field; its restore is still ticking.
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, { prior: userText, expected: "hello" });
    // Second "hello" lands nowhere and is kept on the clipboard.
    pasted(state, "hello", true);
    strict_1.default.equal((0, dictation_clipboard_chain_1.finishChainClipboard)(state), null);
});
(0, node_test_1.test)("a second paste under a pending restore restores to the user's clipboard, not the first dictation", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, { prior: userText, expected: "hello" });
    pasted(state, "world", false);
    strict_1.default.deepEqual((0, dictation_clipboard_chain_1.finishChainClipboard)(state), {
        prior: userText,
        expected: "world",
    });
});
(0, node_test_1.test)("a chain that pasted nothing re-arms the restore it took over", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, { prior: userText, expected: "hello" });
    strict_1.default.deepEqual((0, dictation_clipboard_chain_1.finishChainClipboard)(state), {
        prior: userText,
        expected: "hello",
    });
});
(0, node_test_1.test)("a chain that pasted nothing and took nothing over owes nothing", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, null);
    strict_1.default.equal((0, dictation_clipboard_chain_1.finishChainClipboard)(state), null);
});
(0, node_test_1.test)("finishing resets the chain for the next one", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, { prior: userText, expected: "hello" });
    pasted(state, "world", false);
    (0, dictation_clipboard_chain_1.finishChainClipboard)(state);
    strict_1.default.deepEqual(state, { ...(0, dictation_clipboard_chain_1.createChainClipboardState)(), inFlight: 0 });
});
(0, node_test_1.test)("a dictation found to have landed nowhere cancels the restore waiting on it", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    const pending = { prior: userText, expected: "hello" };
    strict_1.default.equal((0, dictation_clipboard_chain_1.keepDictationForUser)(state, pending, "hello", kept("hello")), "cancel-restore");
});
(0, node_test_1.test)("a chain that took the restore over keeps the dictation instead", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, { prior: userText, expected: "hello" });
    strict_1.default.equal((0, dictation_clipboard_chain_1.keepDictationForUser)(state, null, "hello", kept("hello")), "kept-by-chain");
    strict_1.default.equal(state.keepForUser, true);
    strict_1.default.deepEqual(state.user, kept("hello"));
    strict_1.default.equal((0, dictation_clipboard_chain_1.finishChainClipboard)(state), null);
});
(0, node_test_1.test)("nothing is kept once the restore has already run", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    strict_1.default.equal((0, dictation_clipboard_chain_1.keepDictationForUser)(state, null, "hello", kept("hello")), "too-late");
    strict_1.default.equal(state.keepForUser, false);
});
(0, node_test_1.test)("a different dictation on the clipboard is left alone", () => {
    const state = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    (0, dictation_clipboard_chain_1.beginChainClipboard)(state, { prior: userText, expected: "newer" });
    strict_1.default.equal((0, dictation_clipboard_chain_1.keepDictationForUser)(state, { prior: userText, expected: "newer" }, "older", kept("older")), "too-late");
    strict_1.default.equal(state.keepForUser, false);
});
//# sourceMappingURL=dictation-clipboard-chain.test.js.map
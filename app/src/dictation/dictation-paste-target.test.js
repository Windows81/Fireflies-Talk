"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_paste_target_1 = require("./dictation-paste-target");
const editable = { verdict: "editable", probeMs: 31 };
const none = { verdict: "none", probeMs: 15 };
const slowUnknown = { verdict: "unknown", probeMs: 60 };
(0, node_test_1.test)("parsePasteAck reads the verdict and probe time from a warm-helper ack", () => {
    strict_1.default.deepEqual((0, dictation_paste_target_1.parsePasteAck)("OK TARGET 31"), {
        verdict: "editable",
        probeMs: 31,
    });
    strict_1.default.deepEqual((0, dictation_paste_target_1.parsePasteAck)("OK NONE 15"), {
        verdict: "none",
        probeMs: 15,
    });
    strict_1.default.deepEqual((0, dictation_paste_target_1.parsePasteAck)("OK UNKNOWN 0"), {
        verdict: "unknown",
        probeMs: 0,
    });
});
(0, node_test_1.test)("parsePasteAck reads the helper time the macOS helper adds", () => {
    strict_1.default.deepEqual((0, dictation_paste_target_1.parsePasteAck)("OK TARGET 1 2350"), {
        verdict: "editable",
        probeMs: 1,
        helperUs: 2350,
    });
});
(0, node_test_1.test)("parsePasteAck treats a legacy bare OK as an unknown target", () => {
    strict_1.default.deepEqual((0, dictation_paste_target_1.parsePasteAck)("OK"), dictation_paste_target_1.UNKNOWN_PASTE_TARGET);
    strict_1.default.deepEqual((0, dictation_paste_target_1.parsePasteAck)("OK\n"), dictation_paste_target_1.UNKNOWN_PASTE_TARGET);
});
(0, node_test_1.test)("parsePasteAck tolerates surrounding whitespace and newlines", () => {
    strict_1.default.deepEqual((0, dictation_paste_target_1.parsePasteAck)("  OK NONE 15\r\n"), {
        verdict: "none",
        probeMs: 15,
    });
});
(0, node_test_1.test)("parsePasteAck rejects errors and malformed acks", () => {
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)("ERROR SendInput failed"), null);
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)("OK BOGUS 1"), null);
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)("OK TARGET"), null);
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)("OK TARGET abc"), null);
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)("OK TARGET -5"), null);
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)("OK TARGET 1 extra"), null);
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)("OK TARGET 1 2 3"), null);
    strict_1.default.equal((0, dictation_paste_target_1.parsePasteAck)(""), null);
});
(0, node_test_1.test)("a field focused at the keystroke needs no second look", () => {
    strict_1.default.equal((0, dictation_paste_target_1.needsPasteTargetRecheck)(editable), false);
    strict_1.default.equal((0, dictation_paste_target_1.needsPasteTargetRecheck)(none), true);
    strict_1.default.equal((0, dictation_paste_target_1.needsPasteTargetRecheck)(dictation_paste_target_1.UNKNOWN_PASTE_TARGET), true);
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(editable, none), editable);
});
(0, node_test_1.test)("focus that moved into a field after the paste means it landed (Slack, Claude, Cursor)", () => {
    const afterPaste = { verdict: "editable", probeMs: 12 };
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(none, afterPaste), afterPaste);
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(slowUnknown, afterPaste), afterPaste);
});
(0, node_test_1.test)("focus still on nothing after the paste confirms it landed nowhere", () => {
    const afterPaste = { verdict: "none", probeMs: 12 };
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(none, afterPaste), afterPaste);
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(slowUnknown, afterPaste), afterPaste);
});
(0, node_test_1.test)("an inconclusive or missing second look keeps the first verdict", () => {
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(none, dictation_paste_target_1.UNKNOWN_PASTE_TARGET), none);
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(none, null), none);
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(slowUnknown, slowUnknown), slowUnknown);
    strict_1.default.equal((0, dictation_paste_target_1.settlePasteTarget)(slowUnknown, null), slowUnknown);
});
(0, node_test_1.test)("only a confident empty target falls back to the clipboard", () => {
    strict_1.default.equal((0, dictation_paste_target_1.shouldFallbackToClipboard)({ verdict: "none", probeMs: 15 }), true);
    strict_1.default.equal((0, dictation_paste_target_1.shouldFallbackToClipboard)({ verdict: "editable", probeMs: 31 }), false);
    strict_1.default.equal((0, dictation_paste_target_1.shouldFallbackToClipboard)(dictation_paste_target_1.UNKNOWN_PASTE_TARGET), false);
    strict_1.default.equal((0, dictation_paste_target_1.shouldFallbackToClipboard)({ verdict: "unknown", probeMs: 60 }), false);
});
//# sourceMappingURL=dictation-paste-target.test.js.map
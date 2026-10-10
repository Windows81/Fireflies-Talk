"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const windows_paste_protocol_1 = require("./windows-paste-protocol");
(0, node_test_1.test)("warm helper paste command omits hwnd when the target is unknown", () => {
    strict_1.default.equal((0, windows_paste_protocol_1.formatWindowsPasteCommand)(), "PASTE");
});
(0, node_test_1.test)("warm helper paste command includes the captured hwnd", () => {
    strict_1.default.equal((0, windows_paste_protocol_1.formatWindowsPasteCommand)("12345"), "PASTE 12345");
});
(0, node_test_1.test)("parse accepts PASTE, PASTE hwnd, and QUIT", () => {
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("PASTE\n"), { type: "paste" });
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("PASTE 12345\r\n"), {
        type: "paste",
        hwnd: "12345",
    });
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("QUIT"), { type: "quit" });
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("NOPE"), { type: "unknown" });
});
(0, node_test_1.test)("probe command re-reads focus without pasting", () => {
    strict_1.default.equal((0, windows_paste_protocol_1.formatWindowsProbeCommand)(), "PROBE");
    strict_1.default.equal((0, windows_paste_protocol_1.formatWindowsProbeCommand)("12345"), "PROBE 12345");
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("PROBE\n"), { type: "probe" });
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("PROBE 12345\r\n"), {
        type: "probe",
        hwnd: "12345",
    });
});
(0, node_test_1.test)("copy command posts Ctrl+C without a target", () => {
    strict_1.default.equal((0, windows_paste_protocol_1.formatWindowsCopyCommand)(), "COPY");
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("COPY\r\n"), { type: "copy" });
});
(0, node_test_1.test)("warm command reads focus ahead of the paste", () => {
    strict_1.default.equal((0, windows_paste_protocol_1.formatWindowsWarmCommand)(), "WARM");
    strict_1.default.deepEqual((0, windows_paste_protocol_1.parseWindowsPasteCommand)("WARM\r\n"), { type: "warm" });
});
(0, node_test_1.test)("already-focused paste targets must not pay a settle sleep", () => {
    strict_1.default.equal((0, windows_paste_protocol_1.windowsPasteFocusSettleMs)(false), 0);
    strict_1.default.equal((0, windows_paste_protocol_1.windowsPasteFocusSettleMs)(true), 10);
});
(0, node_test_1.test)("a posted paste ACK timeout still looks like success but recycles the helper", () => {
    strict_1.default.deepEqual((0, windows_paste_protocol_1.pasteAckTimeout)(true), {
        recycleHelper: true,
        treatAsSuccess: true,
    });
    strict_1.default.deepEqual((0, windows_paste_protocol_1.pasteAckTimeout)(false), {
        recycleHelper: true,
        treatAsSuccess: false,
    });
});
//# sourceMappingURL=windows-paste-protocol.test.js.map
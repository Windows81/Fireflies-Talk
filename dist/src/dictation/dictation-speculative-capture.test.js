"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_speculative_capture_1 = require("./dictation-speculative-capture");
(0, node_test_1.test)("begin sends capture once; a second begin is a no-op", () => {
    const sent = [];
    const capture = (0, dictation_speculative_capture_1.createSpeculativeCapture)((channel) => sent.push(channel));
    capture.begin();
    capture.begin();
    strict_1.default.deepEqual(sent, ["dictation:capture"]);
    strict_1.default.equal(capture.isActive(), true);
});
(0, node_test_1.test)("adopt then discard sends nothing", () => {
    const sent = [];
    const capture = (0, dictation_speculative_capture_1.createSpeculativeCapture)((channel) => sent.push(channel));
    capture.begin();
    capture.adopt();
    capture.discard();
    strict_1.default.deepEqual(sent, ["dictation:capture"]);
    strict_1.default.equal(capture.isActive(), false);
});
(0, node_test_1.test)("discard after begin sends exactly one cancel", () => {
    const sent = [];
    const capture = (0, dictation_speculative_capture_1.createSpeculativeCapture)((channel) => sent.push(channel));
    capture.begin();
    capture.discard();
    capture.discard();
    strict_1.default.deepEqual(sent, ["dictation:capture", "dictation:cancel"]);
    strict_1.default.equal(capture.isActive(), false);
});
(0, node_test_1.test)("discard when inactive sends nothing", () => {
    const sent = [];
    const capture = (0, dictation_speculative_capture_1.createSpeculativeCapture)((channel) => sent.push(channel));
    capture.discard();
    strict_1.default.deepEqual(sent, []);
});
(0, node_test_1.test)("begin can capture again after a discard", () => {
    const sent = [];
    const capture = (0, dictation_speculative_capture_1.createSpeculativeCapture)((channel) => sent.push(channel));
    capture.begin();
    capture.discard();
    capture.begin();
    strict_1.default.deepEqual(sent, [
        "dictation:capture",
        "dictation:cancel",
        "dictation:capture",
    ]);
});
//# sourceMappingURL=dictation-speculative-capture.test.js.map
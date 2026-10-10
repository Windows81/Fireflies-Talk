"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const windows_chord_evaluate_1 = require("./windows-chord-evaluate");
(0, node_test_1.test)("overlapping action and dictation stay both down", () => {
    strict_1.default.deepEqual((0, windows_chord_evaluate_1.evaluateWindowsChords)(true, true, true), {
        action: true,
        dictation: true,
        handsFree: true,
    });
    strict_1.default.deepEqual((0, windows_chord_evaluate_1.evaluateWindowsChords)(true, false, false), {
        action: true,
        dictation: false,
        handsFree: false,
    });
    strict_1.default.deepEqual((0, windows_chord_evaluate_1.evaluateWindowsChords)(false, true, true), {
        action: false,
        dictation: true,
        handsFree: true,
    });
});
//# sourceMappingURL=windows-chord-evaluate.test.js.map
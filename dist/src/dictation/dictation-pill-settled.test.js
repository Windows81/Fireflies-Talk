"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_settled_1 = require("./dictation-pill-settled");
const wanted = { x: 700, y: 1096, width: 200, height: 100 };
// What macOS applies for `wanted` while the Dock is permanently visible.
const constrained = { ...wanted, y: 1088 };
(0, node_test_1.describe)("pillNeedsMove", () => {
    (0, node_test_1.it)("moves when the window is not where it should be", () => {
        strict_1.default.equal((0, dictation_pill_settled_1.pillNeedsMove)(constrained, wanted, null), true);
    });
    (0, node_test_1.it)("stays put when the window already matches", () => {
        strict_1.default.equal((0, dictation_pill_settled_1.pillNeedsMove)(wanted, wanted, null), false);
    });
    (0, node_test_1.it)("does not re-apply a frame the OS has already constrained", () => {
        const last = { requested: wanted, applied: constrained };
        strict_1.default.equal((0, dictation_pill_settled_1.pillNeedsMove)(constrained, wanted, last), false);
    });
    (0, node_test_1.it)("moves again once the target or the window changes", () => {
        const last = { requested: wanted, applied: constrained };
        strict_1.default.equal((0, dictation_pill_settled_1.pillNeedsMove)(constrained, { ...wanted, y: 1016 }, last), true);
        strict_1.default.equal((0, dictation_pill_settled_1.pillNeedsMove)({ ...constrained, x: 10 }, wanted, last), true);
    });
});
//# sourceMappingURL=dictation-pill-settled.test.js.map
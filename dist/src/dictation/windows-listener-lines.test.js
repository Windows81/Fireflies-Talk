"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
node_test_1.mock.module("electron", {
    exports: { BrowserWindow: { getAllWindows: () => [] } },
});
const loadLines = () => import("./windows-listener-lines.js");
(0, node_test_1.test)("hands-free listener lines only report the press", async () => {
    const { applyListenerLine } = await loadLines();
    let downs = 0;
    const callbacks = {
        onDown: () => { },
        onUp: () => { },
        onShiftChange: () => { },
        onInterrupted: () => { },
        onHandsFreeDown: () => {
            downs++;
        },
    };
    strict_1.default.equal(applyListenerLine("HANDSFREE_DOWN", callbacks), "event");
    strict_1.default.equal(applyListenerLine("HANDSFREE_UP", callbacks), "event");
    strict_1.default.equal(downs, 1);
});
//# sourceMappingURL=windows-listener-lines.test.js.map
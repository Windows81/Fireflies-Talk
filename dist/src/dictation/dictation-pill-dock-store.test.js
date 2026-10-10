"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_dock_1 = require("./dictation-pill-dock");
(0, node_test_1.test)("isDictationPillSide accepts the four edges and nothing else", () => {
    for (const side of ["top", "left", "right", "bottom"]) {
        strict_1.default.ok((0, dictation_pill_dock_1.isDictationPillSide)(side), side);
    }
    strict_1.default.equal((0, dictation_pill_dock_1.isDictationPillSide)("middle"), false);
    strict_1.default.equal((0, dictation_pill_dock_1.isDictationPillSide)(undefined), false);
    strict_1.default.equal((0, dictation_pill_dock_1.isDictationPillSide)(1), false);
});
(0, node_test_1.test)("accepts all four sides", () => {
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "left" }), {
        side: "left",
    });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "right", displayId: 2 }), {
        side: "right",
        displayId: 2,
    });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "bottom" }), {
        side: "bottom",
    });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "top" }), {
        side: "top",
    });
});
(0, node_test_1.test)("accepts position coordinates", () => {
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "bottom", x: 100, y: 200 }), { side: "bottom", x: 100, y: 200 });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "left", x: 50, y: 300, displayId: 1 }), { side: "left", x: 50, y: 300, displayId: 1 });
});
(0, node_test_1.test)("rejects invalid payloads", () => {
    strict_1.default.equal((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "middle" }), null);
    strict_1.default.equal((0, dictation_pill_dock_1.parseSavedDictationPillDock)(null), null);
    strict_1.default.equal((0, dictation_pill_dock_1.parseSavedDictationPillDock)("left"), null);
});
(0, node_test_1.test)("drops a non-numeric display id and keeps the side", () => {
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "left", displayId: "2" }), { side: "left" });
});
(0, node_test_1.test)("keeps a finite along-edge anchor", () => {
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "left", displayId: 2, anchor: 0.25 }), { side: "left", displayId: 2, anchor: 0.25 });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "top", anchor: 0 }), {
        side: "top",
        anchor: 0,
    });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "bottom", anchor: 1 }), {
        side: "bottom",
        anchor: 1,
    });
});
(0, node_test_1.test)("drops an invalid anchor and keeps the rest", () => {
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "right", displayId: 3, anchor: 1.2 }), { side: "right", displayId: 3 });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "left", anchor: "0.5" }), { side: "left" });
    strict_1.default.deepEqual((0, dictation_pill_dock_1.parseSavedDictationPillDock)({ side: "top", anchor: NaN }), {
        side: "top",
    });
});
//# sourceMappingURL=dictation-pill-dock-store.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const dictation_pill_toast_layout_1 = require("./dictation-pill-toast-layout");
const SIDES = ["bottom", "top", "left", "right"];
const PLATFORMS = ["win32", "darwin"];
/** Slimmest and widest shapes the shell morphs between. */
const THICKNESSES = [
    dictation_pill_layout_1.DICTATION_PILL_BOTTOM_RAIL_THICKNESS,
    dictation_pill_layout_1.DICTATION_PILL_THICKNESS,
];
(0, node_test_1.test)("the toast hugs the pill tighter than the tooltip does", () => {
    strict_1.default.ok(dictation_pill_toast_layout_1.DICTATION_PILL_TOAST_GAP > 0);
    strict_1.default.ok(dictation_pill_toast_layout_1.DICTATION_PILL_TOAST_GAP < dictation_pill_layout_1.DICTATION_PILL_TOOLTIP_GAP);
});
(0, node_test_1.test)("the inset past the pill is the rail inset plus the toast gap", () => {
    for (const platform of PLATFORMS) {
        for (const side of ["bottom", "top"]) {
            strict_1.default.equal((0, dictation_pill_toast_layout_1.dictationPillToastInset)(side, platform), (0, dictation_pill_layout_1.dictationPillBottomRailInset)(platform) + dictation_pill_toast_layout_1.DICTATION_PILL_TOAST_GAP);
        }
        for (const side of ["left", "right"]) {
            strict_1.default.equal((0, dictation_pill_toast_layout_1.dictationPillToastInset)(side, platform), dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET + dictation_pill_toast_layout_1.DICTATION_PILL_TOAST_GAP);
        }
    }
});
(0, node_test_1.test)("the toast depth follows the pill's current thickness", () => {
    for (const side of SIDES) {
        for (const platform of PLATFORMS) {
            for (const thickness of THICKNESSES) {
                strict_1.default.equal((0, dictation_pill_toast_layout_1.dictationPillToastDepth)(side, platform, thickness), (0, dictation_pill_toast_layout_1.dictationPillToastInset)(side, platform) + thickness);
            }
            const slim = (0, dictation_pill_toast_layout_1.dictationPillToastDepth)(side, platform, THICKNESSES[0]);
            const wide = (0, dictation_pill_toast_layout_1.dictationPillToastDepth)(side, platform, THICKNESSES[1]);
            strict_1.default.equal(wide - slim, THICKNESSES[1] - THICKNESSES[0]);
        }
    }
});
(0, node_test_1.test)("the toast is no wider than the tooltip and fits the host on every dock", () => {
    strict_1.default.equal(dictation_pill_toast_layout_1.DICTATION_PILL_TOAST_MAX_WIDTH, dictation_pill_layout_1.DICTATION_PILL_TOOLTIP_MAX_WIDTH);
    for (const side of SIDES) {
        for (const platform of PLATFORMS) {
            const host = (0, dictation_pill_layout_1.getDictationPillWindowSize)(side);
            const depth = (0, dictation_pill_toast_layout_1.dictationPillToastDepth)(side, platform, dictation_pill_layout_1.DICTATION_PILL_THICKNESS);
            const vertical = side === "left" || side === "right";
            const room = (vertical ? host.width : host.height) - depth;
            const needed = vertical
                ? dictation_pill_toast_layout_1.DICTATION_PILL_TOAST_MAX_WIDTH
                : dictation_pill_toast_layout_1.DICTATION_PILL_TOAST_HEIGHT;
            strict_1.default.ok(room >= needed, `${side}/${platform} leaves ${room}px past the pill for a ${needed}px toast`);
        }
    }
});
(0, node_test_1.test)("the anchor pins the toast to the pill end of the host", () => {
    strict_1.default.deepEqual((0, dictation_pill_toast_layout_1.getDictationPillToastAnchor)("bottom"), {
        justifyContent: "flex-end",
        alignItems: "center",
    });
    strict_1.default.deepEqual((0, dictation_pill_toast_layout_1.getDictationPillToastAnchor)("top"), {
        justifyContent: "flex-start",
        alignItems: "center",
    });
    strict_1.default.deepEqual((0, dictation_pill_toast_layout_1.getDictationPillToastAnchor)("left"), {
        justifyContent: "center",
        alignItems: "flex-start",
    });
    strict_1.default.deepEqual((0, dictation_pill_toast_layout_1.getDictationPillToastAnchor)("right"), {
        justifyContent: "center",
        alignItems: "flex-end",
    });
});
//# sourceMappingURL=dictation-pill-toast-layout.test.js.map
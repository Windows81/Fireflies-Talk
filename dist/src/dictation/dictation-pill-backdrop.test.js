"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_backdrop_1 = require("./dictation-pill-backdrop");
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const workArea = { x: 0, y: 0, width: 1920, height: 1032 };
function overlaps(a, b) {
    return (a.x < b.x + b.width &&
        b.x < a.x + a.width &&
        a.y < b.y + b.height &&
        b.y < a.y + a.height);
}
(0, node_test_1.test)("the read sits just inward of the visible pill, never on it", () => {
    for (const side of ["bottom", "top", "left", "right"]) {
        const host = (0, dictation_pill_layout_1.getDictationPillBounds)(side, workArea, 4);
        const pill = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(host, side, "win32");
        const region = (0, dictation_pill_backdrop_1.dictationPillBackdropRegion)(host, side, "win32");
        strict_1.default.ok(region.width > 0 && region.height > 0, `${side} has area`);
        strict_1.default.ok(!overlaps(region, pill), `${side} does not read the pill`);
        // Nor the launcher or meter, which reach further in from the same edge:
        // an open pill covering the strip would read as its own dark shell.
        const launcher = (0, dictation_pill_layout_1.getDictationLauncherBounds)(side, "win32");
        const openShell = {
            ...launcher,
            x: host.x + launcher.x,
            y: host.y + launcher.y,
        };
        strict_1.default.ok(!overlaps(region, openShell), `${side} clears the open pill`);
        // Inward: toward the middle of the screen from the docked edge.
        const centre = { x: workArea.width / 2, y: workArea.height / 2 };
        const closer = side === "bottom" || side === "top"
            ? Math.abs(region.y - centre.y) < Math.abs(pill.y - centre.y)
            : Math.abs(region.x - centre.x) < Math.abs(pill.x - centre.x);
        strict_1.default.ok(closer, `${side} reads inward of the pill`);
        // Much smaller than the host window it replaces as the read.
        strict_1.default.ok(region.width * region.height < (host.width * host.height) / 4);
    }
});
(0, node_test_1.test)("a bright backdrop reads light, a dim one dark", () => {
    strict_1.default.equal((0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)(null, 0.9), "light");
    strict_1.default.equal((0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)(null, 0.1), "dark");
    strict_1.default.equal((0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)("light", 0.1), "dark");
    strict_1.default.equal((0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)("dark", 0.9), "light");
});
(0, node_test_1.test)("a mid-grey keeps the previous call rather than flickering", () => {
    const mid = (dictation_pill_backdrop_1.BACKDROP_LIGHT_ABOVE + dictation_pill_backdrop_1.BACKDROP_DARK_BELOW) / 2;
    strict_1.default.equal((0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)("light", mid), "light");
    strict_1.default.equal((0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)("dark", mid), "dark");
    // With no history, an ambiguous reading falls to the pill's own default.
    strict_1.default.equal((0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)(null, mid), "dark");
});
(0, node_test_1.test)("the read is only as wide as the nub, not the whole rail", () => {
    const host = (0, dictation_pill_layout_1.getDictationPillBounds)("bottom", workArea, 4);
    const region = (0, dictation_pill_backdrop_1.dictationPillBackdropRegion)(host, "bottom", "win32");
    strict_1.default.ok(region.width < 100, `${region.width}px is beside the nub, not the 360px rail`);
    strict_1.default.equal(region.x + region.width / 2, host.x + host.width / 2, "centred on the nub");
});
(0, node_test_1.test)("a strip hanging off the display is clipped to it, or dropped", () => {
    const display = { x: 0, y: 0, width: 1920, height: 1080 };
    strict_1.default.deepEqual((0, dictation_pill_backdrop_1.clipRect)({ x: -10, y: 100, width: 50, height: 12 }, display), { x: 0, y: 100, width: 40, height: 12 });
    strict_1.default.deepEqual((0, dictation_pill_backdrop_1.clipRect)({ x: 100, y: 100, width: 50, height: 12 }, display), { x: 100, y: 100, width: 50, height: 12 });
    strict_1.default.equal((0, dictation_pill_backdrop_1.clipRect)({ x: 2000, y: 100, width: 50, height: 12 }, display), null);
});
//# sourceMappingURL=dictation-pill-backdrop.test.js.map
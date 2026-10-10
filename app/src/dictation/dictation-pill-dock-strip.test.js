"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_pill_dock_strip_1 = require("./dictation-pill-dock-strip");
const dictation_pill_dock_watcher_1 = require("./dictation-pill-dock-watcher");
// A 1600x1200 display with a 30px menu bar and an 80px Dock reservation, the
// geometry measured on the verification Mac. The Dock strip macOS reports sits
// 4px inside the reserved band when the Dock is permanently visible.
const bounds = { x: 0, y: 0, width: 1600, height: 1200 };
const bottomDockWorkArea = { x: 0, y: 30, width: 1600, height: 1090 };
const noDockWorkArea = { x: 0, y: 30, width: 1600, height: 1170 };
const stripShown = { x: 44, y: 1116, width: 1512, height: 74 };
const stripHidden = { x: 44, y: 1200, width: 1512, height: 74 };
(0, node_test_1.describe)("dockStripSide", () => {
    (0, node_test_1.it)("recognises a bottom Dock whether shown or slid off screen", () => {
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)(stripShown, bounds), "bottom");
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)(stripHidden, bounds), "bottom");
    });
    (0, node_test_1.it)("recognises left and right Docks", () => {
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)({ x: 4, y: 300, width: 74, height: 600 }, bounds), "left");
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)({ x: 1522, y: 300, width: 74, height: 600 }, bounds), "right");
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)({ x: -74, y: 300, width: 74, height: 600 }, bounds), "left");
    });
    (0, node_test_1.it)("ignores a Dock that belongs to another display", () => {
        const secondary = { x: 1600, y: 0, width: 1920, height: 1080 };
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)(stripShown, secondary), null);
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)({ x: 4, y: 300, width: 74, height: 600 }, secondary), null);
    });
    (0, node_test_1.it)("never treats the main display's hidden left Dock as a left-side monitor's right Dock", () => {
        const leftMonitor = { x: -1920, y: -200, width: 1920, height: 1080 };
        const hiddenLeft = { x: -74, y: 300, width: 74, height: 600 };
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)(hiddenLeft, leftMonitor), null);
        strict_1.default.equal((0, dictation_pill_dock_strip_1.dockStripSide)(hiddenLeft, bounds), "left");
    });
});
(0, node_test_1.describe)("workAreaClearOfDock", () => {
    (0, node_test_1.it)("keeps the OS work area when the strip is unknown", () => {
        const display = { bounds, workArea: bottomDockWorkArea };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, null), bottomDockWorkArea);
    });
    (0, node_test_1.it)("matches the OS work area for a permanently visible Dock", () => {
        const display = { bounds, workArea: bottomDockWorkArea };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, stripShown), bottomDockWorkArea);
    });
    (0, node_test_1.it)("reserves room when an auto-hidden Dock slides in", () => {
        // Auto-hide: the OS reserves nothing, but the strip is on screen.
        const display = { bounds, workArea: noDockWorkArea };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, stripShown), bottomDockWorkArea);
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, stripHidden), noDockWorkArea);
    });
    (0, node_test_1.it)("follows the strip while it is sliding", () => {
        const display = { bounds, workArea: noDockWorkArea };
        const midway = { ...stripShown, y: 1160 };
        strict_1.default.equal((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, midway).height + noDockWorkArea.y, 1164);
    });
    (0, node_test_1.it)("releases the reservation in a fullscreen space with the Dock gone", () => {
        // Fullscreen: the OS still reserves the Dock band but the strip is off
        // screen, which is what left the pill floating over a page's composer.
        const display = { bounds, workArea: bottomDockWorkArea };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, stripHidden), noDockWorkArea);
    });
    (0, node_test_1.it)("handles a left Dock shown, hidden, and beside a left-side monitor", () => {
        const display = { bounds, workArea: noDockWorkArea };
        const shown = { x: 4, y: 300, width: 74, height: 600 };
        const hidden = { x: -74, y: 300, width: 74, height: 600 };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, shown), {
            ...noDockWorkArea,
            x: 74,
            width: 1526,
        });
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, hidden), noDockWorkArea);
        const leftBounds = { x: -1920, y: -200, width: 1920, height: 1080 };
        const leftWorkArea = { x: -1920, y: -170, width: 1920, height: 1050 };
        const leftMonitor = { bounds: leftBounds, workArea: leftWorkArea };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(leftMonitor, shown), leftWorkArea);
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(leftMonitor, hidden), leftWorkArea);
    });
    (0, node_test_1.it)("keeps a bottom Dock on a display with a negative origin", () => {
        const leftBounds = { x: -1920, y: -200, width: 1920, height: 1080 };
        const leftWorkArea = { x: -1920, y: -170, width: 1920, height: 1050 };
        const display = { bounds: leftBounds, workArea: leftWorkArea };
        const shown = { x: -1700, y: 796, width: 1480, height: 74 };
        const hidden = { ...shown, y: 880 };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, shown), {
            ...leftWorkArea,
            height: 970,
        });
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, hidden), leftWorkArea);
    });
    (0, node_test_1.it)("handles a right Dock", () => {
        const display = { bounds, workArea: noDockWorkArea };
        const shown = { x: 1522, y: 300, width: 74, height: 600 };
        strict_1.default.deepEqual((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, shown), {
            ...noDockWorkArea,
            width: 1526,
        });
    });
    (0, node_test_1.it)("never trusts the strip past what the OS already reserves", () => {
        const display = { bounds, workArea: bottomDockWorkArea };
        const tall = { ...stripShown, y: 1100, height: 90 };
        strict_1.default.equal((0, dictation_pill_dock_strip_1.workAreaClearOfDock)(display, tall).height + bottomDockWorkArea.y, 1104);
    });
});
(0, node_test_1.describe)("parseDockStripLine", () => {
    (0, node_test_1.it)("parses the helper's JSON lines and rejects anything else", () => {
        strict_1.default.deepEqual((0, dictation_pill_dock_watcher_1.parseDockStripLine)('{"x":44,"y":1116,"width":1512,"height":74}'), stripShown);
        strict_1.default.equal((0, dictation_pill_dock_watcher_1.parseDockStripLine)("null"), null);
        strict_1.default.equal((0, dictation_pill_dock_watcher_1.parseDockStripLine)(""), null);
        strict_1.default.equal((0, dictation_pill_dock_watcher_1.parseDockStripLine)("{garbage"), null);
        strict_1.default.equal((0, dictation_pill_dock_watcher_1.parseDockStripLine)('{"x":1}'), null);
    });
});
//# sourceMappingURL=dictation-pill-dock-strip.test.js.map
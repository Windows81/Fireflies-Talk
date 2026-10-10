"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_binding_1 = require("./dictation-binding");
const shortcut_capture_peak_1 = require("./shortcut-capture-peak");
const NO_MODIFIERS = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
};
(0, node_test_1.test)("a released key does not combine with a later Fn tap", () => {
    let state = (0, shortcut_capture_peak_1.initialCapturePeakState)("darwin");
    state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)(state, NO_MODIFIERS, "Z");
    strict_1.default.equal(state.peak, null);
    state = (0, shortcut_capture_peak_1.applyCaptureKeyUp)(state, NO_MODIFIERS, "Z");
    strict_1.default.equal(state.lastKey, undefined);
    state = (0, shortcut_capture_peak_1.applyCaptureFn)(state, true);
    strict_1.default.deepEqual(state.peak, { type: "darwin-fn" });
});
(0, node_test_1.test)("a standalone modifier becomes the capture peak", () => {
    const state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)((0, shortcut_capture_peak_1.initialCapturePeakState)("darwin"), { ...NO_MODIFIERS, shiftKey: true }, null, "shift-left");
    strict_1.default.deepEqual(state.peak, {
        modifierKey: "shift-left",
        modifiers: ["shift"],
        type: "chord",
    });
});
(0, node_test_1.test)("Windows accepts a standalone Shift", () => {
    const state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)((0, shortcut_capture_peak_1.initialCapturePeakState)("win32"), { ...NO_MODIFIERS, shiftKey: true }, null);
    strict_1.default.deepEqual(state.peak, {
        modifiers: ["shift"],
        type: "chord",
    });
    strict_1.default.equal(state.rejection, null);
});
(0, node_test_1.test)("Windows accepts a standalone Alt", () => {
    const state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)((0, shortcut_capture_peak_1.initialCapturePeakState)("win32"), { ...NO_MODIFIERS, altKey: true }, null);
    strict_1.default.deepEqual(state.peak, {
        modifiers: ["alt"],
        type: "chord",
    });
    strict_1.default.equal(state.rejection, null);
});
(0, node_test_1.test)("Windows rejects a standalone Ctrl with a visible error", () => {
    const state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)((0, shortcut_capture_peak_1.initialCapturePeakState)("win32"), { ...NO_MODIFIERS, ctrlKey: true }, null);
    strict_1.default.equal(state.peak, null);
    strict_1.default.match(state.rejection ?? "", /Ctrl on its own/);
});
(0, node_test_1.test)("Windows Ctrl plus Win becomes a valid peak", () => {
    let state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)((0, shortcut_capture_peak_1.initialCapturePeakState)("win32"), { ...NO_MODIFIERS, ctrlKey: true }, null);
    state = (0, shortcut_capture_peak_1.applyCaptureWin)(state, true);
    strict_1.default.deepEqual(state.peak, {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    });
    strict_1.default.equal(state.rejection, null);
});
(0, node_test_1.test)("Fn combines with a key that is still held", () => {
    let state = (0, shortcut_capture_peak_1.initialCapturePeakState)("darwin");
    state = (0, shortcut_capture_peak_1.applyCaptureFn)(state, true);
    state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)(state, NO_MODIFIERS, "Z");
    strict_1.default.deepEqual(state.peak, {
        fn: true,
        key: "Z",
        modifiers: [],
        type: "chord",
    });
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)(state.peak, "darwin"), null);
});
(0, node_test_1.test)("releasing a different key leaves the held one alone", () => {
    let state = (0, shortcut_capture_peak_1.initialCapturePeakState)("darwin");
    state = (0, shortcut_capture_peak_1.applyCaptureFn)(state, true);
    state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)(state, NO_MODIFIERS, "Z");
    // A stray keyup for another key must not clear Z.
    state = (0, shortcut_capture_peak_1.applyCaptureKeyUp)(state, NO_MODIFIERS, "Q");
    strict_1.default.equal(state.lastKey, "Z");
});
(0, node_test_1.test)("a side mouse button becomes the peak without a keyboard key", () => {
    const state = (0, shortcut_capture_peak_1.applyCaptureMouse)((0, shortcut_capture_peak_1.initialCapturePeakState)("darwin"), NO_MODIFIERS, 4, true);
    strict_1.default.deepEqual(state.peak, {
        modifiers: [],
        mouseButton: 4,
        type: "chord",
    });
    strict_1.default.equal((0, dictation_binding_1.validateCapturedBinding)(state.peak, "darwin"), null);
});
(0, node_test_1.test)("Ctrl plus Mouse 5 outranks a previously held letter", () => {
    const held = { ...NO_MODIFIERS, ctrlKey: true };
    const withKey = (0, shortcut_capture_peak_1.applyCaptureKeyDown)((0, shortcut_capture_peak_1.initialCapturePeakState)("darwin"), held, "Z");
    const state = (0, shortcut_capture_peak_1.applyCaptureMouse)(withKey, held, 5, true);
    strict_1.default.deepEqual(state.peak, {
        modifiers: ["ctrl"],
        mouseButton: 5,
        type: "chord",
    });
});
(0, node_test_1.test)("releasing modifiers after a mouse down keeps the richer peak", () => {
    const held = { ...NO_MODIFIERS, ctrlKey: true };
    const down = (0, shortcut_capture_peak_1.applyCaptureMouse)((0, shortcut_capture_peak_1.initialCapturePeakState)("darwin"), held, 4, true);
    const released = (0, shortcut_capture_peak_1.applyCaptureKeyUp)(down, NO_MODIFIERS, null);
    strict_1.default.deepEqual(released.peak, {
        modifiers: ["ctrl"],
        mouseButton: 4,
        type: "chord",
    });
    strict_1.default.deepEqual((0, shortcut_capture_peak_1.commitHeldMouseBinding)(down.peak, released.peak, 4, "darwin"), released.peak);
});
(0, node_test_1.test)("a mouse-up without a matching down does not commit a shortcut", () => {
    const mouse5 = {
        modifiers: [],
        mouseButton: 5,
        type: "chord",
    };
    strict_1.default.equal((0, shortcut_capture_peak_1.commitHeldMouseBinding)(null, null, 4, "darwin"), null);
    strict_1.default.equal((0, shortcut_capture_peak_1.commitHeldMouseBinding)(mouse5, mouse5, 4, "darwin"), null);
});
(0, node_test_1.test)("Win pressed after a mouse down outranks the bare mouse binding", () => {
    const bare = {
        modifiers: [],
        mouseButton: 4,
        type: "chord",
    };
    const withWin = {
        modifiers: ["meta"],
        mouseButton: 4,
        type: "chord",
    };
    strict_1.default.deepEqual((0, shortcut_capture_peak_1.strongerCaptureBinding)(bare, withWin, "win32"), withWin);
});
(0, node_test_1.test)("releasing Win drops it from the live flags while a mouse button stays held", () => {
    const withWin = (0, shortcut_capture_peak_1.applyCaptureWin)((0, shortcut_capture_peak_1.initialCapturePeakState)("win32"), true);
    const withMouse = (0, shortcut_capture_peak_1.applyCaptureMouse)(withWin, { ...NO_MODIFIERS, metaKey: true }, 4, true);
    strict_1.default.equal(withMouse.captureWinHeld, true);
    const released = (0, shortcut_capture_peak_1.applyCaptureWin)(withMouse, false);
    strict_1.default.equal(released.captureWinHeld, false);
    strict_1.default.equal(released.lastFlags.metaKey, false);
    strict_1.default.equal(released.lastMouse, 4);
});
(0, node_test_1.test)("modifier release keeps the peak so the chord can still finish", () => {
    const held = { ...NO_MODIFIERS, metaKey: true, shiftKey: true };
    let state = (0, shortcut_capture_peak_1.initialCapturePeakState)("darwin");
    state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)(state, held, null);
    state = (0, shortcut_capture_peak_1.applyCaptureKeyDown)(state, held, "K");
    const peak = state.peak;
    // Modifier keyups carry no key token, so the captured chord survives.
    state = (0, shortcut_capture_peak_1.applyCaptureKeyUp)(state, NO_MODIFIERS, null);
    strict_1.default.deepEqual(state.peak, peak);
});
//# sourceMappingURL=shortcut-capture-peak.test.js.map
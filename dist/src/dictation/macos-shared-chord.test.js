"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const macos_shared_chord_1 = require("./macos-shared-chord");
const ctrlAltD = {
    key: "D",
    modifiers: ["ctrl", "alt"],
    type: "chord",
};
const ctrlAltShiftD = {
    key: "D",
    modifiers: ["ctrl", "alt", "shift"],
    type: "chord",
};
(0, node_test_1.test)("action chord on the same letter shares the dictation helper", () => {
    strict_1.default.equal((0, macos_shared_chord_1.sharesChordTarget)(ctrlAltD, ctrlAltShiftD), true);
    strict_1.default.equal((0, macos_shared_chord_1.sharesChordTarget)({ modifiers: ["ctrl"], mouseButton: 4, type: "chord" }, { modifiers: ["meta"], mouseButton: 4, type: "chord" }), true);
});
(0, node_test_1.test)("different keys, modifier-only chords and Fn keep separate helpers", () => {
    strict_1.default.equal((0, macos_shared_chord_1.sharesChordTarget)(ctrlAltD, {
        key: "K",
        modifiers: ["ctrl"],
        type: "chord",
    }), false);
    strict_1.default.equal((0, macos_shared_chord_1.sharesChordTarget)({ modifiers: ["ctrl", "meta"], type: "chord" }, { modifiers: ["ctrl", "shift", "meta"], type: "chord" }), false);
    strict_1.default.equal((0, macos_shared_chord_1.sharesChordTarget)(ctrlAltD, {
        modifiers: ["ctrl"],
        mouseButton: 5,
        type: "chord",
    }), false);
    strict_1.default.equal((0, macos_shared_chord_1.sharesChordTarget)({ type: "darwin-fn" }, ctrlAltShiftD), false);
    strict_1.default.equal((0, macos_shared_chord_1.sharesChordTarget)(ctrlAltD, null), false);
});
(0, node_test_1.test)("shared action modifiers are passed as one helper argument", () => {
    strict_1.default.equal((0, macos_shared_chord_1.macSharedActionArg)({
        key: "D",
        modifiers: ["ctrl", "alt", "shift"],
        type: "chord",
    }), "--action-mods=ctrl,alt,shift");
    strict_1.default.equal((0, macos_shared_chord_1.macSharedActionArg)({
        fn: true,
        key: "Z",
        modifiers: ["shift"],
        type: "chord",
    }), "--action-mods=shift,fn");
});
//# sourceMappingURL=macos-shared-chord.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const shortcut_conflict_1 = require("./shortcut-conflict");
const mouse5 = {
    modifiers: [],
    mouseButton: 5,
    type: "chord",
};
const winAlt = {
    modifiers: ["alt", "meta"],
    type: "chord",
};
(0, node_test_1.test)("same shortcut cannot be used for dictation and commands", () => {
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(mouse5, mouse5), true);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(mouse5, winAlt), false);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(mouse5, null), false);
});
(0, node_test_1.test)("conflict errors name the other shortcut in user language", () => {
    strict_1.default.equal((0, shortcut_conflict_1.shortcutTakenError)("action"), "That shortcut is already used for commands.");
    strict_1.default.equal((0, shortcut_conflict_1.shortcutTakenError)("dictation"), "That shortcut is already used to dictate.");
    strict_1.default.equal((0, shortcut_conflict_1.formatTakenPresetLabel)("Mouse 5 - Forward", "action"), "Mouse 5 - Forward · in use for commands");
});
const defaultPolish = {
    functionRowAlias: true,
    key: "1",
    type: "darwin-fn",
};
const recordedFn1 = { key: "1", type: "darwin-fn" };
const recordedFnF1 = { key: "F1", type: "darwin-fn" };
(0, node_test_1.test)("default polish occupies both Fn + 1 and Fn + F1", () => {
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(recordedFn1, defaultPolish), true);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(recordedFnF1, defaultPolish), true);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(recordedFn1, recordedFnF1), false);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(recordedFn1, recordedFn1), true);
});
(0, node_test_1.test)("an Fn + key chord is the same shortcut as that Fn binding", () => {
    const fnSpaceChord = {
        fn: true,
        key: "Space",
        modifiers: [],
        type: "chord",
    };
    const fnSpace = { key: "Space", type: "darwin-fn" };
    const fn1Chord = { ...fnSpaceChord, key: "1" };
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(fnSpaceChord, fnSpace), true);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(fnSpace, fnSpaceChord), true);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(fn1Chord, defaultPolish), true);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)(fnSpaceChord, recordedFn1), false);
    strict_1.default.equal((0, shortcut_conflict_1.shortcutAlreadyInUse)({ ...fnSpaceChord, modifiers: ["ctrl"] }, fnSpace), false);
});
//# sourceMappingURL=shortcut-conflict.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_binding_1 = require("./dictation-binding");
const dictation_shortcut_persist_1 = require("./dictation-shortcut-persist");
const customWin = {
    key: "D",
    modifiers: ["ctrl", "alt"],
    type: "chord",
};
(0, node_test_1.test)("accepts a custom Windows dictation shortcut", () => {
    const saved = (0, dictation_shortcut_persist_1.parseSavedDictationShortcuts)({
        action: { modifiers: ["alt", "meta"], type: "chord" },
        dictation: customWin,
        handsFree: null,
        polish: null,
    }, "win32");
    strict_1.default.equal(saved.handsFree, null);
    strict_1.default.deepEqual(saved.dictation, {
        key: "D",
        modifiers: ["ctrl", "alt"],
        type: "chord",
    });
    strict_1.default.equal((0, dictation_binding_1.getDictationShortcutHint)(saved.dictation, "win32"), "Hold Ctrl+Alt+D");
});
(0, node_test_1.test)("keeps an unassigned action shortcut as null", () => {
    const saved = (0, dictation_shortcut_persist_1.parseSavedDictationShortcuts)({ action: null, dictation: customWin, handsFree: null, polish: null }, "win32");
    strict_1.default.equal(saved.action, null);
});
(0, node_test_1.test)("drops an action shortcut that collides with dictation", () => {
    const saved = (0, dictation_shortcut_persist_1.parseSavedDictationShortcuts)({ action: customWin, dictation: customWin, handsFree: null, polish: null }, "win32");
    strict_1.default.equal(saved.action, null);
});
(0, node_test_1.test)("keeps an unassigned hands-free shortcut as null", () => {
    const saved = (0, dictation_shortcut_persist_1.parseSavedDictationShortcuts)({ action: null, dictation: customWin, polish: null }, "win32");
    strict_1.default.equal(saved.handsFree, null);
});
(0, node_test_1.test)("keeps a valid hands-free shortcut", () => {
    const handsFree = {
        key: "H",
        modifiers: ["ctrl", "alt"],
        type: "chord",
    };
    const saved = (0, dictation_shortcut_persist_1.parseSavedDictationShortcuts)({ action: null, dictation: customWin, handsFree, polish: null }, "win32");
    strict_1.default.deepEqual(saved.handsFree, handsFree);
});
//# sourceMappingURL=dictation-shortcut-persist.test.js.map
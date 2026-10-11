"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const hands_free_binding_1 = require("./hands-free-binding");
const ctrlAltD = {
    key: "D",
    modifiers: ["ctrl", "alt"],
    type: "chord",
};
const loneAlt = {
    modifiers: ["alt"],
    type: "chord",
};
const altD = {
    key: "D",
    modifiers: ["alt"],
    type: "chord",
};
const loneShiftLeft = {
    modifierKey: "shift-left",
    modifiers: ["shift"],
    type: "chord",
};
const shiftCmdD = {
    key: "D",
    modifiers: ["shift", "meta"],
    type: "chord",
};
const ctrlD = {
    key: "D",
    modifiers: ["ctrl"],
    type: "chord",
};
const loneAltRight = {
    modifierKey: "alt-right",
    modifiers: ["alt"],
    type: "chord",
};
const loneAltLeft = {
    modifierKey: "alt-left",
    modifiers: ["alt"],
    type: "chord",
};
const rightCmd = {
    modifierKey: "meta-right",
    modifiers: ["meta"],
    type: "chord",
};
(0, node_test_1.test)("hands-free defaults to unassigned", () => {
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)(undefined, "darwin"), null);
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)(null, "win32"), null);
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)({ type: "unassigned" }, "win32"), null);
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)({ type: "unexpected" }, "darwin"), null);
});
(0, node_test_1.test)("hands-free rejects Fn and disallowed standalone modifiers", () => {
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)({ key: "2", type: "darwin-fn" }, "darwin"), null);
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)({ modifiers: ["ctrl"], type: "chord" }, "win32"), null);
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)({ modifierKey: "ctrl-left", modifiers: ["ctrl"], type: "chord" }, "win32"), null);
    strict_1.default.equal((0, hands_free_binding_1.validateHandsFreeCapture)({ modifiers: ["shift"], type: "darwin-fn" }, "darwin", rightCmd), "Hold Fn and press a letter, number, or Space, such as Fn + Space.");
});
(0, node_test_1.test)("hands-free can be Fn on its own while push to talk does not use Fn", () => {
    const fn = { type: "darwin-fn" };
    strict_1.default.deepEqual((0, hands_free_binding_1.normalizeHandsFreeBinding)(fn, "darwin"), fn);
    strict_1.default.equal((0, hands_free_binding_1.normalizeHandsFreeBinding)(fn, "win32"), null);
    strict_1.default.equal((0, hands_free_binding_1.validateHandsFreeCapture)(fn, "darwin", rightCmd), null);
    strict_1.default.deepEqual((0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(fn, rightCmd, { modifiers: ["shift"], type: "darwin-fn" }, { functionRowAlias: true, key: "1", type: "darwin-fn" }, "darwin"), fn);
});
(0, node_test_1.test)("hands-free cannot be Fn on its own while push to talk uses Fn", () => {
    const fn = { type: "darwin-fn" };
    const fnZ = { key: "Z", type: "darwin-fn" };
    strict_1.default.equal((0, hands_free_binding_1.validateHandsFreeCapture)(fn, "darwin", fn), hands_free_binding_1.HANDS_FREE_FN_TAKEN_ERROR);
    strict_1.default.equal((0, hands_free_binding_1.validateHandsFreeCapture)(fn, "darwin", fnZ), hands_free_binding_1.HANDS_FREE_FN_TAKEN_ERROR);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeFnTaken)(fn, fnZ), true);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeFnTaken)(fn, rightCmd), false);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeFnTaken)(null, fnZ), false);
    strict_1.default.equal((0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(fn, fnZ, null, null, "darwin"), null);
});
(0, node_test_1.test)("hands-free keeps a recorded Fn + key as an Fn chord", () => {
    const fnSpace = (0, hands_free_binding_1.handsFreeBindingFromCapture)({
        key: "Space",
        type: "darwin-fn",
    });
    strict_1.default.deepEqual(fnSpace, {
        fn: true,
        key: "Space",
        modifiers: [],
        type: "chord",
    });
    strict_1.default.equal((0, hands_free_binding_1.validateHandsFreeCapture)(fnSpace, "darwin", rightCmd), null);
    strict_1.default.deepEqual((0, hands_free_binding_1.normalizeHandsFreeBinding)(fnSpace, "darwin"), fnSpace);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeFnKeyCode)(fnSpace), 0x31);
    strict_1.default.deepEqual((0, hands_free_binding_1.handsFreeBindingFromCapture)({ modifiers: ["shift"], type: "darwin-fn" }), { modifiers: ["shift"], type: "darwin-fn" });
    strict_1.default.equal((0, hands_free_binding_1.handsFreeFnKeyCode)(ctrlAltD), null);
});
(0, node_test_1.test)("hands-free rejects Fn with a key that would also fire on its own", () => {
    const fnF5 = (0, hands_free_binding_1.handsFreeBindingFromCapture)({ key: "F5", type: "darwin-fn" });
    strict_1.default.match((0, hands_free_binding_1.validateHandsFreeCapture)(fnF5, "darwin", rightCmd) ?? "", /function key/);
});
(0, node_test_1.test)("hands-free Fn + key collides with the same Fn shortcut elsewhere", () => {
    const fnSpace = (0, hands_free_binding_1.handsFreeBindingFromCapture)({
        key: "Space",
        type: "darwin-fn",
    });
    strict_1.default.equal((0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(fnSpace, { key: "Space", type: "darwin-fn" }, null, null, "darwin"), null);
    strict_1.default.equal((0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(fnSpace, { type: "darwin-fn" }, { modifiers: ["shift"], type: "darwin-fn" }, { key: "Space", type: "darwin-fn" }, "darwin"), null);
    strict_1.default.deepEqual((0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(fnSpace, { type: "darwin-fn" }, { modifiers: ["shift"], type: "darwin-fn" }, { functionRowAlias: true, key: "1", type: "darwin-fn" }, "darwin"), fnSpace);
});
(0, node_test_1.test)("hands-free keeps macOS physical modifiers and regular chords", () => {
    strict_1.default.deepEqual((0, hands_free_binding_1.normalizeHandsFreeBinding)({ modifierKey: "meta-right", modifiers: ["meta"], type: "chord" }, "darwin"), { modifierKey: "meta-right", modifiers: ["meta"], type: "chord" });
    strict_1.default.deepEqual((0, hands_free_binding_1.normalizeHandsFreeBinding)({ key: "D", modifiers: ["ctrl", "alt"], type: "chord" }, "win32"), ctrlAltD);
});
(0, node_test_1.test)("hands-free detects shared keys and persisted conflicts", () => {
    const action = {
        key: "S",
        modifiers: ["shift"],
        type: "chord",
    };
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(ctrlAltD, ctrlAltD, null), true);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(ctrlAltD, { type: "darwin-fn" }, action), false);
    strict_1.default.equal((0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(ctrlAltD, ctrlAltD, null, null, "win32"), null);
    strict_1.default.equal((0, hands_free_binding_1.resolvePersistedHandsFreeBinding)({ key: "S", modifiers: ["ctrl"], type: "chord" }, { type: "darwin-fn" }, action, null, "win32"), null);
    strict_1.default.equal(hands_free_binding_1.HANDS_FREE_SHARED_KEY_ERROR, "Use keys that aren't part of your dictation and action shortcuts.");
    strict_1.default.equal((0, hands_free_binding_1.formatHandsFreeBindingLabel)(null, { isMac: true }), "Unassigned");
});
(0, node_test_1.test)("hands-free rejects standalone modifiers contained in another shortcut", () => {
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(loneAlt, altD, null), true);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(altD, loneAlt, null), true);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(loneShiftLeft, shiftCmdD, null), true);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(loneAlt, ctrlD, null), false);
});
(0, node_test_1.test)("hands-free distinguishes opposite physical standalone modifiers", () => {
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(loneAltRight, loneAltLeft, null), false);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(loneAltRight, loneAltRight, null), true);
    strict_1.default.equal((0, hands_free_binding_1.handsFreeSharesKey)(loneAltRight, altD, null), true);
});
//# sourceMappingURL=hands-free-binding.test.js.map
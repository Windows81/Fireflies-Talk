"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const fn_listener_callbacks_1 = require("./fn-listener-callbacks");
const setup = () => {
    const calls = [];
    const callbacks = (0, fn_listener_callbacks_1.fnHandsFreeCallbacks)({
        onDown: () => calls.push("down"),
        onHandsFreeDown: () => calls.push("handsFree"),
        onInterrupted: () => calls.push("interrupted"),
        onPolish: () => calls.push("polish"),
        onShiftChange: () => calls.push("shift"),
        onUp: () => calls.push("up"),
    });
    return { callbacks, calls };
};
(0, node_test_1.test)("a clean Fn tap toggles hands-free on release", () => {
    const { callbacks, calls } = setup();
    callbacks.onDown();
    strict_1.default.deepEqual(calls, []);
    callbacks.onUp();
    strict_1.default.deepEqual(calls, ["handsFree"]);
});
(0, node_test_1.test)("Fn used with another key never toggles hands-free", () => {
    const { callbacks, calls } = setup();
    callbacks.onDown();
    callbacks.onModifierUsed?.();
    callbacks.onUp();
    callbacks.onDown();
    callbacks.onInterrupted();
    callbacks.onUp();
    strict_1.default.deepEqual(calls, []);
});
(0, node_test_1.test)("Fn + Shift never toggles hands-free", () => {
    const { callbacks, calls } = setup();
    callbacks.onDown();
    callbacks.onShiftChange(true);
    callbacks.onUp();
    strict_1.default.deepEqual(calls, []);
});
(0, node_test_1.test)("Shift held before Fn never toggles hands-free", () => {
    const { callbacks, calls } = setup();
    callbacks.onShiftChange(true);
    callbacks.onDown();
    callbacks.onUp();
    strict_1.default.deepEqual(calls, []);
});
(0, node_test_1.test)("a clean Fn tap after Shift is released toggles hands-free", () => {
    const { callbacks, calls } = setup();
    callbacks.onShiftChange(true);
    callbacks.onShiftChange(false);
    callbacks.onDown();
    callbacks.onUp();
    strict_1.default.deepEqual(calls, ["handsFree"]);
});
(0, node_test_1.test)("Fn + 1 still polishes without toggling hands-free", () => {
    const { callbacks, calls } = setup();
    callbacks.onDown();
    callbacks.onPolish?.();
    callbacks.onUp();
    strict_1.default.deepEqual(calls, ["polish"]);
});
(0, node_test_1.test)("a release without a press does nothing", () => {
    const { callbacks, calls } = setup();
    callbacks.onUp();
    strict_1.default.deepEqual(calls, []);
});
(0, node_test_1.test)("the polish-only Fn listener reports polish and nothing else", () => {
    const calls = [];
    const callbacks = (0, fn_listener_callbacks_1.fnPolishOnlyCallbacks)({
        onDown: () => calls.push("down"),
        onHandsFreeDown: () => calls.push("handsFree"),
        onInterrupted: () => calls.push("interrupted"),
        onPolish: () => calls.push("polish"),
        onShiftChange: () => calls.push("shift"),
        onUp: () => calls.push("up"),
    });
    callbacks.onDown();
    callbacks.onShiftChange(true);
    callbacks.onInterrupted();
    callbacks.onUp();
    callbacks.onPolish?.();
    strict_1.default.deepEqual(calls, ["polish"]);
});
//# sourceMappingURL=fn-listener-callbacks.test.js.map
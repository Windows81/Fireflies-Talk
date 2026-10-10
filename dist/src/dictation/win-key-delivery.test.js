"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const win_key_delivery_1 = require("./win-key-delivery");
const apply = (state, vk, isKeyDown, otherNonWinRequiredHeld) => (0, win_key_delivery_1.shouldSwallowWin)(state, vk, isKeyDown, !isKeyDown, otherNonWinRequiredHeld);
(0, node_test_1.test)("Ctrl then Win swallows both Win-down and Win-up", () => {
    let state = (0, win_key_delivery_1.initialWinDeliveryState)();
    const down = apply(state, win_key_delivery_1.VK_LWIN, true, true);
    strict_1.default.equal(down.swallow, true);
    strict_1.default.equal(down.state.left, "swallowed");
    state = down.state;
    const up = apply(state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(up.swallow, true);
    strict_1.default.equal(up.state.left, "idle");
});
(0, node_test_1.test)("Win then Ctrl passes Win-down and the matching Win-up", () => {
    let state = (0, win_key_delivery_1.initialWinDeliveryState)();
    const down = apply(state, win_key_delivery_1.VK_LWIN, true, false);
    strict_1.default.equal(down.swallow, false);
    strict_1.default.equal(down.state.left, "passed");
    state = down.state;
    const up = apply(state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(up.swallow, false);
    strict_1.default.equal(up.state.left, "idle");
});
(0, node_test_1.test)("Win-first auto-repeat stays passed so the up is not swallowed", () => {
    let state = (0, win_key_delivery_1.initialWinDeliveryState)();
    state = apply(state, win_key_delivery_1.VK_LWIN, true, false).state;
    const repeat = apply(state, win_key_delivery_1.VK_LWIN, true, true);
    strict_1.default.equal(repeat.swallow, false);
    strict_1.default.equal(repeat.state.left, "passed");
    state = repeat.state;
    const up = apply(state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(up.swallow, false);
});
(0, node_test_1.test)("Ctrl-first keeps swallowing Win after Ctrl is released", () => {
    let state = (0, win_key_delivery_1.initialWinDeliveryState)();
    state = apply(state, win_key_delivery_1.VK_LWIN, true, true).state;
    const repeat = apply(state, win_key_delivery_1.VK_LWIN, true, false);
    strict_1.default.equal(repeat.swallow, true);
    strict_1.default.equal(repeat.state.left, "swallowed");
    state = repeat.state;
    const up = apply(state, win_key_delivery_1.VK_LWIN, false, false);
    strict_1.default.equal(up.swallow, true);
    strict_1.default.equal(up.state.left, "idle");
});
(0, node_test_1.test)("shortcut capture swallows Win-down and the matching Win-up", () => {
    const state = (0, win_key_delivery_1.initialWinDeliveryState)();
    const down = apply(state, win_key_delivery_1.VK_LWIN, true, true);
    strict_1.default.equal(down.swallow, true);
    strict_1.default.equal(down.state.left, "swallowed");
    const up = apply(down.state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(up.swallow, true);
    strict_1.default.equal(up.state.left, "idle");
});
(0, node_test_1.test)("capture ending while Win is held still swallows the matching up", () => {
    const down = apply((0, win_key_delivery_1.initialWinDeliveryState)(), win_key_delivery_1.VK_LWIN, true, true);
    const up = apply(down.state, win_key_delivery_1.VK_LWIN, false, false);
    strict_1.default.equal(up.swallow, true);
    strict_1.default.equal(up.state.left, "idle");
});
(0, node_test_1.test)("lone Win tap is not swallowed", () => {
    let state = (0, win_key_delivery_1.initialWinDeliveryState)();
    const down = apply(state, win_key_delivery_1.VK_LWIN, true, false);
    strict_1.default.equal(down.swallow, false);
    state = down.state;
    const up = apply(state, win_key_delivery_1.VK_LWIN, false, false);
    strict_1.default.equal(up.swallow, false);
    strict_1.default.equal(up.state.left, "idle");
});
(0, node_test_1.test)("left and right Win delivery are independent", () => {
    let state = (0, win_key_delivery_1.initialWinDeliveryState)();
    state = apply(state, win_key_delivery_1.VK_LWIN, true, false).state;
    state = apply(state, win_key_delivery_1.VK_RWIN, true, true).state;
    strict_1.default.equal(state.left, "passed");
    strict_1.default.equal(state.right, "swallowed");
    const leftUp = apply(state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(leftUp.swallow, false);
    state = leftUp.state;
    const rightUp = apply(state, win_key_delivery_1.VK_RWIN, false, true);
    strict_1.default.equal(rightUp.swallow, true);
    strict_1.default.equal(rightUp.state.right, "idle");
});
(0, node_test_1.test)("non-Win keys are never swallowed by Win delivery", () => {
    const result = apply((0, win_key_delivery_1.initialWinDeliveryState)(), win_key_delivery_1.VK_LCONTROL, true, true);
    strict_1.default.equal(result.swallow, false);
    strict_1.default.deepEqual(result.state, (0, win_key_delivery_1.initialWinDeliveryState)());
});
(0, node_test_1.test)("SendInput Win and right-side modifiers need the extended flag", () => {
    strict_1.default.equal((0, win_key_delivery_1.needsExtendedKeyFlag)(win_key_delivery_1.VK_LWIN), true);
    strict_1.default.equal((0, win_key_delivery_1.needsExtendedKeyFlag)(win_key_delivery_1.VK_RWIN), true);
    strict_1.default.equal((0, win_key_delivery_1.needsExtendedKeyFlag)(win_key_delivery_1.VK_RCONTROL), true);
    strict_1.default.equal((0, win_key_delivery_1.needsExtendedKeyFlag)(win_key_delivery_1.VK_RMENU), true);
    strict_1.default.equal((0, win_key_delivery_1.needsExtendedKeyFlag)(win_key_delivery_1.VK_LCONTROL), false);
    strict_1.default.equal((0, win_key_delivery_1.needsExtendedKeyFlag)(win_key_delivery_1.VK_LMENU), false);
});
(0, node_test_1.test)("injected Win-up after a swallowed down does not eat the physical up", () => {
    let state = apply((0, win_key_delivery_1.initialWinDeliveryState)(), win_key_delivery_1.VK_LWIN, true, true).state;
    strict_1.default.equal(state.left, "swallowed");
    state = (0, win_key_delivery_1.applyInjectedWin)(state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(state.left, "idle");
    const physicalUp = apply(state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(physicalUp.swallow, false);
    strict_1.default.equal(physicalUp.state.left, "idle");
});
(0, node_test_1.test)("injected Win-down is tracked as passed so the matching up is delivered", () => {
    const state = (0, win_key_delivery_1.applyInjectedWin)((0, win_key_delivery_1.initialWinDeliveryState)(), win_key_delivery_1.VK_LWIN, true, false);
    strict_1.default.equal(state.left, "passed");
    const up = apply(state, win_key_delivery_1.VK_LWIN, false, true);
    strict_1.default.equal(up.swallow, false);
});
(0, node_test_1.test)("Win+letter chords inject a dummy key on Win-up after the letter was swallowed", () => {
    strict_1.default.equal((0, win_key_delivery_1.shouldInjectDummyOnWinUp)(true, true), true);
    strict_1.default.equal((0, win_key_delivery_1.shouldInjectDummyOnWinUp)(true, false), false);
    strict_1.default.equal((0, win_key_delivery_1.shouldInjectDummyOnWinUp)(false, true), false);
});
(0, node_test_1.test)("paste must not release Win from GetAsyncKeyState physical state", () => {
    strict_1.default.equal((0, win_key_delivery_1.shouldReleaseModifierFromAsyncState)(win_key_delivery_1.VK_LWIN), false);
    strict_1.default.equal((0, win_key_delivery_1.shouldReleaseModifierFromAsyncState)(win_key_delivery_1.VK_RWIN), false);
    strict_1.default.equal((0, win_key_delivery_1.shouldReleaseModifierFromAsyncState)(win_key_delivery_1.VK_LCONTROL), true);
    strict_1.default.equal((0, win_key_delivery_1.shouldReleaseModifierFromAsyncState)(win_key_delivery_1.VK_RCONTROL), true);
    strict_1.default.equal((0, win_key_delivery_1.shouldReleaseModifierFromAsyncState)(win_key_delivery_1.VK_LMENU), true);
});
//# sourceMappingURL=win-key-delivery.test.js.map
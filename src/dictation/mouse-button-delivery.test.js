"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mouse_button_delivery_1 = require("./mouse-button-delivery");
(0, node_test_1.test)("configured Mouse 5 swallows matching down and up", () => {
    let state = (0, mouse_button_delivery_1.initialMouseButtonDelivery)();
    const down = (0, mouse_button_delivery_1.shouldSwallowMouseButton)(state, true, true);
    strict_1.default.equal(down.swallow, true);
    strict_1.default.equal(down.state, "swallowed");
    state = down.state;
    const up = (0, mouse_button_delivery_1.shouldSwallowMouseButton)(state, false, true);
    strict_1.default.equal(up.swallow, true);
    strict_1.default.equal(up.state, "idle");
});
(0, node_test_1.test)("orphan mouse-up after capture is not swallowed so the button can unstick", () => {
    const up = (0, mouse_button_delivery_1.shouldSwallowMouseButton)((0, mouse_button_delivery_1.initialMouseButtonDelivery)(), false, true);
    strict_1.default.equal(up.swallow, false);
    strict_1.default.equal(up.state, "idle");
});
(0, node_test_1.test)("unconfigured side button is never swallowed", () => {
    let state = (0, mouse_button_delivery_1.initialMouseButtonDelivery)();
    const down = (0, mouse_button_delivery_1.shouldSwallowMouseButton)(state, true, false);
    strict_1.default.equal(down.swallow, false);
    state = down.state;
    const up = (0, mouse_button_delivery_1.shouldSwallowMouseButton)(state, false, false);
    strict_1.default.equal(up.swallow, false);
});
(0, node_test_1.test)("exit injects mouse-up only after a swallowed down", () => {
    strict_1.default.equal((0, mouse_button_delivery_1.shouldInjectMouseUpOnExit)((0, mouse_button_delivery_1.initialMouseButtonDelivery)()), false);
    strict_1.default.equal((0, mouse_button_delivery_1.shouldInjectMouseUpOnExit)("swallowed"), true);
});
//# sourceMappingURL=mouse-button-delivery.test.js.map
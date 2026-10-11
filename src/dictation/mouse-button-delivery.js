"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialMouseButtonDelivery = void 0;
exports.shouldSwallowMouseButton = shouldSwallowMouseButton;
exports.shouldInjectMouseUpOnExit = shouldInjectMouseUpOnExit;
const initialMouseButtonDelivery = () => "idle";
exports.initialMouseButtonDelivery = initialMouseButtonDelivery;
function shouldSwallowMouseButton(state, isDown, configured) {
    if (isDown) {
        if (!configured)
            return { state: "idle", swallow: false };
        return { state: "swallowed", swallow: true };
    }
    if (state === "swallowed")
        return { state: "idle", swallow: true };
    return { state: "idle", swallow: false };
}
function shouldInjectMouseUpOnExit(state) {
    return state === "swallowed";
}
//# sourceMappingURL=mouse-button-delivery.js.map
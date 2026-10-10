"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialWinDeliveryState = exports.VK_RMENU = exports.VK_LMENU = exports.VK_RCONTROL = exports.VK_LCONTROL = exports.VK_RWIN = exports.VK_LWIN = void 0;
exports.shouldSwallowWin = shouldSwallowWin;
exports.applyInjectedWin = applyInjectedWin;
exports.shouldInjectDummyOnWinUp = shouldInjectDummyOnWinUp;
exports.shouldReleaseModifierFromAsyncState = shouldReleaseModifierFromAsyncState;
exports.needsExtendedKeyFlag = needsExtendedKeyFlag;
/**
 * Tested spec for native-key-listener-windows/win-key-delivery.h.
 * Swallow Win-up only when that side's Win-down was swallowed.
 */
exports.VK_LWIN = 0x5b;
exports.VK_RWIN = 0x5c;
exports.VK_LCONTROL = 0xa2;
exports.VK_RCONTROL = 0xa3;
exports.VK_LMENU = 0xa4;
exports.VK_RMENU = 0xa5;
const initialWinDeliveryState = () => ({
    left: "idle",
    right: "idle",
});
exports.initialWinDeliveryState = initialWinDeliveryState;
const sideForVk = (vk) => {
    if (vk === exports.VK_LWIN)
        return "left";
    if (vk === exports.VK_RWIN)
        return "right";
    return null;
};
function shouldSwallowWin(state, vk, isKeyDown, isKeyUp, otherNonWinRequiredHeld) {
    const side = sideForVk(vk);
    if (!side)
        return { state, swallow: false };
    const current = state[side];
    if (isKeyDown) {
        switch (current) {
            case "swallowed":
                return { state, swallow: true };
            case "passed":
                return { state, swallow: false };
            case "idle": {
                const next = otherNonWinRequiredHeld
                    ? "swallowed"
                    : "passed";
                return {
                    state: { ...state, [side]: next },
                    swallow: next === "swallowed",
                };
            }
            default: {
                const _exhaustive = current;
                return _exhaustive;
            }
        }
    }
    if (isKeyUp) {
        return {
            state: { ...state, [side]: "idle" },
            swallow: current === "swallowed",
        };
    }
    return { state, swallow: false };
}
/** Paste/SendInput Win events skip the swallow path. Track them so a later
 * physical Win-up is not eaten after an injected up reset the side. */
function applyInjectedWin(state, vk, isKeyDown, isKeyUp) {
    const side = sideForVk(vk);
    if (!side)
        return state;
    if (isKeyDown)
        return { ...state, [side]: "passed" };
    if (isKeyUp)
        return { ...state, [side]: "idle" };
    return state;
}
/** After a Win+letter chord swallowed the letter, a passed Win-up would open
 * Start. Inject a dummy key first so Explorer does not treat it as a Win tap. */
function shouldInjectDummyOnWinUp(winWasPassed, chordKeyWasSwallowed) {
    return winWasPassed && chordKeyWasSwallowed;
}
/** GetAsyncKeyState is physical. After the hook swallows Win-down it stays
 * set, so paste must not SendInput a Win-up from that bit. */
function shouldReleaseModifierFromAsyncState(vk) {
    return vk !== exports.VK_LWIN && vk !== exports.VK_RWIN;
}
/** LWin/RWin and right Ctrl/Alt need KEYEVENTF_EXTENDEDKEY on SendInput. */
function needsExtendedKeyFlag(vk) {
    switch (vk) {
        case exports.VK_LWIN:
        case exports.VK_RWIN:
        case exports.VK_RCONTROL:
        case exports.VK_RMENU:
            return true;
        default:
            return false;
    }
}
//# sourceMappingURL=win-key-delivery.js.map
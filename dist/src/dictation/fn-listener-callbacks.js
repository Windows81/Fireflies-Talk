"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fnHandsFreeCallbacks = fnHandsFreeCallbacks;
exports.fnPolishOnlyCallbacks = fnPolishOnlyCallbacks;
/**
 * Fn as the hands-free shortcut: a clean tap toggles hands-free on release.
 * Fn also types forward delete, Home, End and the polish chord, and Fn + Shift
 * is the action shortcut, so a hold that joined another key must never start
 * dictation.
 */
function fnHandsFreeCallbacks(callbacks) {
    let tapPending = false;
    let shiftHeld = false;
    const cancelTap = () => {
        tapPending = false;
    };
    return {
        onDown: () => {
            tapPending = !shiftHeld;
        },
        onUp: () => {
            if (!tapPending)
                return;
            tapPending = false;
            callbacks.onHandsFreeDown?.();
        },
        onInterrupted: cancelTap,
        onModifierUsed: cancelTap,
        onPolish: () => {
            cancelTap();
            callbacks.onPolish?.();
        },
        onShiftChange: (down) => {
            shiftHeld = down;
            cancelTap();
        },
    };
}
/**
 * Only polish reaches the Fn listener when no other shortcut uses Fn, such as
 * push to talk on Right Cmd with polish still on Fn + 1.
 */
function fnPolishOnlyCallbacks(callbacks) {
    const ignore = () => { };
    return {
        onDown: ignore,
        onInterrupted: ignore,
        onPolish: callbacks.onPolish,
        onShiftChange: ignore,
        onUp: ignore,
    };
}
//# sourceMappingURL=fn-listener-callbacks.js.map
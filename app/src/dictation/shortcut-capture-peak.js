"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialCapturePeakState = void 0;
exports.strongerCaptureBinding = strongerCaptureBinding;
exports.commitHeldMouseBinding = commitHeldMouseBinding;
exports.applyCaptureKeyDown = applyCaptureKeyDown;
exports.applyCaptureWin = applyCaptureWin;
exports.applyCaptureKeyUp = applyCaptureKeyUp;
exports.applyCaptureFn = applyCaptureFn;
exports.applyCaptureMouse = applyCaptureMouse;
const dictation_binding_1 = require("./dictation-binding");
const shortcut_capture_modifiers_1 = require("./shortcut-capture-modifiers");
const emptyFlags = () => ({
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
});
const initialCapturePeakState = (platform) => ({
    captureWinHeld: false,
    fnHeld: false,
    lastFlags: emptyFlags(),
    peak: null,
    platform,
    rejection: null,
});
exports.initialCapturePeakState = initialCapturePeakState;
function chordScore(binding) {
    if (binding.type !== "chord")
        return 0;
    const modifiers = binding.modifiers.length + (binding.fn ? 1 : 0);
    if (binding.mouseButton !== undefined)
        return 50 + modifiers;
    return modifiers + (binding.key ? 10 : 0);
}
function strongerCaptureBinding(current, next, platform) {
    if (!next || (0, dictation_binding_1.validateCapturedBinding)(next, platform))
        return current;
    if (!current)
        return next;
    if (chordScore(next) > chordScore(current))
        return next;
    return current;
}
function commitHeldMouseBinding(pending, peak, releasedButton, platform) {
    if (!pending ||
        pending.type !== "chord" ||
        pending.mouseButton !== releasedButton) {
        return null;
    }
    if (peak?.type === "chord" && peak.mouseButton === releasedButton) {
        return strongerCaptureBinding(pending, peak, platform) ?? pending;
    }
    return pending;
}
function consider(state, key) {
    const candidate = (0, dictation_binding_1.bindingFromModifiersAndKey)((0, shortcut_capture_modifiers_1.modifiersFromCaptureFlags)(state.lastFlags, state.captureWinHeld), key ?? state.lastKey, state.lastMouse, state.fnHeld, state.lastModifierKey);
    if (!candidate)
        return state;
    const error = (0, dictation_binding_1.validateCapturedBinding)(candidate, state.platform);
    if (error) {
        const isLoneModifier = candidate.type === "chord" &&
            candidate.modifiers.length === 1 &&
            !candidate.key &&
            candidate.mouseButton === undefined &&
            !candidate.fn;
        return isLoneModifier ? { ...state, rejection: error } : state;
    }
    if (!state.peak || chordScore(candidate) > chordScore(state.peak)) {
        return { ...state, peak: candidate, rejection: null };
    }
    return { ...state, rejection: null };
}
function applyCaptureKeyDown(state, flags, key, modifierKey) {
    return consider({
        ...state,
        lastFlags: flags,
        lastKey: key ?? state.lastKey,
        lastModifierKey: modifierKey ?? state.lastModifierKey,
    }, key ?? undefined);
}
function applyCaptureWin(state, down) {
    return consider({
        ...state,
        captureWinHeld: down,
        lastFlags: { ...state.lastFlags, metaKey: down },
    }, state.lastKey);
}
/**
 * Releasing a plain key clears it, so tapping Fn afterwards cannot combine
 * with a key that is no longer held into a chord nobody pressed.
 */
function applyCaptureKeyUp(state, flags, key) {
    const released = key !== null && key === state.lastKey;
    const next = {
        ...state,
        lastFlags: flags,
        ...(released ? { lastKey: undefined } : {}),
    };
    return consider(next, next.lastKey);
}
function applyCaptureFn(state, down) {
    return consider({ ...state, fnHeld: down }, state.lastKey);
}
function applyCaptureMouse(state, flags, button, down) {
    return consider({
        ...state,
        lastFlags: flags,
        lastMouse: down ? button : state.lastMouse,
    }, state.lastKey);
}
//# sourceMappingURL=shortcut-capture-peak.js.map
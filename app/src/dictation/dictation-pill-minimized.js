"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDictationPillMinimized = isDictationPillMinimized;
exports.setDictationPillMinimizedState = setDictationPillMinimizedState;
/**
 * How the pill rests: a slim nub, or a pill bearing the mark. Kept in its own
 * module so pill-anchored windows can read it without importing windowing.
 */
let minimized = true;
function isDictationPillMinimized() {
    return minimized;
}
/** Returns true when the state actually changed. */
function setDictationPillMinimizedState(value) {
    if (minimized === value)
        return false;
    minimized = value;
    return true;
}
//# sourceMappingURL=dictation-pill-minimized.js.map
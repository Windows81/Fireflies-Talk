"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.macSharedActionArg = exports.sharesChordTarget = void 0;
/**
 * Whether the action chord presses the same key or mouse button as the
 * dictation chord (Ctrl+Option+D and Ctrl+Option+Shift+D). The native helper
 * consumes that key before any other listener can see it, so both roles must
 * be evaluated by the one helper that owns the key.
 */
const sharesChordTarget = (dictation, action) => {
    if (dictation.type !== "chord" || action?.type !== "chord")
        return false;
    if (dictation.mouseButton !== undefined) {
        return dictation.mouseButton === action.mouseButton;
    }
    return dictation.key !== undefined && dictation.key === action.key;
};
exports.sharesChordTarget = sharesChordTarget;
/** `--action-mods=ctrl,alt,shift` for the helper that owns the shared key. */
const macSharedActionArg = (action) => {
    const names = [...action.modifiers, ...(action.fn ? ["fn"] : [])];
    return `--action-mods=${names.join(",")}`;
};
exports.macSharedActionArg = macSharedActionArg;
//# sourceMappingURL=macos-shared-chord.js.map
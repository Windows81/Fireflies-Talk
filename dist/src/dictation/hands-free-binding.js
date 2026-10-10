"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatHandsFreeBindingLabel = exports.handsFreeBindingsEqual = exports.resolvePersistedHandsFreeBinding = exports.handsFreeSharesKey = exports.handsFreeOverlaps = exports.validateHandsFreeCapture = exports.handsFreeFnTaken = exports.handsFreeFnKeyCode = exports.handsFreeBindingFromCapture = exports.normalizeHandsFreeBinding = exports.defaultHandsFreeBinding = exports.HANDS_FREE_FN_TAKEN_ERROR = exports.HANDS_FREE_DICTATION_SHARED_KEY_ERROR = exports.HANDS_FREE_SHARED_KEY_ERROR = void 0;
const dictation_binding_1 = require("./dictation-binding");
const macos_shared_chord_1 = require("./macos-shared-chord");
const shortcut_conflict_1 = require("./shortcut-conflict");
const standalone_modifier_policy_1 = require("./standalone-modifier-policy");
exports.HANDS_FREE_SHARED_KEY_ERROR = "Use keys that aren't part of your dictation and action shortcuts.";
exports.HANDS_FREE_DICTATION_SHARED_KEY_ERROR = "Use keys that aren't part of your hands-free shortcut.";
exports.HANDS_FREE_FN_TAKEN_ERROR = "Push to talk already uses Fn. Pick a different key or combination.";
// Hands-free is intentionally unassigned on every platform.
const defaultHandsFreeBinding = (
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_platform) => null;
exports.defaultHandsFreeBinding = defaultHandsFreeBinding;
const normalizeHandsFreeBinding = (value, platform) => {
    if (value == null)
        return null;
    if (typeof value !== "object")
        return null;
    const record = value;
    if (record.type === "darwin-fn") {
        const bareFn = record.key === undefined &&
            !(Array.isArray(record.modifiers) && record.modifiers.length > 0);
        return platform === "darwin" && bareFn ? { type: "darwin-fn" } : null;
    }
    if (record.type !== "chord")
        return null;
    if ((0, dictation_binding_1.chordRecordFallsBackToDefault)(record, platform))
        return null;
    const normalized = (0, dictation_binding_1.normalizeDictationBinding)(value, platform);
    if (normalized.type === "chord" &&
        (0, dictation_binding_1.isStandaloneModifierBinding)(normalized) &&
        !(0, standalone_modifier_policy_1.isStandaloneModifierAllowed)(normalized.modifiers[0], platform)) {
        return null;
    }
    return normalized;
};
exports.normalizeHandsFreeBinding = normalizeHandsFreeBinding;
/**
 * The recorder reports Fn + Space as an Fn binding. Hands-free runs on a chord
 * helper rather than the Fn listener, so it keeps Fn + key as a chord.
 */
const handsFreeBindingFromCapture = (binding) => binding.type === "darwin-fn" && binding.key && !binding.modifiers?.length
    ? { fn: true, key: binding.key, modifiers: [], type: "chord" }
    : binding;
exports.handsFreeBindingFromCapture = handsFreeBindingFromCapture;
/** Mac virtual key of an Fn + key hands-free shortcut, for the Fn listener. */
const handsFreeFnKeyCode = (binding) => binding?.type === "chord" && binding.fn && binding.key
    ? ((0, dictation_binding_1.macVirtualKeyForToken)(binding.key) ?? null)
    : null;
exports.handsFreeFnKeyCode = handsFreeFnKeyCode;
/**
 * One native listener watches Fn, so Fn on its own is only free for hands-free
 * while push to talk does not use Fn.
 */
const handsFreeFnTaken = (handsFree, dictation) => handsFree !== null &&
    (0, dictation_binding_1.usesDarwinFnBinding)(handsFree) &&
    dictation.type === "darwin-fn";
exports.handsFreeFnTaken = handsFreeFnTaken;
const validateHandsFreeCapture = (binding, platform, dictation) => {
    if ((0, exports.handsFreeFnTaken)(binding, dictation)) {
        return exports.HANDS_FREE_FN_TAKEN_ERROR;
    }
    if ((0, dictation_binding_1.usesDarwinFnBinding)(binding))
        return null;
    if (binding.type === "darwin-fn") {
        return "Hold Fn and press a letter, number, or Space, such as Fn + Space.";
    }
    // Recording checked Fn + key as an Fn shortcut. As a chord, Fn with a
    // function key would also fire on the bare key.
    if (binding.fn)
        return (0, dictation_binding_1.validateCapturedBinding)(binding, platform);
    if (binding.type === "chord" &&
        (0, dictation_binding_1.isStandaloneModifierBinding)(binding) &&
        !(0, standalone_modifier_policy_1.isStandaloneModifierAllowed)(binding.modifiers[0], platform)) {
        return (0, standalone_modifier_policy_1.standaloneModifierError)(binding.modifiers[0], platform);
    }
    return null;
};
exports.validateHandsFreeCapture = validateHandsFreeCapture;
const standaloneModifierInChord = (standalone, chord) => {
    if (chord.type !== "chord" || !(0, dictation_binding_1.isStandaloneModifierBinding)(standalone)) {
        return false;
    }
    if ((0, dictation_binding_1.isStandaloneModifierBinding)(chord)) {
        return (0, shortcut_conflict_1.shortcutAlreadyInUse)(standalone, chord);
    }
    const modifier = standalone.type === "chord" ? standalone.modifiers[0] : undefined;
    return modifier !== undefined && chord.modifiers.includes(modifier);
};
const handsFreeOverlaps = (a, b) => b !== null &&
    ((0, macos_shared_chord_1.sharesChordTarget)(a, b) ||
        standaloneModifierInChord(a, b) ||
        standaloneModifierInChord(b, a));
exports.handsFreeOverlaps = handsFreeOverlaps;
const handsFreeSharesKey = (candidate, dictation, action) => (0, exports.handsFreeOverlaps)(candidate, dictation) ||
    (0, exports.handsFreeOverlaps)(candidate, action);
exports.handsFreeSharesKey = handsFreeSharesKey;
const resolvePersistedHandsFreeBinding = (stored, dictation, action, polish, platform) => {
    const binding = (0, exports.normalizeHandsFreeBinding)(stored, platform);
    if (!binding)
        return null;
    if ((0, shortcut_conflict_1.shortcutAlreadyInUse)(binding, dictation) ||
        (0, shortcut_conflict_1.shortcutAlreadyInUse)(binding, action) ||
        (0, shortcut_conflict_1.shortcutAlreadyInUse)(binding, polish) ||
        (0, exports.handsFreeSharesKey)(binding, dictation, action) ||
        (0, exports.handsFreeFnTaken)(binding, dictation)) {
        return null;
    }
    return binding;
};
exports.resolvePersistedHandsFreeBinding = resolvePersistedHandsFreeBinding;
exports.handsFreeBindingsEqual = dictation_binding_1.nullableBindingsEqual;
const formatHandsFreeBindingLabel = (binding, options) => binding ? (0, dictation_binding_1.formatDictationBindingLabel)(binding, options) : "Unassigned";
exports.formatHandsFreeBindingLabel = formatHandsFreeBindingLabel;
//# sourceMappingURL=hands-free-binding.js.map
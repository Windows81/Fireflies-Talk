"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.polishConflictBindings = exports.polishSharesKey = exports.validatePolishCapture = exports.polishBindingFromMacVirtualKey = exports.polishMacVirtualKeys = exports.formatPolishBindingLabel = exports.normalizePolishBinding = exports.polishBindingsEqual = exports.defaultPolishBinding = exports.SHARES_POLISH_KEY_ERROR = exports.POLISH_SHARED_KEY_ERROR = void 0;
const dictation_binding_1 = require("./dictation-binding");
const macos_shared_chord_1 = require("./macos-shared-chord");
exports.POLISH_SHARED_KEY_ERROR = "That key is already part of another Talk shortcut. Pick a different key.";
exports.SHARES_POLISH_KEY_ERROR = "That key is already part of your polish shortcut. Pick a different key.";
/** Fn + 1. */
const defaultPolishBinding = (platform) => platform === "darwin"
    ? { functionRowAlias: true, key: "1", type: "darwin-fn" }
    : null;
exports.defaultPolishBinding = defaultPolishBinding;
const hasFunctionRowAlias = (binding) => binding.type === "darwin-fn" &&
    Boolean(binding.functionRowAlias);
const polishBindingsEqual = (left, right) => {
    if (left === right)
        return true;
    if (!left || !right)
        return false;
    return ((0, dictation_binding_1.dictationBindingsEqual)(left, right) &&
        hasFunctionRowAlias(left) === hasFunctionRowAlias(right));
};
exports.polishBindingsEqual = polishBindingsEqual;
/**
 * On a function-row keyboard the "1" key reports F1 (0x7a) instead of 1 (0x12)
 * depending on the "Use F1, F2 as standard function keys" setting, so the
 * default binding answers to both. A recorded binding answers to exactly the
 * key that was recorded.
 */
const DEFAULT_ALIAS_KEYS = ["1", "F1"];
const normalizeFnPolish = (record) => {
    const key = (0, dictation_binding_1.normalizeKeyToken)(record.key);
    // Bare Fn is hold-to-dictate, never a polish trigger.
    if (!key)
        return null;
    if ((0, dictation_binding_1.macVirtualKeyForToken)(key) === undefined)
        return null;
    const binding = { key, type: "darwin-fn" };
    if (record.functionRowAlias === true)
        binding.functionRowAlias = true;
    return binding;
};
/**
 * Polish fires the moment its chord goes down, so it needs a key or a side
 * mouse button. Modifiers alone would fire partway through Ctrl + Shift + T.
 * Fn stays on the Globe listener as an Fn chord, never a chord helper flag.
 */
const isUsablePolishChord = (binding) => binding.type === "chord" &&
    !binding.fn &&
    (binding.key !== undefined || binding.mouseButton !== undefined);
const normalizePolishBinding = (value, platform) => {
    if (platform !== "darwin")
        return null;
    if (value === undefined)
        return (0, exports.defaultPolishBinding)(platform);
    if (value == null)
        return null;
    if (typeof value !== "object")
        return (0, exports.defaultPolishBinding)(platform);
    const record = value;
    if (record.type === "unassigned")
        return null;
    if (record.type === "darwin-fn")
        return normalizeFnPolish(record);
    // A stored chord must pass the same checks as a recorded one, or a hand-edited
    // or stale value could bind polish to a bare key and swallow it everywhere.
    const chord = (0, dictation_binding_1.normalizeDictationBinding)(value, platform);
    if (chord.type !== "chord" || (0, exports.validatePolishCapture)(chord)) {
        return (0, exports.defaultPolishBinding)(platform);
    }
    return chord;
};
exports.normalizePolishBinding = normalizePolishBinding;
const formatPolishBindingLabel = (binding) => binding
    ? (0, dictation_binding_1.formatDictationBindingLabel)(binding, { isMac: true })
    : "Unassigned";
exports.formatPolishBindingLabel = formatPolishBindingLabel;
/** Virtual key codes the native Fn listener should treat as polish. */
const polishMacVirtualKeys = (binding) => {
    if (binding?.type !== "darwin-fn" || !binding.key)
        return [];
    const keys = binding.functionRowAlias ? DEFAULT_ALIAS_KEYS : [binding.key];
    const codes = [];
    for (const key of keys) {
        const code = (0, dictation_binding_1.macVirtualKeyForToken)(key);
        if (code !== undefined && !codes.includes(code))
            codes.push(code);
    }
    return codes;
};
exports.polishMacVirtualKeys = polishMacVirtualKeys;
/** Builds a polish binding from a virtual key code the listener captured. */
const polishBindingFromMacVirtualKey = (code) => {
    const key = (0, dictation_binding_1.keyTokenFromMacVirtualKey)(code);
    return key ? { key, type: "darwin-fn" } : null;
};
exports.polishBindingFromMacVirtualKey = polishBindingFromMacVirtualKey;
/** Shift plus a letter, digit, Space or backquote is just typing. */
const isShiftOnlyTyping = (binding) => binding.modifiers.length === 1 &&
    binding.modifiers[0] === "shift" &&
    binding.key !== undefined &&
    !/^F([1-9]|1[0-2])$/.test(binding.key);
const POLISH_NEEDS_KEY_ERROR = "Polish needs a key. Try Fn + 1, or a combination like Ctrl + Shift + P.";
/**
 * Checks a freshly captured shortcut. Takes the raw binding rather than a
 * normalized one: normalizePolishBinding falls back to the default for
 * anything unusable, which would turn a rejected chord into a silent save.
 */
const validatePolishCapture = (binding) => {
    if (binding.type === "chord") {
        if (binding.fn) {
            return "To use Fn, hold Fn and press one key, such as Fn + 1.";
        }
        if (!isUsablePolishChord(binding))
            return POLISH_NEEDS_KEY_ERROR;
        // Polish fires the moment its chord goes down, so this would fire mid-word.
        if (isShiftOnlyTyping(binding)) {
            return "Shift on its own types capitals. Add Ctrl, Option, or Cmd, such as Ctrl + Shift + P.";
        }
        return (0, dictation_binding_1.validateCapturedBinding)(binding, "darwin");
    }
    if (!binding.key || binding.modifiers?.length)
        return POLISH_NEEDS_KEY_ERROR;
    if ((0, dictation_binding_1.macVirtualKeyForToken)(binding.key) === undefined) {
        return "That key can't be used with Fn. Try a letter, a number, or F1–F12.";
    }
    return null;
};
exports.validatePolishCapture = validatePolishCapture;
/**
 * A polish chord runs on its own helper, which swallows its key. Another chord
 * on the same key or mouse button would compete with it for every press.
 */
const polishSharesKey = (polish, other) => polish !== null && other !== null && (0, macos_shared_chord_1.sharesChordTarget)(polish, other);
exports.polishSharesKey = polishSharesKey;
/** Bindings that collide with this polish shortcut, including the F1 alias. */
const polishConflictBindings = (binding) => {
    if (!binding)
        return [];
    if (hasFunctionRowAlias(binding)) {
        return DEFAULT_ALIAS_KEYS.map((key) => ({
            key,
            type: "darwin-fn",
        }));
    }
    return [binding];
};
exports.polishConflictBindings = polishConflictBindings;
//# sourceMappingURL=polish-binding.js.map
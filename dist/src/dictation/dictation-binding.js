"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindingFromModifiersAndKey = exports.validateCapturedBinding = exports.isFnShiftBinding = exports.usesDarwinFnBinding = exports.isStandaloneModifierBinding = exports.bindingRequiresShift = exports.getDictationShortcutSnapshot = exports.getDictationShortcutHint = exports.formatDictationBindingLabel = exports.nullableBindingsEqual = exports.dictationBindingsEqual = exports.normalizeDictationBinding = exports.chordRecordFallsBackToDefault = exports.defaultDictationBinding = exports.normalizeKeyToken = exports.macVirtualKeyForToken = exports.keyTokenFromMacVirtualKey = void 0;
const hotkey_mouse_1 = require("./hotkey-mouse");
const macos_key_codes_1 = require("./macos-key-codes");
Object.defineProperty(exports, "keyTokenFromMacVirtualKey", { enumerable: true, get: function () { return macos_key_codes_1.keyTokenFromMacVirtualKey; } });
Object.defineProperty(exports, "macVirtualKeyForToken", { enumerable: true, get: function () { return macos_key_codes_1.macVirtualKeyForToken; } });
const shortcut_modifiers_1 = require("./shortcut-modifiers");
const standalone_modifier_policy_1 = require("./standalone-modifier-policy");
const normalizeKeyToken = (value) => {
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    if (/^[a-z]$/i.test(trimmed))
        return trimmed.toUpperCase();
    if (/^[0-9]$/.test(trimmed))
        return trimmed;
    if (/^F([1-9]|1[0-2])$/i.test(trimmed))
        return trimmed.toUpperCase();
    if (trimmed.toLowerCase() === "space")
        return "Space";
    if (trimmed.toLowerCase() === "backquote")
        return "Backquote";
    return undefined;
};
exports.normalizeKeyToken = normalizeKeyToken;
const defaultDictationBinding = (platform) => platform === "darwin"
    ? { type: "darwin-fn" }
    : { modifiers: ["ctrl", "meta"], type: "chord" };
exports.defaultDictationBinding = defaultDictationBinding;
const normalizeChordBinding = (modifiers, key, modifierKey, mouseButton, fn) => {
    const sorted = (0, shortcut_modifiers_1.sortModifiers)(modifiers);
    const withFn = fn ? { fn: true } : {};
    const normalizedMouse = (0, hotkey_mouse_1.normalizeMouseButton)(mouseButton);
    if (normalizedMouse !== undefined) {
        return {
            modifiers: sorted,
            mouseButton: normalizedMouse,
            type: "chord",
            ...withFn,
        };
    }
    const normalizedKey = (0, exports.normalizeKeyToken)(key);
    if (normalizedKey) {
        return { key: normalizedKey, modifiers: sorted, type: "chord", ...withFn };
    }
    if ((0, shortcut_modifiers_1.isModifierKeyId)(modifierKey) &&
        sorted.length === 1 &&
        sorted[0] === (0, shortcut_modifiers_1.modifierForPhysicalKey)(modifierKey)) {
        return { modifierKey, modifiers: sorted, type: "chord", ...withFn };
    }
    return { modifiers: sorted, type: "chord", ...withFn };
};
const chordFallsBackToDefault = (chord, platform) => {
    const targetless = !chord.fn && !chord.key && chord.mouseButton === undefined;
    return (targetless &&
        (chord.modifiers.length === 0 ||
            (chord.modifiers.length === 1 &&
                (platform === "darwin"
                    ? !chord.modifierKey
                    : !(0, standalone_modifier_policy_1.isStandaloneModifierAllowed)(chord.modifiers[0], platform)))));
};
const chordRecordFallsBackToDefault = (record, platform) => {
    if (record.type !== "chord")
        return false;
    if (record.modifierKey !== undefined && platform !== "darwin")
        return true;
    const modifiers = Array.isArray(record.modifiers)
        ? record.modifiers.filter(shortcut_modifiers_1.isModifierId)
        : [];
    const chord = normalizeChordBinding(modifiers, record.key, platform === "darwin" ? record.modifierKey : undefined, record.mouseButton, record.fn === true && platform === "darwin");
    return chordFallsBackToDefault(chord, platform);
};
exports.chordRecordFallsBackToDefault = chordRecordFallsBackToDefault;
const normalizeDictationBinding = (value, platform) => {
    if (!value || typeof value !== "object") {
        return (0, exports.defaultDictationBinding)(platform);
    }
    const record = value;
    if (record.type === "darwin-fn") {
        if (platform !== "darwin")
            return (0, exports.defaultDictationBinding)(platform);
        const key = (0, exports.normalizeKeyToken)(record.key);
        return key ? { key, type: "darwin-fn" } : { type: "darwin-fn" };
    }
    if (record.type === "chord") {
        if (record.modifierKey !== undefined && platform !== "darwin") {
            return (0, exports.defaultDictationBinding)(platform);
        }
        const modifiers = Array.isArray(record.modifiers)
            ? record.modifiers.filter(shortcut_modifiers_1.isModifierId)
            : [];
        const chord = normalizeChordBinding(modifiers, record.key, platform === "darwin" ? record.modifierKey : undefined, record.mouseButton, record.fn === true && platform === "darwin");
        if (chordFallsBackToDefault(chord, platform)) {
            return (0, exports.defaultDictationBinding)(platform);
        }
        return chord;
    }
    return (0, exports.defaultDictationBinding)(platform);
};
exports.normalizeDictationBinding = normalizeDictationBinding;
const dictationBindingsEqual = (left, right) => {
    if (left.type !== right.type)
        return false;
    if (left.type === "darwin-fn") {
        const fn = right;
        const leftMods = (0, shortcut_modifiers_1.sortModifiers)(left.modifiers ?? []);
        const rightMods = (0, shortcut_modifiers_1.sortModifiers)(fn.modifiers ?? []);
        return (left.key === fn.key &&
            leftMods.length === rightMods.length &&
            leftMods.every((modifier, i) => modifier === rightMods[i]));
    }
    const other = right;
    return (left.key === other.key &&
        left.modifierKey === other.modifierKey &&
        left.mouseButton === other.mouseButton &&
        Boolean(left.fn) === Boolean(other.fn) &&
        (0, shortcut_modifiers_1.sortModifiers)(left.modifiers).join() ===
            (0, shortcut_modifiers_1.sortModifiers)(other.modifiers).join());
};
exports.dictationBindingsEqual = dictationBindingsEqual;
const nullableBindingsEqual = (left, right) => {
    if (left === right)
        return true;
    if (!left || !right)
        return false;
    return (0, exports.dictationBindingsEqual)(left, right);
};
exports.nullableBindingsEqual = nullableBindingsEqual;
const modifierLabels = (isMac) => ({
    alt: isMac ? "Option" : "Alt",
    ctrl: "Ctrl",
    meta: isMac ? "Cmd" : "Win",
    shift: "Shift",
});
const formatDictationBindingLabel = (binding, options) => {
    if (binding.type === "darwin-fn") {
        const separator = options.compact ? "+" : " + ";
        const labels = modifierLabels(options.isMac);
        const parts = ["Fn", ...(binding.modifiers ?? []).map((m) => labels[m])];
        if (binding.key) {
            parts.push(binding.key === "Backquote" ? "`" : binding.key);
        }
        return parts.join(separator);
    }
    if (binding.type === "chord") {
        const labels = modifierLabels(options.isMac);
        const parts = binding.fn ? ["Fn"] : [];
        if (binding.modifierKey && options.isMac) {
            parts.push((0, shortcut_modifiers_1.physicalModifierLabel)(binding.modifierKey));
        }
        else {
            parts.push(...binding.modifiers.map((modifier) => labels[modifier]));
        }
        if (binding.mouseButton) {
            parts.push((0, hotkey_mouse_1.formatMouseLabel)(binding.mouseButton));
        }
        else if (binding.key) {
            parts.push(binding.key === "Backquote" ? "`" : binding.key);
        }
        if (parts.length === 0)
            return "Unassigned";
        return parts.join(options.compact ? "+" : " + ");
    }
    const _exhaustive = binding;
    return _exhaustive;
};
exports.formatDictationBindingLabel = formatDictationBindingLabel;
const getDictationShortcutHint = (binding, platform) => `Hold ${(0, exports.formatDictationBindingLabel)(binding, {
    compact: true,
    isMac: platform === "darwin",
})}`;
exports.getDictationShortcutHint = getDictationShortcutHint;
const getDictationShortcutSnapshot = (binding, platform) => {
    const normalized = (0, exports.normalizeDictationBinding)(binding, platform);
    return {
        binding: normalized,
        hint: (0, exports.getDictationShortcutHint)(normalized, platform),
        label: (0, exports.formatDictationBindingLabel)(normalized, {
            isMac: platform === "darwin",
        }),
    };
};
exports.getDictationShortcutSnapshot = getDictationShortcutSnapshot;
const bindingRequiresShift = (binding) => binding.type === "chord" && binding.modifiers.includes("shift");
exports.bindingRequiresShift = bindingRequiresShift;
const isStandaloneModifierBinding = (binding) => binding?.type === "chord" &&
    binding.modifiers.length === 1 &&
    !binding.key &&
    binding.mouseButton === undefined &&
    !binding.fn;
exports.isStandaloneModifierBinding = isStandaloneModifierBinding;
const usesDarwinFnBinding = (binding) => binding.type === "darwin-fn" && !binding.key && !binding.modifiers?.length;
exports.usesDarwinFnBinding = usesDarwinFnBinding;
const isFnShiftBinding = (binding) => binding?.type === "darwin-fn" &&
    !binding.key &&
    binding.modifiers?.length === 1 &&
    binding.modifiers[0] === "shift";
exports.isFnShiftBinding = isFnShiftBinding;
const validateCapturedBinding = (binding, platform) => {
    if (!binding) {
        return "No shortcut detected. Hold a key combination, then release.";
    }
    if (binding.type === "darwin-fn") {
        const modifiers = binding.modifiers ?? [];
        // Bare Fn and Fn plus a key are both captured by the native listener.
        if (modifiers.length === 0)
            return null;
        // Only Shift is meaningful alongside Fn: it is read during the Fn hold
        // rather than registered as its own shortcut.
        if (binding.key) {
            return "Fn plus a modifier can't also take another key. Try Fn + Shift, or Fn and a key.";
        }
        if (modifiers.length > 1 || modifiers[0] !== "shift") {
            return "Only Shift can be held with Fn. Try Fn + Shift, or Fn and a key.";
        }
        return null;
    }
    if (binding.mouseButton !== undefined) {
        return (0, hotkey_mouse_1.mouseButtonCaptureError)(binding.mouseButton);
    }
    // macOS marks arrows and F-keys as function keys whether or not Fn is held,
    // so an Fn + F-key chord would also fire on the bare key.
    if (binding.fn && binding.key && /^F([1-9]|1[0-2])$/.test(binding.key)) {
        return "Fn cannot be combined with a function key. Try a letter or number, such as Fn + Z.";
    }
    // Fn is a modifier for this purpose, so Fn + Z needs nothing further.
    const modifierCount = binding.modifiers.length + (binding.fn ? 1 : 0);
    if (modifierCount === 0) {
        return "Add at least one modifier (Ctrl, Option/Alt, Cmd/Win, or Shift).";
    }
    if (modifierCount === 1 &&
        !binding.key &&
        binding.mouseButton === undefined) {
        const modifier = binding.modifiers[0];
        if (platform === "darwin" && !binding.modifierKey) {
            return "A single modifier can't be the shortcut here. Try a combination like Ctrl + Shift.";
        }
        if (!(0, standalone_modifier_policy_1.isStandaloneModifierAllowed)(modifier, platform)) {
            return (0, standalone_modifier_policy_1.standaloneModifierError)(modifier, platform);
        }
    }
    return null;
};
exports.validateCapturedBinding = validateCapturedBinding;
const bindingFromModifiersAndKey = (modifiers, key, mouseButton, fn, modifierKey) => {
    const sorted = (0, shortcut_modifiers_1.sortModifiers)(modifiers);
    const normalizedKey = (0, exports.normalizeKeyToken)(key);
    if (fn &&
        sorted.length === 0 &&
        !normalizedKey &&
        typeof mouseButton !== "number") {
        return { type: "darwin-fn" };
    }
    const chord = {
        modifiers: sorted,
        type: "chord",
    };
    if (fn)
        chord.fn = true;
    if (typeof mouseButton === "number")
        chord.mouseButton = mouseButton;
    else if (normalizedKey)
        chord.key = normalizedKey;
    else if (modifierKey &&
        sorted.length === 1 &&
        sorted[0] === (0, shortcut_modifiers_1.modifierForPhysicalKey)(modifierKey)) {
        chord.modifierKey = modifierKey;
    }
    if (chord.modifiers.length === 0 &&
        !chord.fn &&
        !chord.key &&
        !chord.modifierKey &&
        chord.mouseButton === undefined) {
        return null;
    }
    return chord;
};
exports.bindingFromModifiersAndKey = bindingFromModifiersAndKey;
//# sourceMappingURL=dictation-binding.js.map
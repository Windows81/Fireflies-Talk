"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatActionBindingLabel = exports.findMatchingActionPresetId = exports.getActionPresetOptions = exports.resolveOverlayPreferenceAction = exports.resolvePersistedActionBinding = exports.actionRunsAsShiftOverlay = exports.normalizeActionBinding = exports.validateActionCapture = exports.actionBindingsEqual = exports.defaultActionBinding = void 0;
const hotkey_mouse_1 = require("./hotkey-mouse");
const dictation_binding_1 = require("./dictation-binding");
const shortcut_conflict_1 = require("./shortcut-conflict");
const standalone_modifier_policy_1 = require("./standalone-modifier-policy");
const MAC_ONLY = ["darwin"];
const WINDOWS_ONLY = ["win32"];
const PRESET_DEFS = [
    {
        binding: { modifiers: ["alt", "meta"], type: "chord" },
        id: "alt-meta",
        label: "Option + Cmd",
        platforms: MAC_ONLY,
    },
    {
        binding: { modifiers: ["alt", "meta"], type: "chord" },
        id: "alt-meta",
        label: "Alt + Win",
        platforms: WINDOWS_ONLY,
    },
    {
        binding: { key: "Z", modifiers: ["meta"], type: "chord" },
        id: "meta-z",
        label: "Win + Z",
        platforms: WINDOWS_ONLY,
    },
    {
        binding: { modifiers: ["ctrl", "meta", "shift"], type: "chord" },
        id: "ctrl-meta-shift",
        label: "Ctrl + Win + Shift",
        platforms: WINDOWS_ONLY,
    },
    {
        binding: { modifiers: ["ctrl", "alt"], type: "chord" },
        id: "ctrl-alt",
        label: "Ctrl + Option",
        platforms: MAC_ONLY,
    },
    {
        binding: { modifiers: [], mouseButton: 4, type: "chord" },
        id: "mouse4",
        label: (0, hotkey_mouse_1.formatMouseLabel)(4),
        platforms: [...MAC_ONLY, ...WINDOWS_ONLY],
    },
    {
        binding: { modifiers: [], mouseButton: 5, type: "chord" },
        id: "mouse5",
        label: (0, hotkey_mouse_1.formatMouseLabel)(5),
        platforms: [...MAC_ONLY, ...WINDOWS_ONLY],
    },
];
const defaultActionBinding = (platform) => {
    if (platform === "win32")
        return { modifiers: ["alt", "meta"], type: "chord" };
    if (platform === "darwin")
        return { modifiers: ["shift"], type: "darwin-fn" };
    return null;
};
exports.defaultActionBinding = defaultActionBinding;
const actionBindingsEqual = (left, right) => (0, dictation_binding_1.nullableBindingsEqual)(left, right);
exports.actionBindingsEqual = actionBindingsEqual;
const validateActionCapture = (binding, platform) => {
    if (binding.type === "chord" && (0, dictation_binding_1.isStandaloneModifierBinding)(binding)) {
        const modifier = binding.modifiers[0];
        if (platform === "darwin" && binding.modifierKey) {
            return "A standalone modifier can only be used for the push to talk shortcut.";
        }
        if ((0, standalone_modifier_policy_1.isStandaloneModifierAllowed)(modifier, platform)) {
            return null;
        }
        return (0, standalone_modifier_policy_1.standaloneModifierError)(modifier, platform);
    }
    if (binding.type === "darwin-fn" && !(0, dictation_binding_1.isFnShiftBinding)(binding)) {
        return "Fn can only start action mode as Fn + Shift.";
    }
    return null;
};
exports.validateActionCapture = validateActionCapture;
/**
 * Fn + Shift is the only Fn shortcut action mode can take: one native listener
 * watches Fn and it drives the dictation hold. Any other Fn binding could
 * never fire, so it is stored as unassigned rather than as a dead shortcut.
 */
const normalizeFnActionBinding = (record) => {
    // Exactly Shift: Fn + Shift + anything else would quietly lose the extra
    // modifier, since only Shift is read during the Fn hold.
    const onlyShift = Array.isArray(record.modifiers) &&
        record.modifiers.length === 1 &&
        record.modifiers[0] === "shift";
    return onlyShift ? { modifiers: ["shift"], type: "darwin-fn" } : null;
};
const normalizeActionBinding = (value, platform) => {
    if (value === undefined)
        return (0, exports.defaultActionBinding)(platform);
    if (value == null)
        return null;
    if (typeof value === "object" &&
        value.type === "unassigned") {
        return null;
    }
    const record = value;
    if (platform === "darwin" && record.type === "darwin-fn") {
        return normalizeFnActionBinding(record);
    }
    if (record.type === "chord" && record.modifierKey !== undefined)
        return null;
    if ((0, dictation_binding_1.chordRecordFallsBackToDefault)(record, platform))
        return null;
    const normalized = (0, dictation_binding_1.normalizeDictationBinding)(value, platform);
    if ((0, dictation_binding_1.isStandaloneModifierBinding)(normalized) &&
        normalized.type === "chord" &&
        !(0, standalone_modifier_policy_1.isStandaloneModifierAllowed)(normalized.modifiers[0], platform)) {
        return null;
    }
    return normalized;
};
exports.normalizeActionBinding = normalizeActionBinding;
/**
 * Whether action mode runs as Shift observed during the dictation hold rather
 * than as its own registered shortcut. Only Fn + Shift over a bare-Fn
 * dictation shortcut works that way.
 */
const actionRunsAsShiftOverlay = (action, dictation) => (0, dictation_binding_1.isFnShiftBinding)(action) && dictation.type === "darwin-fn" && !dictation.key;
exports.actionRunsAsShiftOverlay = actionRunsAsShiftOverlay;
const resolvePersistedActionBinding = (stored, dictation, platform) => {
    const action = (0, exports.normalizeActionBinding)(stored, platform);
    if ((0, shortcut_conflict_1.shortcutAlreadyInUse)(action, dictation))
        return null;
    return action;
};
exports.resolvePersistedActionBinding = resolvePersistedActionBinding;
/**
 * Carries the old "also use Shift" preference into a real action binding.
 * Fn + Shift only fires over bare-Fn dictation. A chord dictation shortcut
 * becomes that chord plus Shift, which is what the overlay used to do.
 */
const resolveOverlayPreferenceAction = (stored, dictation, usedOverlay, platform) => {
    const existing = stored === undefined ? null : (0, exports.normalizeActionBinding)(stored, platform);
    const unusedFnShift = (0, dictation_binding_1.isFnShiftBinding)(existing) &&
        !(0, exports.actionRunsAsShiftOverlay)(existing, dictation);
    if (existing && !unusedFnShift)
        return existing;
    if (!usedOverlay)
        return null;
    const fnShift = { modifiers: ["shift"], type: "darwin-fn" };
    if ((0, exports.actionRunsAsShiftOverlay)(fnShift, dictation))
        return fnShift;
    if (dictation.type === "chord" && !(0, dictation_binding_1.bindingRequiresShift)(dictation)) {
        return (0, exports.normalizeActionBinding)({ ...dictation, modifiers: [...dictation.modifiers, "shift"] }, platform);
    }
    return null;
};
exports.resolveOverlayPreferenceAction = resolveOverlayPreferenceAction;
const getActionPresetOptions = (platform) => PRESET_DEFS.filter((definition) => definition.platforms.includes(platform)).map(({ binding, id, label }) => ({ binding, id, label }));
exports.getActionPresetOptions = getActionPresetOptions;
const findMatchingActionPresetId = (binding, platform) => {
    if (!binding)
        return null;
    const normalized = (0, dictation_binding_1.normalizeDictationBinding)(binding, platform);
    for (const definition of PRESET_DEFS) {
        if (definition.platforms.includes(platform) &&
            (0, dictation_binding_1.dictationBindingsEqual)(definition.binding, normalized)) {
            return definition.id;
        }
    }
    return null;
};
exports.findMatchingActionPresetId = findMatchingActionPresetId;
const formatActionBindingLabel = (binding, options) => {
    if (!binding)
        return "Unassigned";
    return (0, dictation_binding_1.formatDictationBindingLabel)(binding, options);
};
exports.formatActionBindingLabel = formatActionBindingLabel;
//# sourceMappingURL=action-binding.js.map
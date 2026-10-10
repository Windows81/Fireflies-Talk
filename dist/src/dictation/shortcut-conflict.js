"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortcutAlreadyInUse = shortcutAlreadyInUse;
exports.shortcutTakenError = shortcutTakenError;
exports.formatTakenPresetLabel = formatTakenPresetLabel;
const dictation_binding_1 = require("./dictation-binding");
const polish_binding_1 = require("./polish-binding");
/**
 * Fn + Space is the same keypress whether the Fn listener owns it (push to
 * talk, polish) or a chord helper does (hands-free), so compare one shape.
 */
function asFnKeyBinding(binding) {
    if (binding.type !== "chord" || !binding.fn || !binding.key)
        return binding;
    if (binding.modifiers.length > 0)
        return binding;
    return { key: binding.key, type: "darwin-fn" };
}
function shortcutAlreadyInUse(candidate, taken) {
    if (!candidate || !taken)
        return false;
    return (0, polish_binding_1.polishConflictBindings)(asFnKeyBinding(candidate)).some((left) => (0, polish_binding_1.polishConflictBindings)(asFnKeyBinding(taken)).some((right) => (0, dictation_binding_1.dictationBindingsEqual)(left, right)));
}
const ROLE_USE = {
    action: "for commands",
    dictation: "to dictate",
    handsFree: "to dictate hands-free",
    polish: "to rewrite selected text",
};
function shortcutTakenError(takenBy) {
    return `That shortcut is already used ${ROLE_USE[takenBy]}.`;
}
function formatTakenPresetLabel(label, takenBy) {
    return `${label} · in use ${ROLE_USE[takenBy]}`;
}
//# sourceMappingURL=shortcut-conflict.js.map
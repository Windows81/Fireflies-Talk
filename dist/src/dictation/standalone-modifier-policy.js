"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standaloneModifierError = exports.isStandaloneModifierAllowed = void 0;
const ALLOWED_NON_MAC_MODIFIERS = new Set(["alt", "shift"]);
const MODIFIER_LABELS = {
    alt: { mac: "Option", windows: "Alt" },
    ctrl: { mac: "Control", windows: "Ctrl" },
    meta: { mac: "Command", windows: "The Windows key" },
    shift: { mac: "Shift", windows: "Shift" },
};
const EXAMPLES = {
    alt: { mac: "Option + Cmd", windows: "Ctrl + Win" },
    ctrl: { mac: "Ctrl + Cmd", windows: "Ctrl + Win" },
    meta: { mac: "Ctrl + Cmd", windows: "Ctrl + Win" },
    shift: { mac: "Ctrl + Shift", windows: "Ctrl + Shift" },
};
const isStandaloneModifierAllowed = (modifier, platform) => platform === "darwin" || ALLOWED_NON_MAC_MODIFIERS.has(modifier);
exports.isStandaloneModifierAllowed = isStandaloneModifierAllowed;
const standaloneModifierError = (modifier, platform) => {
    const labels = MODIFIER_LABELS[modifier];
    const example = EXAMPLES[modifier];
    const label = platform === "darwin" ? labels.mac : labels.windows;
    const combination = platform === "darwin" ? example.mac : example.windows;
    return `${label} on its own can't be the shortcut. Add another key, like ${combination}.`;
};
exports.standaloneModifierError = standaloneModifierError;
//# sourceMappingURL=standalone-modifier-policy.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDictationBindingKeycaps = void 0;
const hotkey_mouse_1 = require("./hotkey-mouse");
const shortcut_modifiers_1 = require("./shortcut-modifiers");
const modifierLabels = {
    alt: { glyph: "⌥", label: "Opt" },
    ctrl: { glyph: "⌃", label: "Ctrl" },
    meta: { icon: "command", label: "Cmd" },
    shift: { glyph: "⇧", label: "Shift" },
};
const windowsModifierLabels = {
    alt: { label: "Alt" },
    ctrl: { label: "Ctrl" },
    meta: { icon: "windows", label: "Win" },
    shift: { label: "Shift" },
};
const keyLabel = (key) => (key === "Backquote" ? "`" : key);
const modifierKeycap = (modifier, isMac) => isMac ? modifierLabels[modifier] : windowsModifierLabels[modifier];
const getDictationBindingKeycaps = (binding, options) => {
    const keycaps = [];
    const { isMac } = options;
    if (binding.type === "darwin-fn") {
        keycaps.push({ label: "Fn" });
        keycaps.push(...(binding.modifiers ?? []).map((modifier) => modifierKeycap(modifier, isMac)));
        if (binding.key)
            keycaps.push({ label: keyLabel(binding.key) });
        return keycaps;
    }
    if (binding.fn) {
        keycaps.push({ label: "Fn" });
    }
    if (binding.modifierKey && isMac) {
        const modifier = (0, shortcut_modifiers_1.modifierForPhysicalKey)(binding.modifierKey);
        keycaps.push({
            ...modifierKeycap(modifier, true),
            ...(binding.modifierKey.endsWith("-right")
                ? { side: "right" }
                : {}),
        });
    }
    else {
        keycaps.push(...binding.modifiers.map((modifier) => modifierKeycap(modifier, isMac)));
    }
    if (binding.mouseButton) {
        keycaps.push({ label: (0, hotkey_mouse_1.formatMouseLabel)(binding.mouseButton) });
    }
    else if (binding.key) {
        keycaps.push({ label: keyLabel(binding.key) });
    }
    return keycaps;
};
exports.getDictationBindingKeycaps = getDictationBindingKeycaps;
//# sourceMappingURL=shortcut-keys.js.map
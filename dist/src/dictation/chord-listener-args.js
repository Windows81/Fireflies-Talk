"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.macChordListenerArgs = exports.windowsHotkeyString = void 0;
const macos_key_codes_1 = require("./macos-key-codes");
const shortcut_modifiers_1 = require("./shortcut-modifiers");
const windowsHotkeyString = (binding) => {
    const names = {
        alt: "Alt",
        ctrl: "Ctrl",
        meta: "Win",
        shift: "Shift",
    };
    const parts = binding.modifiers.map((modifier) => names[modifier]);
    if (binding.mouseButton)
        parts.push(`Mouse${binding.mouseButton}`);
    else if (binding.key)
        parts.push(binding.key);
    return parts.join("+");
};
exports.windowsHotkeyString = windowsHotkeyString;
const macChordListenerArgs = (binding) => {
    const args = [];
    if (binding.fn)
        args.push("--fn");
    const physicalModifier = binding.modifierKey
        ? (0, shortcut_modifiers_1.modifierForPhysicalKey)(binding.modifierKey)
        : undefined;
    if (binding.modifiers.includes("ctrl") && physicalModifier !== "ctrl")
        args.push("--ctrl");
    if (binding.modifiers.includes("alt") && physicalModifier !== "alt")
        args.push("--alt");
    if (binding.modifiers.includes("shift") && physicalModifier !== "shift")
        args.push("--shift");
    if (binding.modifiers.includes("meta") && physicalModifier !== "meta")
        args.push("--meta");
    if (binding.modifierKey) {
        args.push(`--modifier-key=${(0, shortcut_modifiers_1.macVirtualKeyForModifier)(binding.modifierKey)}`);
    }
    if (binding.mouseButton) {
        args.push(`--mouse=${binding.mouseButton}`);
    }
    else if (binding.key) {
        const macVk = (0, macos_key_codes_1.macVirtualKeyForToken)(binding.key);
        if (macVk === undefined) {
            return { error: `Unsupported key for macOS shortcut (${binding.key}).` };
        }
        args.push(`--key=${macVk}`);
    }
    if (args.length === 0)
        return { error: "Chord binding is empty." };
    return args;
};
exports.macChordListenerArgs = macChordListenerArgs;
//# sourceMappingURL=chord-listener-args.js.map
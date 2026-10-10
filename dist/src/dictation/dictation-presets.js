"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingPresetId = exports.getDictationPresetOptions = void 0;
const hotkey_mouse_1 = require("./hotkey-mouse");
const dictation_binding_1 = require("./dictation-binding");
const MAC_ONLY = ["darwin"];
const WINDOWS_ONLY = ["win32"];
const BOTH = ["darwin", "win32"];
const PRESET_DEFS = [
    {
        binding: { type: "darwin-fn" },
        id: "fn",
        label: "Fn",
        platforms: MAC_ONLY,
    },
    {
        binding: { modifiers: ["ctrl", "meta"], type: "chord" },
        id: "ctrl-meta",
        label: "Ctrl + Cmd",
        platforms: MAC_ONLY,
    },
    {
        binding: { modifiers: ["ctrl", "meta"], type: "chord" },
        id: "ctrl-meta",
        label: "Ctrl + Win",
        platforms: WINDOWS_ONLY,
    },
    {
        binding: { modifiers: ["ctrl", "alt"], type: "chord" },
        id: "ctrl-alt",
        label: "Ctrl + Option",
        platforms: MAC_ONLY,
    },
    {
        binding: { modifiers: ["ctrl", "alt"], type: "chord" },
        id: "ctrl-alt",
        label: "Ctrl + Alt",
        platforms: WINDOWS_ONLY,
    },
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
        binding: { modifiers: ["ctrl", "shift"], type: "chord" },
        id: "ctrl-shift",
        label: "Ctrl + Shift",
        platforms: BOTH,
    },
    {
        binding: { modifiers: [], mouseButton: 4, type: "chord" },
        id: "mouse4",
        label: (0, hotkey_mouse_1.formatMouseLabel)(4),
        platforms: BOTH,
    },
    {
        binding: { modifiers: [], mouseButton: 5, type: "chord" },
        id: "mouse5",
        label: (0, hotkey_mouse_1.formatMouseLabel)(5),
        platforms: BOTH,
    },
];
const getDictationPresetOptions = (platform) => PRESET_DEFS.filter((definition) => definition.platforms.includes(platform)).map(({ binding, id, label }) => ({ binding, id, label }));
exports.getDictationPresetOptions = getDictationPresetOptions;
const findMatchingPresetId = (binding, platform) => {
    const normalized = (0, dictation_binding_1.normalizeDictationBinding)(binding, platform);
    for (const definition of PRESET_DEFS) {
        if (definition.platforms.includes(platform) &&
            (0, dictation_binding_1.dictationBindingsEqual)(definition.binding, normalized)) {
            return definition.id;
        }
    }
    return null;
};
exports.findMatchingPresetId = findMatchingPresetId;
//# sourceMappingURL=dictation-presets.js.map
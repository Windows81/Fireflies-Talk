"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.physicalModifierLabel = exports.macVirtualKeyForModifier = exports.modifierForPhysicalKey = exports.sortModifiers = exports.isModifierKeyId = exports.isModifierId = void 0;
const ALL_MODIFIERS = ["ctrl", "alt", "shift", "meta"];
const MODIFIER_BY_KEY = {
    "alt-left": "alt",
    "alt-right": "alt",
    "ctrl-left": "ctrl",
    "ctrl-right": "ctrl",
    "meta-left": "meta",
    "meta-right": "meta",
    "shift-left": "shift",
    "shift-right": "shift",
};
const MAC_VK_BY_MODIFIER_KEY = {
    "alt-left": 58,
    "alt-right": 61,
    "ctrl-left": 59,
    "ctrl-right": 62,
    "meta-left": 55,
    "meta-right": 54,
    "shift-left": 56,
    "shift-right": 60,
};
const MODIFIER_KEY_LABELS = {
    "alt-left": "Option",
    "alt-right": "Right Option",
    "ctrl-left": "Control",
    "ctrl-right": "Right Control",
    "meta-left": "Command",
    "meta-right": "Right Command",
    "shift-left": "Shift",
    "shift-right": "Right Shift",
};
const isModifierId = (value) => value === "alt" || value === "ctrl" || value === "meta" || value === "shift";
exports.isModifierId = isModifierId;
const isModifierKeyId = (value) => typeof value === "string" && value in MODIFIER_BY_KEY;
exports.isModifierKeyId = isModifierKeyId;
const sortModifiers = (modifiers) => ALL_MODIFIERS.filter((modifier) => modifiers.includes(modifier));
exports.sortModifiers = sortModifiers;
const modifierForPhysicalKey = (modifierKey) => MODIFIER_BY_KEY[modifierKey];
exports.modifierForPhysicalKey = modifierForPhysicalKey;
const macVirtualKeyForModifier = (modifierKey) => MAC_VK_BY_MODIFIER_KEY[modifierKey];
exports.macVirtualKeyForModifier = macVirtualKeyForModifier;
const physicalModifierLabel = (modifierKey) => MODIFIER_KEY_LABELS[modifierKey];
exports.physicalModifierLabel = physicalModifierLabel;
//# sourceMappingURL=shortcut-modifiers.js.map
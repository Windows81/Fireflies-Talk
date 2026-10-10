"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservedShortcutError = reservedShortcutError;
const dictation_binding_1 = require("./dictation-binding");
/**
 * Combinations the OS or near-universal apps already own. Binding dictation to
 * one would either shadow it or never fire.
 *
 * Only combinations the recorder can actually produce are listed: it captures
 * letters, digits, Space and F1-F12 alongside modifiers, so reserved entries
 * built on Tab, Esc, Delete, arrows, Home/End, Print Screen or punctuation are
 * unreachable by definition and left out.
 */
const MAC_RESERVED = [
    // Cmd + letter
    "Cmd+A",
    "Cmd+B",
    "Cmd+C",
    "Cmd+F",
    "Cmd+G",
    "Cmd+H",
    "Cmd+I",
    "Cmd+M",
    "Cmd+N",
    "Cmd+O",
    "Cmd+P",
    "Cmd+Q",
    "Cmd+R",
    "Cmd+S",
    "Cmd+T",
    "Cmd+U",
    "Cmd+V",
    "Cmd+W",
    "Cmd+X",
    "Cmd+Z",
    // Cmd + Shift
    "Cmd+Shift+3",
    "Cmd+Shift+4",
    "Cmd+Shift+5",
    "Cmd+Shift+F",
    "Cmd+Shift+G",
    "Cmd+Shift+Q",
    "Cmd+Shift+T",
    "Cmd+Shift+Z",
    // Spotlight and window management
    "Cmd+Space",
    "Cmd+Alt+Space",
    "Cmd+Ctrl+F",
    // Cmd + Option
    "Cmd+Alt+D",
    "Cmd+Alt+F",
    "Cmd+Alt+P",
    // Emacs-style text navigation macOS honours in every text field
    "Ctrl+A",
    "Ctrl+E",
    "Ctrl+K",
];
const WINDOWS_RESERVED = [
    // Ctrl + letter
    "Ctrl+A",
    "Ctrl+B",
    "Ctrl+C",
    "Ctrl+F",
    "Ctrl+G",
    "Ctrl+I",
    "Ctrl+K",
    "Ctrl+N",
    "Ctrl+O",
    "Ctrl+P",
    "Ctrl+R",
    "Ctrl+S",
    "Ctrl+T",
    "Ctrl+U",
    "Ctrl+V",
    "Ctrl+W",
    "Ctrl+X",
    "Ctrl+Y",
    "Ctrl+Z",
    "Ctrl+Shift+T",
    // Window and app switching
    "Alt+F4",
    "Shift+F3",
];
const MODIFIER_TOKENS = {
    alt: "alt",
    cmd: "meta",
    ctrl: "ctrl",
    meta: "meta",
    option: "alt",
    shift: "shift",
    win: "meta",
};
/** "Cmd+Shift+Z" -> "meta+shift|Z", matching a normalized binding's shape. */
function canonicalize(entry) {
    const parts = entry.split("+");
    const key = parts.pop();
    if (!key)
        return null;
    const modifiers = [];
    for (const part of parts) {
        const modifier = MODIFIER_TOKENS[part.toLowerCase()];
        if (!modifier)
            return null;
        modifiers.push(modifier);
    }
    return `${[...new Set(modifiers)].sort().join("+")}|${key.toUpperCase()}`;
}
function buildSet(entries) {
    const set = new Set();
    for (const entry of entries) {
        const canonical = canonicalize(entry);
        if (canonical)
            set.add(canonical);
    }
    return set;
}
const RESERVED_BY_PLATFORM = {
    darwin: buildSet(MAC_RESERVED),
    win32: buildSet(WINDOWS_RESERVED),
};
function canonicalizeBinding(binding) {
    if (binding.type !== "chord" || !binding.key)
        return null;
    // No OS reserves an Fn chord, and folding Fn away here would compare it
    // against the plain-modifier entries instead.
    if (binding.fn)
        return null;
    return `${[...binding.modifiers].sort().join("+")}|${binding.key.toUpperCase()}`;
}
/**
 * Returns a message naming the clash when the binding is reserved, else null.
 * Mouse buttons and modifier-only chords are never reserved.
 */
function reservedShortcutError(binding, platform) {
    const canonical = canonicalizeBinding(binding);
    if (!canonical)
        return null;
    const reserved = RESERVED_BY_PLATFORM[platform];
    if (!reserved?.has(canonical))
        return null;
    const label = (0, dictation_binding_1.formatDictationBindingLabel)(binding, {
        isMac: platform === "darwin",
    });
    const owner = platform === "darwin" ? "macOS" : "Windows";
    return `${label} is reserved by ${owner}. Try another combination.`;
}
//# sourceMappingURL=reserved-shortcuts.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const chordStarts = [];
const globeStarts = [];
const ignore = () => undefined;
node_test_1.mock.module("./globe-key-listener", {
    namedExports: {
        isGlobeKeyListenerRunning: () => false,
        isGlobeListenerPolishOnly: () => false,
        restoreLeftoverFnUsage: ignore,
        setGlobeCaptureMode: ignore,
        setGlobeHandsFreeKey: ignore,
        setGlobeHoldChord: ignore,
        startGlobeKeyListener: (_callbacks, options = {}) => {
            globeStarts.push({ polishOnly: options.polishOnly ?? false });
        },
        stopGlobeKeyListener: ignore,
    },
});
node_test_1.mock.module("./macos-chord-listener", {
    namedExports: {
        startMacosChordListener: (role, _callbacks, args) => {
            chordStarts.push({ args, role });
        },
        stopMacosChordListener: ignore,
    },
});
node_test_1.mock.module("./windows-key-listener", {
    namedExports: {
        startWindowsKeyListener: ignore,
        stopWindowsKeyListener: ignore,
    },
});
const warnings = [];
node_test_1.mock.module("electron-log", {
    namedExports: {
        error: ignore,
        warn: (message) => {
            warnings.push(message);
        },
    },
});
// Imported lazily, inside the tests, so the mocks above are already in place.
const loadListeners = () => import("./dictation-hotkey-listeners.js");
const callbacks = {
    onDown: ignore,
    onInterrupted: ignore,
    onShiftChange: ignore,
    onUp: ignore,
};
const fn = { type: "darwin-fn" };
const ctrlShiftP = {
    key: "P",
    modifiers: ["ctrl", "shift"],
    type: "chord",
};
async function start(dictation, polish) {
    chordStarts.length = 0;
    globeStarts.length = 0;
    const { startDictationHotkeyListeners } = await loadListeners();
    startDictationHotkeyListeners(dictation, null, null, polish, callbacks);
}
(0, node_test_1.test)("a chord polish runs on its own chord helper", async (t) => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });
    t.after(() => Object.defineProperty(process, "platform", platform));
    await start(fn, ctrlShiftP);
    strict_1.default.deepEqual(chordStarts, [
        { args: ["--ctrl", "--shift", "--key=35", "--exact-mods"], role: "polish" },
    ]);
    strict_1.default.deepEqual(globeStarts, [{ polishOnly: false }]);
});
(0, node_test_1.test)("a chord polish sharing a key with another shortcut stays off", async (t) => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });
    t.after(() => Object.defineProperty(process, "platform", platform));
    await start({ key: "P", modifiers: ["ctrl", "alt"], type: "chord" }, ctrlShiftP);
    strict_1.default.deepEqual(chordStarts.map(({ role }) => role), ["dictation"]);
    strict_1.default.match(warnings.at(-1) ?? "", /shares its key/);
});
(0, node_test_1.test)("an Fn polish keeps using the Fn listener", async (t) => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });
    t.after(() => Object.defineProperty(process, "platform", platform));
    await start({ modifiers: ["ctrl", "meta"], type: "chord" }, { functionRowAlias: true, key: "1", type: "darwin-fn" });
    strict_1.default.deepEqual(chordStarts.map(({ role }) => role), ["dictation"]);
    strict_1.default.deepEqual(globeStarts, [{ polishOnly: true }]);
});
(0, node_test_1.test)("polish changes restart the listeners only when a listener changes", async () => {
    const { polishChangeNeedsRestart } = await loadListeners();
    const ctrlCmd = {
        modifiers: ["ctrl", "meta"],
        type: "chord",
    };
    const fn1 = { key: "1", type: "darwin-fn" };
    const fn2 = { key: "2", type: "darwin-fn" };
    // Fn keys update live on the running Fn listener.
    strict_1.default.equal(polishChangeNeedsRestart(fn, null, fn1, fn2), false);
    // Fn dictation already runs the Fn listener, so gating an Fn polish is free.
    strict_1.default.equal(polishChangeNeedsRestart(fn, null, fn1, null), false);
    // With chord dictation, an Fn polish starts or stops its own Fn listener.
    strict_1.default.equal(polishChangeNeedsRestart(ctrlCmd, null, null, fn1), true);
    strict_1.default.equal(polishChangeNeedsRestart(ctrlCmd, null, fn1, null), true);
    // A chord polish has its own helper: moving to, from or between chords, or
    // the polish flag turning it off, restarts; re-sending the same chord does not.
    strict_1.default.equal(polishChangeNeedsRestart(fn, null, fn1, ctrlShiftP), true);
    strict_1.default.equal(polishChangeNeedsRestart(fn, null, ctrlShiftP, fn1), true);
    strict_1.default.equal(polishChangeNeedsRestart(fn, null, ctrlShiftP, null), true);
    strict_1.default.equal(polishChangeNeedsRestart(fn, null, ctrlShiftP, {
        key: "O",
        modifiers: ["ctrl", "shift"],
        type: "chord",
    }), true);
    strict_1.default.equal(polishChangeNeedsRestart(fn, null, ctrlShiftP, { ...ctrlShiftP }), false);
});
//# sourceMappingURL=dictation-hotkey-listeners.test.js.map
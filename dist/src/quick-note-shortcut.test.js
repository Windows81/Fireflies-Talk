"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const registered = [];
const registerCalls = [];
const unregistered = [];
const persistedWrites = [];
const warnings = [];
let registerResult = true;
let persistedValue = null;
node_test_1.mock.module("electron", {
    namedExports: {
        app: { on: () => undefined, getPath: () => "/nonexistent" },
        globalShortcut: {
            register: (accelerator) => {
                registerCalls.push(accelerator);
                if (registerResult)
                    registered.push(accelerator);
                return registerResult;
            },
            unregister: (accelerator) => {
                unregistered.push(accelerator);
            },
            unregisterAll: () => undefined,
        },
    },
});
node_test_1.mock.module("electron-log", {
    namedExports: {
        warn: (message) => {
            warnings.push(message);
            return undefined;
        },
        error: () => undefined,
        info: () => undefined,
        debug: () => undefined,
        verbose: () => undefined,
    },
});
node_test_1.mock.module("./windowing", {
    namedExports: {
        mainWindow: null,
        showMainWindow: () => undefined,
    },
});
node_test_1.mock.module("./quick-note-shortcut-store", {
    namedExports: {
        isValidQuickNoteKey: (value) => typeof value === "string" &&
            value.toUpperCase().length === 1 &&
            value.toUpperCase() >= "A" &&
            value.toUpperCase() <= "Z",
        readQuickNoteShortcut: () => persistedValue,
        writeQuickNoteShortcut: (value) => {
            persistedWrites.push(value);
        },
    },
});
const loadShortcut = () => import("./quick-note-shortcut.js");
(0, node_test_1.test)("setup registers a persisted shortcut without a renderer push", async () => {
    const { setupQuickNoteShortcut } = await loadShortcut();
    persistedValue = { enabled: true, key: "P" };
    setupQuickNoteShortcut();
    strict_1.default.deepEqual(registered, ["CommandOrControl+Alt+P"]);
});
(0, node_test_1.test)("setup without a file registers nothing", async () => {
    const { setupQuickNoteShortcut } = await loadShortcut();
    persistedValue = null;
    registered.length = 0;
    setupQuickNoteShortcut();
    strict_1.default.deepEqual(registered, []);
});
(0, node_test_1.test)("a renderer push registers the key and persists it normalized", async () => {
    const { setQuickNoteShortcut, getQuickNoteShortcutState } = await loadShortcut();
    persistedValue = null;
    registered.length = 0;
    unregistered.length = 0;
    persistedWrites.length = 0;
    strict_1.default.equal(setQuickNoteShortcut(true, "n"), true);
    strict_1.default.deepEqual(unregistered, ["CommandOrControl+Alt+P"]);
    strict_1.default.deepEqual(registered, ["CommandOrControl+Alt+N"]);
    strict_1.default.deepEqual(persistedWrites, [{ enabled: true, key: "N" }]);
    strict_1.default.deepEqual(getQuickNoteShortcutState(), { enabled: true, key: "N" });
});
(0, node_test_1.test)("an identical push is a no-op for the OS shortcut", async () => {
    const { setQuickNoteShortcut } = await loadShortcut();
    registered.length = 0;
    unregistered.length = 0;
    persistedWrites.length = 0;
    strict_1.default.equal(setQuickNoteShortcut(true, "n"), true);
    strict_1.default.deepEqual(registered, []);
    strict_1.default.deepEqual(unregistered, []);
    strict_1.default.deepEqual(persistedWrites, []);
});
(0, node_test_1.test)("an identical push retries a failed startup registration", async () => {
    const { setupQuickNoteShortcut, setQuickNoteShortcut } = await loadShortcut();
    persistedValue = { enabled: true, key: "P" };
    registerCalls.length = 0;
    registerResult = false;
    setupQuickNoteShortcut();
    strict_1.default.deepEqual(registerCalls, ["CommandOrControl+Alt+P"]);
    // The OS freed the accelerator in the meantime; the renderer's identical
    // push must retry rather than stop at the idempotency guard.
    registerResult = true;
    strict_1.default.equal(setQuickNoteShortcut(true, "P"), true);
    strict_1.default.deepEqual(registerCalls, [
        "CommandOrControl+Alt+P",
        "CommandOrControl+Alt+P",
    ]);
    // Once the accelerator is actually held, the same push is a no-op again.
    strict_1.default.equal(setQuickNoteShortcut(true, "P"), true);
    strict_1.default.equal(registerCalls.length, 2);
});
(0, node_test_1.test)("an invalid key is refused without touching the OS shortcut", async () => {
    const { setQuickNoteShortcut, getQuickNoteShortcutState } = await loadShortcut();
    registered.length = 0;
    persistedWrites.length = 0;
    strict_1.default.equal(setQuickNoteShortcut(true, "ń"), false);
    strict_1.default.deepEqual(registered, []);
    strict_1.default.deepEqual(persistedWrites, []);
    strict_1.default.deepEqual(getQuickNoteShortcutState(), { enabled: true, key: "P" });
});
(0, node_test_1.test)("a failed registration still persists but warns", async () => {
    const { setQuickNoteShortcut, getQuickNoteShortcutState } = await loadShortcut();
    registered.length = 0;
    persistedWrites.length = 0;
    warnings.length = 0;
    registerResult = false;
    strict_1.default.equal(setQuickNoteShortcut(true, "Q"), true);
    strict_1.default.deepEqual(registered, []);
    strict_1.default.deepEqual(persistedWrites, [{ enabled: true, key: "Q" }]);
    strict_1.default.deepEqual(getQuickNoteShortcutState(), { enabled: true, key: "Q" });
    strict_1.default.ok(warnings.some((message) => message.includes("Failed to register global shortcut")));
});
//# sourceMappingURL=quick-note-shortcut.test.js.map
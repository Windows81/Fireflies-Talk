"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const node_test_1 = require("node:test");
node_test_1.mock.module("electron", {
    namedExports: {
        app: { getPath: () => "/nonexistent" },
    },
});
node_test_1.mock.module("electron-log", {
    namedExports: {
        warn: () => undefined,
        error: () => undefined,
        info: () => undefined,
        debug: () => undefined,
        verbose: () => undefined,
    },
});
const loadStore = () => import("./quick-note-shortcut-store.js");
(0, node_test_1.test)("isValidQuickNoteKey accepts a single ASCII letter", async () => {
    const { isValidQuickNoteKey } = await loadStore();
    strict_1.default.equal(isValidQuickNoteKey("N"), true);
    strict_1.default.equal(isValidQuickNoteKey("n"), true);
    strict_1.default.equal(isValidQuickNoteKey("7"), false);
    strict_1.default.equal(isValidQuickNoteKey(""), false);
    strict_1.default.equal(isValidQuickNoteKey("NN"), false);
    strict_1.default.equal(isValidQuickNoteKey("ń"), false);
    strict_1.default.equal(isValidQuickNoteKey(undefined), false);
});
(0, node_test_1.test)("read returns null when the file is missing", async () => {
    const { readQuickNoteShortcut } = await loadStore();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qns-store-"));
    strict_1.default.equal(readQuickNoteShortcut(path.join(dir, "missing.json")), null);
});
(0, node_test_1.test)("write then read round-trips the shortcut", async () => {
    const { readQuickNoteShortcut, writeQuickNoteShortcut } = await loadStore();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qns-store-"));
    const filePath = path.join(dir, "quick-note-shortcut.json");
    writeQuickNoteShortcut({ enabled: true, key: "p" }, filePath);
    strict_1.default.deepEqual(readQuickNoteShortcut(filePath), {
        enabled: true,
        key: "P",
    });
});
(0, node_test_1.test)("read returns null for corrupt JSON", async () => {
    const { readQuickNoteShortcut } = await loadStore();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qns-store-"));
    const filePath = path.join(dir, "quick-note-shortcut.json");
    fs.writeFileSync(filePath, "{not json", "utf8");
    strict_1.default.equal(readQuickNoteShortcut(filePath), null);
});
(0, node_test_1.test)("read returns null for an invalid key", async () => {
    const { readQuickNoteShortcut } = await loadStore();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qns-store-"));
    const filePath = path.join(dir, "quick-note-shortcut.json");
    fs.writeFileSync(filePath, JSON.stringify({ enabled: true, key: "ń" }), "utf8");
    strict_1.default.equal(readQuickNoteShortcut(filePath), null);
});
//# sourceMappingURL=quick-note-shortcut-store.test.js.map
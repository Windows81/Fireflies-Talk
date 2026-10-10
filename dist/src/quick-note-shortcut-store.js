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
exports.isValidQuickNoteKey = isValidQuickNoteKey;
exports.readQuickNoteShortcut = readQuickNoteShortcut;
exports.writeQuickNoteShortcut = writeQuickNoteShortcut;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const SHORTCUT_FILE = "quick-note-shortcut.json";
function getStatePath() {
    return path.join(electron_1.app.getPath("userData"), SHORTCUT_FILE);
}
function isValidQuickNoteKey(value) {
    if (typeof value !== "string")
        return false;
    const normalized = value.toUpperCase();
    return normalized.length === 1 && normalized >= "A" && normalized <= "Z";
}
function readQuickNoteShortcut(filePath = getStatePath()) {
    try {
        if (!fs.existsSync(filePath))
            return null;
        const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (typeof raw.enabled !== "boolean" || !isValidQuickNoteKey(raw.key)) {
            return null;
        }
        return { enabled: raw.enabled, key: raw.key.toUpperCase() };
    }
    catch (error) {
        electron_log_1.default.warn("[QuickNote] Failed to read shortcut settings", error);
        return null;
    }
}
function writeQuickNoteShortcut(value, filePath = getStatePath()) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(value), "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[QuickNote] Failed to persist shortcut settings", error);
    }
}
//# sourceMappingURL=quick-note-shortcut-store.js.map
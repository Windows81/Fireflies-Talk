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
exports.getSavedDictationShortcuts = getSavedDictationShortcuts;
exports.setSavedDictationShortcuts = setSavedDictationShortcuts;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const action_binding_1 = require("./action-binding");
const dictation_binding_1 = require("./dictation-binding");
const hands_free_binding_1 = require("./hands-free-binding");
const dictation_shortcut_persist_1 = require("./dictation-shortcut-persist");
const polish_binding_1 = require("./polish-binding");
const SHORTCUTS_FILE = "dictation-shortcuts.json";
function getShortcutsPath() {
    return path.join(electron_1.app.getPath("userData"), SHORTCUTS_FILE);
}
function getSavedDictationShortcuts(platform) {
    try {
        const shortcutsPath = getShortcutsPath();
        if (!fs.existsSync(shortcutsPath))
            return null;
        const raw = JSON.parse(fs.readFileSync(shortcutsPath, "utf8"));
        if (raw == null || Array.isArray(raw) || !(raw instanceof Object)) {
            return null;
        }
        if (!("dictation" in raw) ||
            raw.dictation == null ||
            Array.isArray(raw.dictation) ||
            !(raw.dictation instanceof Object) ||
            !("type" in raw.dictation)) {
            return null;
        }
        const file = {
            action: !("action" in raw)
                ? undefined
                : raw.action === null
                    ? null
                    : (0, action_binding_1.normalizeActionBinding)(raw.action, platform),
            dictation: (0, dictation_binding_1.normalizeDictationBinding)(raw.dictation, platform),
            handsFree: !("handsFree" in raw)
                ? undefined
                : raw.handsFree === null
                    ? null
                    : (0, hands_free_binding_1.normalizeHandsFreeBinding)(raw.handsFree, platform),
            polish: !("polish" in raw)
                ? undefined
                : (0, polish_binding_1.normalizePolishBinding)(raw.polish, platform),
        };
        return (0, dictation_shortcut_persist_1.parseSavedDictationShortcuts)(file, platform);
    }
    catch (error) {
        electron_log_1.default.warn("[Dictation] Failed to read saved shortcuts", error);
        return null;
    }
}
function setSavedDictationShortcuts(shortcuts) {
    try {
        fs.writeFileSync(getShortcutsPath(), JSON.stringify(shortcuts), "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[Dictation] Failed to persist shortcuts", error);
    }
}
//# sourceMappingURL=dictation-shortcut-store.js.map
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
exports.getSavedDictationPillDock = getSavedDictationPillDock;
exports.setSavedDictationPillDock = setSavedDictationPillDock;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_pill_dock_1 = require("./dictation-pill-dock");
const DOCK_FILE = "dictation-pill-dock.json";
function getDockPath() {
    return path.join(electron_1.app.getPath("userData"), DOCK_FILE);
}
function getSavedDictationPillDock() {
    try {
        const dockPath = getDockPath();
        if (!fs.existsSync(dockPath))
            return null;
        return (0, dictation_pill_dock_1.parseSavedDictationPillDock)(JSON.parse(fs.readFileSync(dockPath, "utf8")));
    }
    catch (error) {
        electron_log_1.default.warn("[DictationPill] Failed to read saved dock", error);
        return null;
    }
}
function setSavedDictationPillDock(side, displayId, anchor, x, y) {
    try {
        const payload = { side };
        if (displayId !== undefined)
            payload.displayId = displayId;
        if (anchor !== undefined)
            payload.anchor = anchor;
        if (x !== undefined)
            payload.x = x;
        if (y !== undefined)
            payload.y = y;
        fs.writeFileSync(getDockPath(), JSON.stringify(payload), "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[DictationPill] Failed to persist dock", error);
    }
}
//# sourceMappingURL=dictation-pill-dock-store.js.map
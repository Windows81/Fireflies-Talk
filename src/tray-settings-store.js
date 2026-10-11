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
exports.getShowNextEvent = getShowNextEvent;
exports.setShowNextEvent = setShowNextEvent;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const SETTINGS_FILE = "tray-settings.json";
const DEFAULTS = { showNextEvent: true };
function getSettingsPath() {
    return path.join(electron_1.app.getPath("userData"), SETTINGS_FILE);
}
function readSettings() {
    try {
        const p = getSettingsPath();
        if (!fs.existsSync(p))
            return { ...DEFAULTS };
        const raw = JSON.parse(fs.readFileSync(p, "utf8"));
        return {
            showNextEvent: typeof raw.showNextEvent === "boolean"
                ? raw.showNextEvent
                : DEFAULTS.showNextEvent,
        };
    }
    catch (error) {
        electron_log_1.default.warn("[TRAY] Failed to read tray settings", error);
        return { ...DEFAULTS };
    }
}
function writeSettings(settings) {
    try {
        fs.writeFileSync(getSettingsPath(), JSON.stringify(settings), "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[TRAY] Failed to persist tray settings", error);
    }
}
function getShowNextEvent() {
    return readSettings().showNextEvent;
}
function setShowNextEvent(value) {
    const settings = readSettings();
    settings.showNextEvent = value;
    writeSettings(settings);
}
//# sourceMappingURL=tray-settings-store.js.map
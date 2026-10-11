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
exports.getPreferredLiveViewMode = getPreferredLiveViewMode;
exports.setPreferredLiveViewMode = setPreferredLiveViewMode;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
// Persists the live view mode the user last explicitly selected (compact bar
// vs full realtime window) so the next meeting / opened notes restore it.
const PREFERRED_LIVE_VIEW_MODE_FILE = "preferred-live-view-mode";
function getStatePath() {
    return path.join(electron_1.app.getPath("userData"), PREFERRED_LIVE_VIEW_MODE_FILE);
}
/**
 * The mode the user last explicitly selected, or null when they never chose one.
 * Callers apply their own default for null, since the neutral starting view
 * differs between the one-window model (full) and the legacy floating live
 * window (compact bar).
 */
function getPreferredLiveViewMode() {
    try {
        const statePath = getStatePath();
        if (!fs.existsSync(statePath))
            return null;
        const value = fs.readFileSync(statePath, "utf8").trim();
        if (value === "full" || value === "compact")
            return value;
        return null;
    }
    catch (error) {
        electron_log_1.default.warn("[LIVEVIEW] Failed to read preferred live view mode", error);
        return null;
    }
}
function setPreferredLiveViewMode(mode) {
    try {
        fs.writeFileSync(getStatePath(), mode, "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[LIVEVIEW] Failed to persist preferred live view mode", error);
    }
}
//# sourceMappingURL=live-view-mode-store.js.map
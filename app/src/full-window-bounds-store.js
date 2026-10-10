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
exports.saveFullWindowBounds = saveFullWindowBounds;
exports.getSavedFullWindowBounds = getSavedFullWindowBounds;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const FULL_WINDOW_BOUNDS_FILE = "live-full-window-bounds.json";
function getFullWindowBoundsPath() {
    return path.join(electron_1.app.getPath("userData"), FULL_WINDOW_BOUNDS_FILE);
}
function saveFullWindowBounds(bounds) {
    try {
        fs.writeFileSync(getFullWindowBoundsPath(), JSON.stringify({
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
        }), "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[WINDOWING] Failed to persist full window bounds", error);
    }
}
function getSavedFullWindowBounds() {
    try {
        const statePath = getFullWindowBoundsPath();
        if (!fs.existsSync(statePath))
            return null;
        const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
        // Width/height must be positive; x/y may be negative (multi-monitor layouts).
        if (!isPositive(parsed.width) ||
            !isPositive(parsed.height) ||
            !isFiniteNumber(parsed.x) ||
            !isFiniteNumber(parsed.y)) {
            return null;
        }
        return {
            x: Math.round(parsed.x),
            y: Math.round(parsed.y),
            width: Math.round(parsed.width),
            height: Math.round(parsed.height),
        };
    }
    catch (error) {
        electron_log_1.default.warn("[WINDOWING] Failed to read full window bounds", error);
        return null;
    }
}
function isPositive(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
//# sourceMappingURL=full-window-bounds-store.js.map
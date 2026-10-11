"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canReadMacLeftMouseButton = canReadMacLeftMouseButton;
exports.isMacLeftMouseDown = isMacLeftMouseDown;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
let cached;
function loadNative() {
    if (cached !== undefined)
        return cached;
    if (process.platform !== "darwin") {
        cached = null;
        return null;
    }
    const expectedDir = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, "native-keyboard-macos")
        : path_1.default.join(__dirname, "../../../native-keyboard-macos");
    const fullPath = path_1.default.resolve(path_1.default.join(expectedDir, "index.js"));
    const normalizedDir = path_1.default.resolve(expectedDir);
    const isInsideModule = fullPath.startsWith(normalizedDir + path_1.default.sep) && fs_1.default.existsSync(fullPath);
    if (!isInsideModule) {
        cached = null;
        return null;
    }
    try {
        // Native addon path is resolved at runtime (packaged vs dev).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        cached = require(fullPath);
        return cached;
    }
    catch (error) {
        electron_log_1.default.warn("[DictationPill] Failed to load macOS mouse-button helper", {
            error: String(error),
        });
        cached = null;
        return null;
    }
}
function canReadMacLeftMouseButton() {
    return typeof loadNative()?.isLeftMouseDown === "function";
}
function isMacLeftMouseDown() {
    return loadNative()?.isLeftMouseDown?.() === true;
}
//# sourceMappingURL=macos-left-mouse.js.map
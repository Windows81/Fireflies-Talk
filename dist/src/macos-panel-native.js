"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPanelNative = loadPanelNative;
const electron_log_1 = __importDefault(require("electron-log"));
const secure_require_1 = require("./secure-require");
const MODULE_NAME = "native-spaces-macos";
let native;
/** The addon, or null when it is missing (e.g. a dev checkout without it built). */
function loadPanelNative() {
    if (native !== undefined)
        return native;
    try {
        const loaded = (0, secure_require_1.secureRequire)(MODULE_NAME);
        native = loaded.isAvailable ? loaded : null;
    }
    catch (error) {
        electron_log_1.default.warn("[PanelNative] Native addon unavailable", error);
        native = null;
    }
    return native;
}
//# sourceMappingURL=macos-panel-native.js.map
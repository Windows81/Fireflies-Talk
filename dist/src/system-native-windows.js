"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWindowsSystemNative = getWindowsSystemNative;
const electron_log_1 = __importDefault(require("electron-log"));
const secure_require_1 = require("./secure-require");
let systemNative;
/** Null off Windows or when the addon failed to load. */
function getWindowsSystemNative() {
    if (process.platform !== "win32")
        return null;
    if (systemNative !== undefined)
        return systemNative;
    try {
        const addon = (0, secure_require_1.secureRequire)("native-system-windows");
        systemNative = addon.isAvailable() ? addon : null;
        if (!systemNative) {
            electron_log_1.default.warn("[SystemNative] Windows addon unavailable");
        }
    }
    catch (error) {
        electron_log_1.default.warn("[SystemNative] Failed to load Windows addon:", error);
        systemNative = null;
    }
    return systemNative;
}
//# sourceMappingURL=system-native-windows.js.map
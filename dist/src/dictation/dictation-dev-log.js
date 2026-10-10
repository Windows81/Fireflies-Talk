"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDictationDev = logDictationDev;
const electron_log_1 = __importDefault(require("electron-log"));
const utils_1 = require("../utils");
// Electron main has no Metro `__DEV__`. `isDev()` is the equivalent.
function logDictationDev(message) {
    if ((0, utils_1.isDev)())
        electron_log_1.default.info(message);
}
//# sourceMappingURL=dictation-dev-log.js.map
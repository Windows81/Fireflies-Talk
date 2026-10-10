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
exports.getScreenContextMacOS = getScreenContextMacOS;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const path = __importStar(require("node:path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_screen_context_macos_parse_1 = require("./dictation-screen-context-macos-parse");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const WINDOW_TEXT_READER_BINARY = "macos-window-text-reader";
function getWindowTextReaderPath() {
    return electron_1.app.isPackaged
        ? path.join(process.resourcesPath, "bin", WINDOW_TEXT_READER_BINARY)
        : path.join(__dirname, "..", "..", "..", "resources", "bin", WINDOW_TEXT_READER_BINARY);
}
async function getScreenContextMacOS() {
    try {
        const { stdout } = await execFileAsync(getWindowTextReaderPath(), [], {
            timeout: 8000,
            maxBuffer: 1024 * 1024,
        });
        return (0, dictation_screen_context_macos_parse_1.parseMacosScreenContext)(stdout);
    }
    catch (error) {
        const err = error;
        electron_log_1.default.warn(`[Dictation] Failed to read screen context (code ${err.code}): ${err.stderr || err.message}`);
        return null;
    }
}
//# sourceMappingURL=dictation-screen-context-macos.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeWindowsHwnd = sanitizeWindowsHwnd;
exports.parseWindowsScreenContext = parseWindowsScreenContext;
exports.getScreenContextWindows = getScreenContextWindows;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_site_url_1 = require("./dictation-site-url");
const resource_bin_1 = require("./resource-bin");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
// Native reader (native-screen-context-windows/), never a script: a hidden
// PowerShell helper here was flagged as malware by CrowdStrike in Sept 2026.
const BINARY_NAME = "windows-screen-context.exe";
const READ_TIMEOUT_MS = 8000;
// The reader takes a decimal HWND; "0" means the foreground window.
function sanitizeWindowsHwnd(hwnd) {
    return hwnd && /^[0-9]+$/.test(hwnd) ? hwnd : "0";
}
function parseWindowsScreenContext(stdout) {
    const trimmed = stdout.trim();
    if (!trimmed)
        return null;
    try {
        const parsed = JSON.parse(trimmed);
        const appName = parsed.appName?.trim() ?? "";
        if (!appName)
            return null;
        const windowTitle = parsed.windowTitle?.trim() ?? "";
        const visibleText = parsed.visibleText?.trim();
        return {
            appName,
            windowTitle,
            visibleText: visibleText || undefined,
            siteUrl: (0, dictation_site_url_1.normalizeSiteUrl)(parsed.siteUrl),
        };
    }
    catch {
        return null;
    }
}
async function getScreenContextWindows(hwnd) {
    try {
        const { stdout } = await execFileAsync((0, resource_bin_1.resourcesBinPath)(BINARY_NAME), [sanitizeWindowsHwnd(hwnd)], {
            timeout: READ_TIMEOUT_MS,
            windowsHide: true,
            maxBuffer: 1024 * 1024,
        });
        return parseWindowsScreenContext(stdout);
    }
    catch (error) {
        const err = error;
        electron_log_1.default.warn(`[Dictation] Failed to read Windows screen context (code ${err.code}, signal ${err.signal}, killed ${err.killed}): ${err.stderr || err.message}`);
        return null;
    }
}
//# sourceMappingURL=dictation-screen-context-windows.js.map
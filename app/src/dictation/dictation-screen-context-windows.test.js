"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_screen_context_windows_1 = require("./dictation-screen-context-windows");
(0, node_test_1.test)("parseWindowsScreenContext includes siteUrl", () => {
    const parsed = (0, dictation_screen_context_windows_1.parseWindowsScreenContext)(JSON.stringify({
        appName: "chrome",
        windowTitle: "Inbox",
        visibleText: "To: sam@example.com",
        siteUrl: " https://mail.google.com/mail/u/0/#inbox ",
    }));
    strict_1.default.deepEqual(parsed, {
        appName: "chrome",
        windowTitle: "Inbox",
        visibleText: "To: sam@example.com",
        siteUrl: "https://mail.google.com/mail/u/0/#inbox",
    });
});
(0, node_test_1.test)("parseWindowsScreenContext omits empty siteUrl", () => {
    const parsed = (0, dictation_screen_context_windows_1.parseWindowsScreenContext)(JSON.stringify({
        appName: "Slack",
        windowTitle: "general",
        siteUrl: "  ",
    }));
    strict_1.default.deepEqual(parsed, {
        appName: "Slack",
        windowTitle: "general",
        visibleText: undefined,
        siteUrl: undefined,
    });
});
(0, node_test_1.test)("parseWindowsScreenContext treats the reader's nulls as no context", () => {
    const nulls = JSON.stringify({
        appName: null,
        windowTitle: null,
        visibleText: null,
        siteUrl: null,
    });
    strict_1.default.equal((0, dictation_screen_context_windows_1.parseWindowsScreenContext)(nulls), null);
    strict_1.default.equal((0, dictation_screen_context_windows_1.parseWindowsScreenContext)(""), null);
    strict_1.default.equal((0, dictation_screen_context_windows_1.parseWindowsScreenContext)("not json"), null);
});
(0, node_test_1.test)("sanitizeWindowsHwnd keeps decimal hwnds and rejects junk", () => {
    strict_1.default.equal((0, dictation_screen_context_windows_1.sanitizeWindowsHwnd)("4331026"), "4331026");
    strict_1.default.equal((0, dictation_screen_context_windows_1.sanitizeWindowsHwnd)("0"), "0");
    strict_1.default.equal((0, dictation_screen_context_windows_1.sanitizeWindowsHwnd)(undefined), "0");
    strict_1.default.equal((0, dictation_screen_context_windows_1.sanitizeWindowsHwnd)("hwnd:12"), "0");
    strict_1.default.equal((0, dictation_screen_context_windows_1.sanitizeWindowsHwnd)("-12"), "0");
});
//# sourceMappingURL=dictation-screen-context-windows.test.js.map
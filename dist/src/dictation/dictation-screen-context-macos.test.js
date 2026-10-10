"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_screen_context_macos_parse_1 = require("./dictation-screen-context-macos-parse");
(0, node_test_1.test)("parseMacosScreenContext reads AX JSON including siteUrl", () => {
    strict_1.default.deepEqual((0, dictation_screen_context_macos_parse_1.parseMacosScreenContext)(JSON.stringify({
        appName: "Google Chrome",
        windowTitle: "Inbox",
        visibleText: "Hello",
        siteUrl: " https://mail.google.com ",
    })), {
        appName: "Google Chrome",
        windowTitle: "Inbox",
        visibleText: "Hello",
        siteUrl: "https://mail.google.com",
    });
});
(0, node_test_1.test)("parseMacosScreenContext drops empty app names and invalid JSON", () => {
    strict_1.default.equal((0, dictation_screen_context_macos_parse_1.parseMacosScreenContext)("{"), null);
    strict_1.default.equal((0, dictation_screen_context_macos_parse_1.parseMacosScreenContext)(JSON.stringify({ appName: "  " })), null);
});
//# sourceMappingURL=dictation-screen-context-macos.test.js.map
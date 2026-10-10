"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_test_1 = require("node:test");
const dictation_pill_context_menu_1 = require("./dictation-pill-context-menu");
(0, node_test_1.test)("prevents the Windows system menu and Chromium page menu", () => {
    const win = new node_events_1.EventEmitter();
    const webContents = new node_events_1.EventEmitter();
    (0, dictation_pill_context_menu_1.suppressDictationPillContextMenus)(win, webContents);
    const systemEvent = {
        prevented: false,
        preventDefault() {
            this.prevented = true;
        },
    };
    const pageEvent = {
        prevented: false,
        preventDefault() {
            this.prevented = true;
        },
    };
    win.emit("system-context-menu", systemEvent);
    webContents.emit("context-menu", pageEvent);
    strict_1.default.equal(systemEvent.prevented, true);
    strict_1.default.equal(pageEvent.prevented, true);
});
//# sourceMappingURL=dictation-pill-context-menu.test.js.map
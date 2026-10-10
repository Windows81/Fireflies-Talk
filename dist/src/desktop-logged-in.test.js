"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const desktop_logged_in_1 = require("./desktop-logged-in");
function resetLoggedIn() {
    (0, desktop_logged_in_1.onDesktopLoggedInChange)(() => { });
    (0, desktop_logged_in_1.setDesktopLoggedIn)(false);
}
(0, node_test_1.test)("starts logged out and ignores a repeat false", () => {
    resetLoggedIn();
    const calls = { count: 0 };
    (0, desktop_logged_in_1.onDesktopLoggedInChange)(() => {
        calls.count += 1;
    });
    strict_1.default.equal((0, desktop_logged_in_1.isDesktopLoggedIn)(), false);
    strict_1.default.equal((0, desktop_logged_in_1.setDesktopLoggedIn)(false), false);
    strict_1.default.equal(calls.count, 0);
});
(0, node_test_1.test)("notifies only when login state changes", () => {
    resetLoggedIn();
    const calls = { count: 0 };
    (0, desktop_logged_in_1.onDesktopLoggedInChange)(() => {
        calls.count += 1;
    });
    strict_1.default.equal((0, desktop_logged_in_1.setDesktopLoggedIn)(true), true);
    strict_1.default.equal((0, desktop_logged_in_1.isDesktopLoggedIn)(), true);
    strict_1.default.equal(calls.count, 1);
    strict_1.default.equal((0, desktop_logged_in_1.setDesktopLoggedIn)(true), false);
    strict_1.default.equal(calls.count, 1);
    strict_1.default.equal((0, desktop_logged_in_1.setDesktopLoggedIn)(false), true);
    strict_1.default.equal((0, desktop_logged_in_1.isDesktopLoggedIn)(), false);
    strict_1.default.equal(calls.count, 2);
});
(0, node_test_1.test)("accepts a sentry user from the main window", () => {
    const webContents = { id: 1 };
    const window = {
        isDestroyed: () => false,
        webContents,
    };
    strict_1.default.equal((0, desktop_logged_in_1.isMainDesktopLoginSender)(webContents, window), true);
});
(0, node_test_1.test)("ignores a sentry user from another window once main exists", () => {
    const window = {
        isDestroyed: () => false,
        webContents: { id: 1 },
    };
    strict_1.default.equal((0, desktop_logged_in_1.isMainDesktopLoginSender)({ id: 2 }, window), false);
});
(0, node_test_1.test)("accepts a sentry user before main exists or after it is destroyed", () => {
    const sender = { id: 2 };
    strict_1.default.equal((0, desktop_logged_in_1.isMainDesktopLoginSender)(sender, null), true);
    strict_1.default.equal((0, desktop_logged_in_1.isMainDesktopLoginSender)(sender, {
        isDestroyed: () => true,
        webContents: { id: 1 },
    }), true);
});
//# sourceMappingURL=desktop-logged-in.test.js.map
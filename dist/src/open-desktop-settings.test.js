"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_test_1 = require("node:test");
const application_menu_template_1 = require("./application-menu-template");
const open_desktop_settings_1 = require("./open-desktop-settings");
function createMockWindow(options) {
    const destroyed = { current: options?.destroyed ?? false };
    const sent = [];
    const skipTaskbar = [];
    const calls = { restore: 0, show: 0, focus: 0 };
    const load = new node_events_1.EventEmitter();
    const window = {
        isDestroyed: () => destroyed.current,
        isMinimized: () => options?.minimized ?? false,
        restore: () => {
            calls.restore += 1;
        },
        setSkipTaskbar: (skip) => {
            skipTaskbar.push(skip);
        },
        show: () => {
            calls.show += 1;
        },
        focus: () => {
            calls.focus += 1;
        },
        webContents: {
            isLoading: () => options?.loading ?? false,
            once: (event, listener) => {
                load.once(event, listener);
            },
            send: (channel, route) => {
                sent.push([channel, route]);
            },
        },
    };
    return { window, destroyed, sent, skipTaskbar, calls, load };
}
function createOpen(options) {
    return (0, open_desktop_settings_1.createOpenDesktopSettings)({
        isLoggedIn: () => true,
        ...options,
    });
}
function assertRevealed(mock, restored) {
    strict_1.default.equal(mock.calls.restore, restored ? 1 : 0);
    strict_1.default.deepEqual(mock.skipTaskbar, [false]);
    strict_1.default.equal(mock.calls.show, 1);
    strict_1.default.equal(mock.calls.focus, 1);
}
(0, node_test_1.test)("a minimized window restores, then shows, focuses, and navigates", () => {
    const mock = createMockWindow({ minimized: true });
    const createWindowCalls = { count: 0 };
    const openDesktopSettings = createOpen({
        getMainWindow: () => mock.window,
        createWindow: () => {
            createWindowCalls.count += 1;
        },
    });
    openDesktopSettings();
    strict_1.default.equal(createWindowCalls.count, 0);
    assertRevealed(mock, true);
    strict_1.default.equal(mock.load.listenerCount("did-finish-load"), 0);
    strict_1.default.deepEqual(mock.sent, [["navigate-to-route", "DesktopSettings"]]);
});
(0, node_test_1.test)("a visible window does not restore", () => {
    const mock = createMockWindow();
    const openDesktopSettings = createOpen({
        getMainWindow: () => mock.window,
        createWindow: () => {
            strict_1.default.fail();
        },
    });
    openDesktopSettings();
    assertRevealed(mock, false);
    strict_1.default.deepEqual(mock.sent, [["navigate-to-route", "DesktopSettings"]]);
});
(0, node_test_1.test)("a missing window calls createWindow and navigates if one appears", () => {
    const created = createMockWindow();
    const box = { current: null };
    const createWindowCalls = { count: 0 };
    const openDesktopSettings = createOpen({
        getMainWindow: () => box.current,
        createWindow: () => {
            createWindowCalls.count += 1;
            box.current = created.window;
        },
    });
    openDesktopSettings();
    strict_1.default.equal(createWindowCalls.count, 1);
    assertRevealed(created, false);
    strict_1.default.deepEqual(created.sent, [["navigate-to-route", "DesktopSettings"]]);
});
(0, node_test_1.test)("a destroyed window calls createWindow and navigates the replacement", () => {
    const first = createMockWindow({ destroyed: true });
    const second = createMockWindow();
    const box = { current: first.window };
    const createWindowCalls = { count: 0 };
    const openDesktopSettings = createOpen({
        getMainWindow: () => box.current,
        createWindow: () => {
            createWindowCalls.count += 1;
            box.current = second.window;
        },
    });
    openDesktopSettings();
    strict_1.default.equal(createWindowCalls.count, 1);
    strict_1.default.deepEqual(first.sent, []);
    assertRevealed(second, false);
    strict_1.default.deepEqual(second.sent, [["navigate-to-route", "DesktopSettings"]]);
});
(0, node_test_1.test)("a createWindow that produces no window does not navigate", () => {
    const createWindowCalls = { count: 0 };
    const openDesktopSettings = createOpen({
        getMainWindow: () => null,
        createWindow: () => {
            createWindowCalls.count += 1;
        },
    });
    openDesktopSettings();
    strict_1.default.equal(createWindowCalls.count, 1);
});
(0, node_test_1.test)("a still-loading window sends only after did-finish-load", () => {
    const mock = createMockWindow({ loading: true });
    const openDesktopSettings = createOpen({
        getMainWindow: () => mock.window,
        createWindow: () => {
            strict_1.default.fail();
        },
    });
    openDesktopSettings();
    assertRevealed(mock, false);
    strict_1.default.deepEqual(mock.sent, []);
    strict_1.default.equal(mock.load.listenerCount("did-finish-load"), 1);
    mock.load.emit("did-finish-load");
    strict_1.default.deepEqual(mock.sent, [["navigate-to-route", "DesktopSettings"]]);
});
(0, node_test_1.test)("a window destroyed after load does not send", () => {
    const mock = createMockWindow({ loading: true });
    const openDesktopSettings = createOpen({
        getMainWindow: () => mock.window,
        createWindow: () => {
            strict_1.default.fail();
        },
    });
    openDesktopSettings();
    mock.destroyed.current = true;
    mock.load.emit("did-finish-load");
    strict_1.default.deepEqual(mock.sent, []);
});
(0, node_test_1.test)("a logged-out click does not create or reveal a window", () => {
    const mock = createMockWindow();
    const createWindowCalls = { count: 0 };
    const openDesktopSettings = createOpen({
        getMainWindow: () => mock.window,
        createWindow: () => {
            createWindowCalls.count += 1;
        },
        isLoggedIn: () => false,
    });
    openDesktopSettings();
    strict_1.default.equal(createWindowCalls.count, 0);
    strict_1.default.equal(mock.calls.show, 0);
    strict_1.default.deepEqual(mock.sent, []);
});
(0, node_test_1.test)("a darwin app menu puts Settings with CmdOrCtrl+, after About when logged in", () => {
    const openDesktopSettings = () => { };
    const submenu = (0, application_menu_template_1.buildDarwinAppSubmenu)(openDesktopSettings, true);
    strict_1.default.equal(submenu[0]?.role, "about");
    strict_1.default.equal(submenu[1]?.type, "separator");
    strict_1.default.equal(submenu[2]?.label, "Settings");
    strict_1.default.equal(submenu[2]?.accelerator, "CmdOrCtrl+,");
    strict_1.default.equal(submenu[2]?.click, openDesktopSettings);
    strict_1.default.equal(submenu[3]?.type, "separator");
    strict_1.default.equal(submenu[4]?.role, "services");
    const darwinMenu = (0, application_menu_template_1.buildDarwinAppMenu)("darwin", "Fireflies", openDesktopSettings, true);
    strict_1.default.equal(darwinMenu.length, 1);
    strict_1.default.equal(darwinMenu[0]?.label, "Fireflies");
    strict_1.default.deepEqual(darwinMenu[0]?.submenu, submenu);
    strict_1.default.deepEqual((0, application_menu_template_1.buildDarwinAppMenu)("win32", "Fireflies", openDesktopSettings, true), []);
});
(0, node_test_1.test)("a darwin app menu omits Settings when logged out", () => {
    const openDesktopSettings = () => { };
    const submenu = (0, application_menu_template_1.buildDarwinAppSubmenu)(openDesktopSettings, false);
    strict_1.default.equal(submenu[0]?.role, "about");
    strict_1.default.equal(submenu[1]?.type, "separator");
    strict_1.default.equal(submenu[2]?.role, "services");
    strict_1.default.equal(submenu.some((item) => item.label === "Settings"), false);
    strict_1.default.deepEqual((0, application_menu_template_1.buildDarwinAppMenu)("darwin", "Fireflies", openDesktopSettings, false)[0]
        ?.submenu, submenu);
});
//# sourceMappingURL=open-desktop-settings.test.js.map
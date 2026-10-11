"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deeplinkUrl = void 0;
exports.setDeeplinkUrl = setDeeplinkUrl;
exports.parseFirefliesUrl = parseFirefliesUrl;
exports.handleDeepLink = handleDeepLink;
exports.setupNavigationHandlers = setupNavigationHandlers;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const capture_mouse_broadcast_1 = require("./dictation/capture-mouse-broadcast");
const hotkey_mouse_1 = require("./dictation/hotkey-mouse");
const shortcut_capture_session_1 = require("./dictation/shortcut-capture-session");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
function debugLog(...args) {
    if ((0, utils_1.isDev)()) {
        electron_log_1.default.info(...args);
    }
}
function debugError(...args) {
    if ((0, utils_1.isDev)()) {
        electron_log_1.default.error(...args);
    }
}
function attachAppCommandCapture(webContents) {
    const win = electron_1.BrowserWindow.fromWebContents(webContents);
    if (!win)
        return;
    win.on("app-command", (event, command) => {
        const button = (0, hotkey_mouse_1.mouseButtonFromAppCommand)(command);
        if (button === null)
            return;
        if (!(0, shortcut_capture_session_1.isShortcutCaptureActive)())
            return;
        event.preventDefault();
        (0, capture_mouse_broadcast_1.broadcastCaptureMouse)(button, true);
        (0, capture_mouse_broadcast_1.broadcastCaptureMouse)(button, false);
    });
}
// Global variable to store deep link URL when app is not ready
exports.deeplinkUrl = null;
function setDeeplinkUrl(url) {
    exports.deeplinkUrl = url;
}
// Parse fireflies:// URLs and extract the route
function parseFirefliesUrl(url) {
    try {
        debugLog("[DEEPLINK] Parsing URL:", url);
        // Only handle fireflies:// protocol URLs (case-insensitive)
        const urlObj = new URL(url);
        // URL.protocol returns "fireflies:" but DEEPLINK_PROTOCOL is "fireflies://"
        // Normalize by comparing without the slashes
        const normalizedProtocol = `${constants_1.DEEPLINK_SCHEME}:`;
        if (urlObj.protocol.toLowerCase() !== normalizedProtocol.toLowerCase()) {
            debugLog("[DEEPLINK] URL does not match fireflies:// protocol");
            return null;
        }
        // Build route from host + pathname so both "fireflies://live" and "fireflies:///live" work
        const pathFromHost = urlObj.host && urlObj.host !== "-" ? `/${urlObj.host}` : "";
        const route = `${pathFromHost}${urlObj.pathname}${urlObj.search}`;
        debugLog("[DEEPLINK] Extracted route:", route);
        return route;
    }
    catch (error) {
        debugError("[DEEPLINK] Error parsing URL:", error);
        return null;
    }
}
// Handle deep link
function handleDeepLink(url, mainWindow, createChildWindow, showMainWindow) {
    debugLog("[DEEPLINK] Received deep link:", url);
    // Extract the route from fireflies:// URL
    const route = parseFirefliesUrl(url);
    if (!route) {
        debugLog("[DEEPLINK] Not a valid fireflies:// URL, ignoring");
        return;
    }
    debugLog("[DEEPLINK] Handling route:", route);
    if (shouldOpenInFloatingWindow(route)) {
        debugLog("[DEEPLINK] Opening in floating window:", route);
        createChildWindow(route, true);
        return;
    }
    // All other routes navigate in main window via IPC so we don't reload the
    // page and destroy in-memory state (e.g. an ongoing recording).
    debugLog("[DEEPLINK] Navigating in main window:", route);
    if (mainWindow) {
        mainWindow.webContents.send("navigate-to-route", route);
        // Use showMainWindow when provided so dock/taskbar are properly restored
        // on Windows/Linux when the window was hidden to tray.
        if (showMainWindow) {
            showMainWindow();
        }
        else {
            mainWindow.show();
            mainWindow.focus();
        }
    }
    else {
        // Store the route to load when app is ready
        exports.deeplinkUrl = route;
    }
}
// Helper function to check if a pathname should open in floating window
function shouldOpenInFloatingWindow(pathname) {
    const firstSegment = pathname.split("/")[1]?.split("?")[0];
    return firstSegment ? constants_1.FLOATING_WINDOW_ROUTES.includes(firstSegment) : false;
}
// Helper function to check if a pathname should open in child window
function shouldOpenAsChildWindow(pathname) {
    const firstSegment = pathname.split("/")[1]?.split("?")[0];
    return firstSegment ? constants_1.CHILD_WINDOW_ROUTES.includes(firstSegment) : false;
}
// Helper function to handle navigation targets
function handleNavigationTarget(targetUrl, createChildWindow, event, webContentsForGoBack, keepLiveInPlace = false) {
    try {
        const urlObj = new URL(targetUrl);
        const { pathname, hostname } = urlObj;
        // Check if it's an internal app URL
        const isInternalUrl = targetUrl.startsWith("http://localhost:8081") ||
            targetUrl.startsWith(constants_1.APP_ORIGIN) ||
            hostname === "localhost" ||
            hostname === "127.0.0.1";
        if (isInternalUrl) {
            // In the one-window model the main window navigates to /live in place, so
            // its in-page URL change must NOT re-spawn the floating live window. The
            // floating window is still created directly via the window-open-live IPC
            // for the non-notepad path.
            if (!keepLiveInPlace && shouldOpenAsChildWindow(pathname)) {
                debugLog("[NAV] Opening in floating window:", pathname);
                if (event) {
                    event.preventDefault();
                }
                createChildWindow(targetUrl, shouldOpenInFloatingWindow(pathname));
                // Handle browser back navigation only for in-page navigations (when webContents is provided)
                if (webContentsForGoBack &&
                    !webContentsForGoBack.isDestroyed() &&
                    webContentsForGoBack.navigationHistory.canGoBack()) {
                    webContentsForGoBack.navigationHistory.goBack();
                }
                return true; // Handled internally
            }
            // Allow normal internal navigation
            return false;
        }
        // External URL - open in external browser
        if (event) {
            event.preventDefault();
        }
        electron_1.shell.openExternal(targetUrl);
        return true; // Handled externally
    }
    catch (e) {
        debugLog("[NAV] Error parsing URL:", targetUrl, e);
        return false;
    }
}
function setupNavigationHandlers(webContents, createChildWindow, options) {
    const { enableGoBack = false, getMainWindow, showMainWindow, keepLiveInPlace = false, } = options ?? {};
    // Intercept new window requests
    webContents.setWindowOpenHandler(({ url, frameName, features }) => {
        debugLog("[NAV] Window open request:", url, "frameName:", frameName, "features:", features);
        const handled = handleNavigationTarget(url, createChildWindow, undefined, enableGoBack ? webContents : undefined, keepLiveInPlace);
        // If handled (either floating window or external), deny the default action
        // If not handled (normal internal navigation), allow it
        return { action: handled ? "deny" : "allow" };
    });
    // Intercept navigation requests
    webContents.on("will-navigate", (event, navigationUrl) => {
        debugLog("[NAV] will-navigate to:", navigationUrl);
        // Intercept fireflies:// URLs directly so OAuth redirects are handled
        // in-process instead of launching a new electron via shell.openExternal.
        if (navigationUrl.startsWith(`${constants_1.DEEPLINK_SCHEME}://`)) {
            event.preventDefault();
            handleDeepLink(navigationUrl, getMainWindow?.() ?? null, createChildWindow, showMainWindow);
            return;
        }
        handleNavigationTarget(navigationUrl, createChildWindow, event, undefined, keepLiveInPlace);
    });
    attachAppCommandCapture(webContents);
    webContents.on("did-navigate-in-page", (_event, url) => {
        // For in-page navigation, handle floating window creation
        // Don't pass webContents to avoid goBack() which can cause window resize issues
        handleNavigationTarget(url, createChildWindow, undefined, undefined, keepLiveInPlace);
    });
}
//# sourceMappingURL=navigation.js.map
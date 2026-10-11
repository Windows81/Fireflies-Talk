"use strict";
/**
 * Cross-platform browser meeting detection.
 *
 * - macOS: Uses AppleScript to query browser tab URLs directly
 * - Windows: Scans browser window titles (native-system-windows addon) for meeting patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserListenerWindows = exports.BrowserListener = exports.getWindowsBrowserFromProcess = exports.MACOS_PROCESS_TO_BROWSER = void 0;
exports.createBrowserListener = createBrowserListener;
const browser_listener_1 = require("./browser-listener");
const browser_listener_windows_1 = require("./browser-listener-windows");
// Re-export process-name mappings for event-driven mode
var browser_listener_2 = require("./browser-listener");
Object.defineProperty(exports, "MACOS_PROCESS_TO_BROWSER", { enumerable: true, get: function () { return browser_listener_2.MACOS_PROCESS_TO_BROWSER; } });
var browser_listener_windows_2 = require("./browser-listener-windows");
Object.defineProperty(exports, "getWindowsBrowserFromProcess", { enumerable: true, get: function () { return browser_listener_windows_2.getBrowserFromProcess; } });
/**
 * Map from browser name to Windows process base name.
 */
const BROWSER_TO_WINDOWS_PROCESS = {
    chrome: "chrome",
    edge: "msedge",
    brave: "brave",
    vivaldi: "vivaldi",
    safari: "", // Not available on Windows
    arc: "arc",
    comet: "comet",
    "chatgpt-atlas": "atlas",
};
/**
 * Get the appropriate browser listener for the current platform.
 */
function createBrowserListener() {
    if (process.platform === "win32") {
        const listener = new browser_listener_windows_1.BrowserListenerWindows();
        return {
            scan: () => listener.scan(),
            startWatching: (intervalMs, onChange) => listener.startWatching(intervalMs, onChange),
            stopWatching: () => listener.stopWatching(),
            isAutomationAvailable: () => listener.isAutomationAvailable(),
            findGoogleMeetBrowser: () => listener.findGoogleMeetBrowser(),
            lookupMeetingUrlForBrowser: async (browserName) => {
                const processName = BROWSER_TO_WINDOWS_PROCESS[browserName];
                if (!processName)
                    return null;
                return listener.lookupMeetingUrlForProcess(processName);
            },
        };
    }
    else {
        // macOS (and potentially Linux in the future)
        const listener = new browser_listener_1.BrowserListener();
        return {
            scan: async () => {
                const result = await listener.scan();
                return { ...result, windowMeetings: undefined };
            },
            startWatching: (intervalMs, onChange) => listener.startWatching(intervalMs, (result) => onChange({ ...result, windowMeetings: undefined })),
            stopWatching: () => listener.stopWatching(),
            isAutomationAvailable: () => listener.isAutomationAvailableForChromium(),
            findGoogleMeetBrowser: () => listener.findGoogleMeetBrowser(),
            lookupMeetingUrlForBrowser: (browserName) => listener.lookupMeetingUrlForBrowser(browserName),
        };
    }
}
var browser_listener_3 = require("./browser-listener");
Object.defineProperty(exports, "BrowserListener", { enumerable: true, get: function () { return browser_listener_3.BrowserListener; } });
var browser_listener_windows_3 = require("./browser-listener-windows");
Object.defineProperty(exports, "BrowserListenerWindows", { enumerable: true, get: function () { return browser_listener_windows_3.BrowserListenerWindows; } });
//# sourceMappingURL=index.js.map
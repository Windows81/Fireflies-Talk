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
const Sentry = __importStar(require("@sentry/electron/main"));
const config_1 = require("./src/config");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const utils_1 = require("./src/utils");
const navigation_1 = require("./src/navigation");
const windowing_1 = require("./src/windowing");
const constants_1 = require("./src/constants");
const ipc_1 = require("./src/ipc");
const browser_listener_1 = require("./src/browser-listener");
const desktop_logged_in_1 = require("./src/desktop-logged-in");
const tray_1 = require("./src/tray");
const proxy_1 = require("./src/proxy");
const menu_1 = require("./src/menu");
const audio_loopback_1 = require("./src/audio-loopback");
const logger_1 = require("./src/logger");
const quick_note_shortcut_1 = require("./src/quick-note-shortcut");
const download_and_update_1 = require("./src/auto-updater/download-and-update");
const dictation_shortcut_1 = require("./src/dictation/dictation-shortcut");
const dictation_ipc_1 = require("./src/dictation/dictation-ipc");
const dictation_lifecycle_recovery_1 = require("./src/dictation/dictation-lifecycle-recovery");
const dictation_paste_1 = require("./src/dictation/dictation-paste");
const permissions_1 = require("./src/permissions");
const virtual_camera_1 = require("./src/virtual-camera");
const recording_shutdown_1 = require("./src/recording-shutdown");
const recording_context_store_1 = require("./src/recording-context-store");
const quit_readiness_1 = require("./src/quit-readiness");
// Must run before any outbound TLS (Sentry, auto-updater, streaming client, etc.)
// so corporate SSL inspection proxies with internal CAs are trusted.
(0, proxy_1.installSystemCATrust)();
Sentry.init({
    enabled: !(0, utils_1.isDev)(),
    dsn: config_1.envConfig.sentryDsn,
    skipOpenTelemetrySetup: true,
});
// Setup application menu
(0, menu_1.setupApplicationMenu)();
(0, desktop_logged_in_1.onDesktopLoggedInChange)(() => {
    (0, menu_1.setupApplicationMenu)();
    (0, tray_1.rebuildTray)();
});
// Initialize audio loopback for system audio capture
// shouldUseCoreAudioTap() handles platform detection and version checking internally
(0, audio_loopback_1.initAudioLoopback)({ forceCoreAudioTap: (0, audio_loopback_1.shouldUseCoreAudioTap)() });
const browserListener = (0, browser_listener_1.createBrowserListener)();
// Register custom protocol with proper privileges
electron_1.protocol.registerSchemesAsPrivileged([
    {
        scheme: constants_1.APP_SCHEME,
        privileges: {
            secure: true,
            standard: true,
            supportFetchAPI: true,
            stream: true,
            corsEnabled: true,
        },
    },
]);
// Setup command line switches
(0, utils_1.setupCommandLineSwitches)();
// Single instance lock to handle deep links properly
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    // Another instance is already running, quit this one
    electron_log_1.default.error("[Fireflies Desktop] Another instance is already running, exiting... Are you running the app in background?");
    electron_1.app.quit();
}
else {
    // Configure logger first, before any other operations
    (0, logger_1.configureLogger)();
    electron_log_1.default.info("[ENV] Loaded environment", {
        nodeEnv: config_1.envConfig.nodeEnv,
    });
    (0, logger_1.startLogFileCleanup)();
    const recordingShutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: (timeoutMs) => (0, recording_shutdown_1.requestActiveRecordingStop)(recording_context_store_1.getRecordingContextSnapshot, (meetingId) => (0, recording_shutdown_1.requestRecordingStop)(electron_1.ipcMain, windowing_1.mainWindow, meetingId, timeoutMs)).then((attempt) => {
            electron_log_1.default.info("[APP] Recording finalization attempt before quit", {
                attempt,
            });
            return attempt;
        }),
        quit: () => electron_1.app.quit(),
        cleanup: () => {
            electron_log_1.default.info("[APP] Before quit - closing all windows");
            // Idempotent, and already released by onFinalizing below on every path
            // that finalizes. Kept for the pass that had nothing to finalize.
            (0, virtual_camera_1.shutdownVirtualCamera)();
            electron_1.BrowserWindow.getAllWindows().forEach((window) => {
                if (!window.isDestroyed()) {
                    window.destroy();
                }
            });
        },
        onFinalizing: (active) => {
            if (active) {
                // Release the webcam when the quit starts, not after the recording
                // finishes: the extension takes over with its fallback card, so any
                // meeting app sees a card rather than a frozen frame. Finalization is
                // audio and network work and can take seconds on a slow connection —
                // long enough for a held camera to be visible to the other side.
                (0, virtual_camera_1.shutdownVirtualCamera)();
            }
            (0, tray_1.setTrayFinalizingRecording)(active);
        },
        onError: (error) => {
            electron_log_1.default.error("[APP] Failed to finalize recording before quit", { error });
        },
    });
    (0, windowing_1.setRecordingShutdownCoordinator)(recordingShutdown);
    (0, quit_readiness_1.setQuitReadinessCheck)(recordingShutdown.isReady);
    // App event handlers
    electron_1.app.whenReady().then(async () => {
        (0, permissions_1.setupRendererMediaPermissions)();
        // Setup protocol client for deeplinks
        (0, utils_1.setupProtocolClient)();
        // Block ContentSquare session replay loaded by Heap's SDK. It's designed
        // for short-lived web pages — in a desktop app that runs for days it
        // accumulates GB of DOM snapshots in V8's large-object space, causing
        // OOM crashes (DESKTOP-FF-FF, DESKTOP-FF-FY). Heap analytics still works.
        electron_1.session.defaultSession.webRequest.onBeforeRequest({ urls: ["*://*.contentsquare.net/*", "*://*.contentsquare.com/*"] }, (_details, callback) => callback({ cancel: true }));
        // Start local CORS proxy (production only, dev has webSecurity disabled)
        if (!(0, utils_1.isDev)()) {
            try {
                // Inject CORS headers for files.fireflies.ai so that <video crossOrigin="anonymous">
                // can stream audio through AudioContext (Web Audio API requires CORS for raw audio access).
                electron_1.session.defaultSession.webRequest.onHeadersReceived({ urls: ["https://files.fireflies.ai/*"] }, (details, callback) => {
                    callback({
                        responseHeaders: {
                            ...details.responseHeaders,
                            "Access-Control-Allow-Origin": ["*"],
                            "Access-Control-Allow-Methods": ["GET, HEAD, OPTIONS"],
                        },
                    });
                });
                await (0, proxy_1.startCorsProxy)(constants_1.CORS_PROXY_PORT);
            }
            catch (error) {
                electron_log_1.default.error("[MAIN] Failed to start CORS proxy:", error);
                // Don't exit - app can still run, but API requests may fail
                // User will see errors in the renderer console
            }
        }
        // Setup IPC handlers (pass browserListener for event-driven audio enrichment)
        (0, ipc_1.setupIpcHandlers)(browserListener);
        electron_1.ipcMain.handle("meetings:scan", () => browserListener.scan());
        electron_1.ipcMain.handle("meetings:check-automation", () => browserListener.isAutomationAvailable());
        electron_1.ipcMain.handle("meetings:find-google-meet-browser", () => browserListener.findGoogleMeetBrowser());
        (0, windowing_1.createWindow)();
        (0, tray_1.createTray)();
        // Virtual camera: reads extension state and starts watching for consumers.
        // Never opens the webcam on its own — that only happens once a meeting app
        // actually attaches to the Fireflies camera.
        (0, virtual_camera_1.initVirtualCamera)().catch((error) => electron_log_1.default.error("[VCAM] initialization failed:", error));
        // Setup auto-updater (checks for updates periodically)
        (0, download_and_update_1.setupAutoUpdater)({
            prepareForQuit: recordingShutdown.prepare,
            cancelPreparedQuit: recordingShutdown.reset,
        });
        // Global shortcuts: Cmd+Option+N to start a quick note, Cmd+Option+B to invite bot
        (0, quick_note_shortcut_1.setupQuickNoteShortcut)();
        // Push-to-talk dictation: Globe/Fn or a custom shortcut (macOS / Windows).
        // The paste helper is not prewarmed here: setDictationEnabled warms it only
        // once a signed-in user has Fireflies Talk, so users without Talk spawn no
        // dictation helper.
        if (process.platform === "darwin" || process.platform === "win32") {
            (0, dictation_shortcut_1.setupDictationShortcut)();
            (0, dictation_ipc_1.setupDictationIpc)();
            if (process.platform === "win32")
                (0, dictation_lifecycle_recovery_1.setupDictationLifecycleRecovery)();
        }
        // Event-driven mode (CoreAudioTap on macOS >= 14.2, or Windows):
        // URL lookup happens on-demand when mic_started fires, no polling needed.
        // Legacy mode (macOS < 14.2): poll browser tabs every 2 seconds.
        const useEventDrivenMode = (0, audio_loopback_1.shouldUseCoreAudioTap)() || process.platform === "win32";
        if (!useEventDrivenMode) {
            browserListener.startWatching(2000, (res) => {
                // Send meeting detection data to renderer process
                if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                    windowing_1.mainWindow.webContents.send("browser-meetings-changed", res);
                }
            });
        }
        else {
            electron_log_1.default.info("[MAIN] Event-driven meeting detection enabled, skipping browser polling");
        }
        electron_1.app.on("activate", function () {
            (0, windowing_1.showMainWindow)();
        });
    });
    // Handle deep links via second-instance (works on all platforms including macOS
    // when the protocol handler launches a new process via setAsDefaultProtocolClient)
    electron_1.app.on("second-instance", (_event, commandLine) => {
        electron_log_1.default.info("[DEEPLINK] Second instance detected");
        const urlArg = commandLine.find((arg) => arg.startsWith("fireflies://"));
        if (urlArg) {
            // Let handleDeepLink decide whether to show the main window or a floating
            // window — calling showMainWindow() first would incorrectly switch macOS
            // spaces for routes that only target the live/floating window.
            electron_log_1.default.info("[DEEPLINK] Found URL in command line:", urlArg);
            (0, navigation_1.handleDeepLink)(urlArg, windowing_1.mainWindow, windowing_1.createChildWindow, windowing_1.showMainWindow);
        }
        else {
            (0, windowing_1.showMainWindow)();
        }
    });
    if (process.platform === "darwin") {
        // open-url fires when macOS routes the deeplink to the already-running app
        // via Apple Events (packaged builds or when the bundle is recognized).
        electron_1.app.on("open-url", (event, url) => {
            electron_log_1.default.info("[DEEPLINK] macOS open-url event:", url);
            event.preventDefault();
            (0, navigation_1.handleDeepLink)(url, windowing_1.mainWindow, windowing_1.createChildWindow, windowing_1.showMainWindow);
        });
    }
    // Handle deep link when app is first launched with a fireflies:// URL
    const urlArg = process.argv.find((arg) => arg.startsWith("fireflies://"));
    if (urlArg) {
        electron_log_1.default.info("[DEEPLINK] Found URL in initial launch:", urlArg);
        // Store the parsed route (not the raw fireflies:// URL) — windowing.ts
        // consumes this via getUrlToLoad() which expects a route string.
        const route = (0, navigation_1.parseFirefliesUrl)(urlArg);
        if (route)
            (0, navigation_1.setDeeplinkUrl)(route);
    }
    // When all windows are closed
    electron_1.app.on("window-all-closed", function () {
        // On macOS, keep app running until user quits explicitly
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    // Handle app quit
    electron_1.app.on("before-quit", (event) => {
        // Every quit path — tray, app menu, updater, native — must be visible to
        // the window close handlers, which read this flag to tell "hide to tray"
        // from "the app is going away". Only the tray and the updater used to set
        // it, so an app-menu quit looked like an ordinary window close.
        electron_1.app.isQuitting = true;
        (0, dictation_shortcut_1.stopDictationShortcut)();
        (0, dictation_paste_1.stopMacosPasteHelper)();
        (0, dictation_paste_1.stopWindowsPasteHelper)();
        recordingShutdown.handleBeforeQuit(event);
    });
    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
        electron_log_1.default.error("Uncaught exception:", err);
        Sentry.captureException(err);
    });
}
//# sourceMappingURL=main.js.map
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
exports.getRecordingContextSnapshot = void 0;
exports.resizeToStoredContent = resizeToStoredContent;
exports.resetLiveViewMode = resetLiveViewMode;
exports.getCurrentLiveViewMode = getCurrentLiveViewMode;
exports.applyLiveViewMode = applyLiveViewMode;
exports.setupIpcHandlers = setupIpcHandlers;
const Sentry = __importStar(require("@sentry/electron/main"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const clipboard_image_1 = require("./clipboard-image");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dictation_clipboard_1 = require("./dictation/dictation-clipboard");
const desktop_logged_in_1 = require("./desktop-logged-in");
const tray_1 = require("./tray");
const notification_window_1 = require("./notification/notification-window");
const windowing_1 = require("./windowing");
const audio_monitor_1 = require("./audio-monitor");
const proxy_1 = require("./proxy");
const permissions_1 = require("./permissions");
const logger_1 = require("./logger");
const cloud_log_buffer_1 = require("./cloud-log-buffer");
const process_health_1 = require("./process-health");
const recording_power_policy_1 = require("./recording-power-policy");
const download_and_update_1 = require("./auto-updater/download-and-update");
const restart_state_1 = require("./auto-updater/restart-state");
const auto_install_1 = require("./auto-updater/auto-install");
const recording_context_store_1 = require("./recording-context-store");
const virtual_camera_1 = require("./virtual-camera");
const realtime_streaming_1 = require("./realtime-streaming");
const network_reachability_1 = require("./network-reachability");
const network_reachability_requester_1 = require("./network-reachability-requester");
const audio_loopback_1 = require("./audio-loopback");
const browser_listener_1 = require("./browser-listener");
const types_1 = require("./types");
const meeting_url_store_1 = require("./meeting-url-store");
const live_view_mode_store_1 = require("./live-view-mode-store");
const quick_note_shortcut_1 = require("./quick-note-shortcut");
const platform_1 = require("./auto-updater/platform");
const recorder_ack_1 = require("./recorder-ack");
// Live view mode sync between renderer and main
let currentLiveViewMode = "compact";
const lastContentSize = new Map();
const streamingManager = new realtime_streaming_1.RealtimeStreamingManager();
const CONSENT_AUDIO_FILE_NAME = "consent-message.mp3";
// Forward streaming transcripts to the live window when it is showing
// the same meeting currently being streamed from the recording window.
streamingManager.onTranscript((data) => {
    const activeStreamingMeetingId = streamingManager.getActiveMeetingId();
    if (!activeStreamingMeetingId)
        return;
    const liveMeetingId = (0, windowing_1.getCurrentLiveMeetingId)();
    if (!liveMeetingId || liveMeetingId !== activeStreamingMeetingId)
        return;
    const liveContents = (0, windowing_1.getLiveBrowserViewWebContents)();
    const activeSenderId = streamingManager.getActiveSenderId();
    if (!liveContents ||
        liveContents.isDestroyed() ||
        liveContents.id === activeSenderId) {
        return;
    }
    try {
        liveContents.send("streaming:transcript", data);
    }
    catch (error) {
        electron_log_1.default.error("[IPC] Failed to forward streaming transcript to live window", {
            error,
        });
    }
});
function resizeToStoredContent(sender, size) {
    try {
        if (sender.isDestroyed())
            return;
        const win = electron_1.BrowserWindow.fromWebContents(sender);
        if (!win || win.isDestroyed())
            return;
        const prev = win.getBounds();
        const display = electron_1.screen.getDisplayMatching(prev);
        const wa = display.workArea;
        const storedSize = size ?? lastContentSize.get(sender.id);
        if (!storedSize)
            return;
        // Remember the logical size for future zoom changes
        lastContentSize.set(sender.id, storedSize);
        const zoomFactor = sender.getZoomFactor ? sender.getZoomFactor() : 1;
        const targetWidth = Math.round(storedSize.width * zoomFactor);
        const targetHeight = Math.round(storedSize.height * zoomFactor);
        // Account for Electron's minWidth/minHeight constraints so our position
        // calculation uses the same dimensions Electron will actually apply.
        // Without this, setBounds silently clamps width to minWidth while keeping
        // our calculated X, causing the center to drift on every resize call.
        const [winMinWidth, winMinHeight] = win.getMinimumSize();
        const clampedWidth = Math.max(winMinWidth, Math.min(targetWidth, wa.width));
        // The live bar sits on one edge of its window and must not be displaced by
        // its own panels growing, so the height is capped at whatever fits from the
        // anchored edge rather than letting the work-area clamp slide the window.
        const bottomAnchored = (0, windowing_1.isLiveBarBottomAnchored)(win);
        const sideDocked = (0, windowing_1.isLiveBarSideDocked)(win);
        const heightBudget = bottomAnchored
            ? prev.y + prev.height - wa.y
            : sideDocked
                ? wa.y + wa.height - prev.y
                : wa.height;
        const clampedHeight = Math.max(winMinHeight, Math.min(targetHeight, Math.min(heightBudget, wa.height)));
        // Preserve current center X, clamp within work area. A side-docked live
        // bar instead holds its docked edge so panels open toward screen centre.
        const anchor = (0, windowing_1.liveBarResizeAnchor)(win);
        const currentCenterX = prev.x + prev.width / 2;
        let x = anchor === "left"
            ? prev.x
            : anchor === "right"
                ? prev.x + prev.width - clampedWidth
                : Math.round(currentCenterX - clampedWidth / 2);
        x = Math.max(wa.x, Math.min(x, wa.x + wa.width - clampedWidth));
        // Preserve Y (top anchor), clamp within work area. The live bar pinned to a
        // bottom-docked pill is the exception: it keeps its foot planted so the bar
        // stays on the pill and the panels open upward.
        let y = (0, windowing_1.isLiveBarBottomAnchored)(win)
            ? prev.y + prev.height - clampedHeight
            : prev.y;
        y = Math.max(wa.y, Math.min(y, wa.y + wa.height - clampedHeight));
        // Skip if bounds haven't meaningfully changed (1px tolerance for
        // macOS pixel alignment drift that causes redundant repositions)
        if (Math.abs(prev.x - x) <= 1 &&
            Math.abs(prev.y - y) <= 1 &&
            Math.abs(prev.width - clampedWidth) <= 1 &&
            Math.abs(prev.height - clampedHeight) <= 1) {
            return;
        }
        (0, windowing_1.suppressLiveBarMoveTracking)(400);
        win.setBounds({ x, y, width: clampedWidth, height: clampedHeight }, false);
        // Immediately re-apply glass positions only when the HEIGHT changed.
        // Cocoa Y is bottom-relative, so a height change shifts every glass panel's
        // visual position and needs this synchronous fix-up. On a width-only change
        // (e.g. dragging a panel card wider) the stored X is now stale because the
        // window also re-centers — re-applying it would slam the glass to the wrong
        // X each frame (visible flicker). The renderer's per-frame glass sync keeps
        // glass aligned for width changes, so skip the re-apply there.
        const heightChanged = Math.abs(prev.height - clampedHeight) > 1;
        if (heightChanged) {
            const isMain = win === windowing_1.mainWindow;
            const gm = isMain ? windowing_1.mainGlassManager : windowing_1.liveGlassManager;
            gm?.adjustForResize();
        }
    }
    catch (error) {
        electron_log_1.default.error("[IPC] resizeToStoredContent failed:", error);
    }
}
function resetLiveViewMode() {
    currentLiveViewMode = "compact";
}
function getCurrentLiveViewMode() {
    return currentLiveViewMode;
}
/**
 * Switch the live view between the compact (floating bar) and full windows,
 * keeping the renderer mode state in sync. Used by the `liveview:set-mode` IPC
 * and by the full window's close handler (closing the RTP returns to the bar).
 */
async function applyLiveViewMode(mode) {
    if (currentLiveViewMode === mode)
        return;
    // Exit fullscreen first when switching to compact mode
    if (mode === "compact") {
        await (0, windowing_1.exitLiveFullWindowFullscreen)();
    }
    currentLiveViewMode = mode;
    // Switch between the two host windows using the BrowserView
    (0, windowing_1.switchLiveWindowMode)(mode);
    // Notify renderer processes of the change
    windowing_1.mainWindow?.webContents.send("liveview:mode-changed", currentLiveViewMode);
    // Send to the BrowserView
    const liveViewWebContents = (0, windowing_1.getLiveBrowserViewWebContents)();
    if (liveViewWebContents) {
        liveViewWebContents.send("liveview:mode-changed", currentLiveViewMode);
    }
}
var recording_context_store_2 = require("./recording-context-store");
Object.defineProperty(exports, "getRecordingContextSnapshot", { enumerable: true, get: function () { return recording_context_store_2.getRecordingContextSnapshot; } });
/**
 * Resolve the BrowserName from an AudioEvent's process info.
 * Returns null if the process is not a known browser.
 */
function resolveBrowserName(event) {
    if (process.platform === "darwin") {
        // On macOS, parentProcessName is the browser app name (e.g. "Google Chrome")
        if (event.parentProcessName) {
            return types_1.MACOS_PROCESS_TO_BROWSER[event.parentProcessName] ?? null;
        }
        return null;
    }
    else if (process.platform === "win32") {
        // On Windows, processName is e.g. "chrome.exe"
        return (0, browser_listener_1.getWindowsBrowserFromProcess)(event.processName);
    }
    return null;
}
// Minimized is checked first: a minimized window still reports visible.
function windowDisplayState(win) {
    if (!win || win.isDestroyed())
        return null;
    if (win.isMinimized())
        return "minimized";
    return win.isVisible() ? "visible" : "hidden";
}
function setupIpcHandlers(browserListener) {
    // Start cloud log buffer — forwards main-process logs to renderer on each add()
    cloud_log_buffer_1.cloudLogBuffer.start(() => windowing_1.mainWindow);
    // Setup notification handlers
    (0, notification_window_1.setupNotificationHandlers)();
    // Proxy auth token handler (synchronous for immediate access)
    electron_1.ipcMain.on("get-proxy-auth-token", (event) => {
        event.returnValue = (0, proxy_1.getProxyAuthToken)();
    });
    // Proxy port handler (synchronous for immediate access)
    electron_1.ipcMain.on("get-proxy-port", (event) => {
        event.returnValue = (0, proxy_1.getProxyPort)();
    });
    // App version handler (synchronous for Sentry release name)
    electron_1.ipcMain.on("get-app-version", (event) => {
        event.returnValue = electron_1.app.getVersion();
    });
    // Window role check (synchronous for lightweight renderer guards)
    electron_1.ipcMain.on("window-is-main", (event) => {
        const senderWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
        // BrowserWindow.fromWebContents returns null for a WebContentsView,
        // so also check whether the sender is the reparented liveBrowserView.
        const isMain = Boolean(senderWindow && windowing_1.mainWindow && senderWindow === windowing_1.mainWindow);
        const isReparentedLiveView = !isMain &&
            (0, windowing_1.isLiveViewOnMain)() &&
            event.sender === (0, windowing_1.getLiveBrowserViewWebContents)();
        event.returnValue = isMain || isReparentedLiveView;
    });
    // Sentry context sync (renderer → main process)
    electron_1.ipcMain.on("sentry:set-user", (event, user) => {
        Sentry.setUser(user);
        if (!(0, desktop_logged_in_1.isMainDesktopLoginSender)(event.sender, windowing_1.mainWindow))
            return;
        (0, desktop_logged_in_1.setDesktopLoggedIn)(Boolean(user));
    });
    electron_1.ipcMain.on("sentry:set-context", (_event, name, context) => {
        Sentry.setContext(name, context);
    });
    electron_1.ipcMain.on("sentry:set-tag", (_event, key, value) => {
        Sentry.setTag(key, value);
    });
    // Add handler for showing custom notifications
    electron_1.ipcMain.handle("show-notification", async (_event, title, body, actionUrl, actionText, notificationConfig) => {
        try {
            electron_log_1.default.info("[IPC] show-notification called with:", {
                title,
                body,
                actionUrl,
                actionText,
                notificationConfig,
            });
            (0, notification_window_1.showNotificationWindow)(title, body, actionUrl, actionText, notificationConfig ? { notificationConfig } : undefined);
            return true;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to show notification:", error);
            return false;
        }
    });
    electron_1.ipcMain.handle("show-meeting-notification", async (_event, payload) => {
        try {
            electron_log_1.default.info("[IPC] show-meeting-notification called with:", payload);
            (0, notification_window_1.showNotificationWindow)(payload.title, payload.body, payload.primaryAction.url, payload.primaryAction.text, {
                template: "meeting",
                primaryAction: payload.primaryAction,
                secondaryAction: payload.secondaryAction,
                titleIcon: payload.titleIcon,
                orText: payload.orText,
                notificationConfig: payload.notificationConfig,
            });
            return true;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to show meeting notification:", error);
            return false;
        }
    });
    electron_1.ipcMain.handle("show-upcoming-notification", async (_event, payload) => {
        try {
            electron_log_1.default.info("[IPC] show-upcoming-notification called with:", payload);
            (0, notification_window_1.showNotificationWindow)("", // title is built inside the HTML from meetingName
            "", // body is built inside the HTML based on state
            payload.prepUrl || "", "", {
                template: "upcoming",
                upcoming: {
                    meetingName: payload.meetingName,
                    eventId: payload.eventId,
                    iCalUID: payload.iCalUID,
                    hasMeetingPrep: payload.hasMeetingPrep,
                    hasAutoJoin: payload.hasAutoJoin,
                    prepUrl: payload.prepUrl,
                },
                notificationConfig: payload.notificationConfig,
            });
            return true;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to show upcoming notification:", error);
            return false;
        }
    });
    electron_1.ipcMain.handle("show-calendar-event-notification", async (_event, payload) => {
        try {
            electron_log_1.default.info("[IPC] show-calendar-event-notification called with:", payload);
            (0, notification_window_1.showNotificationWindow)("", // title is built from payload in the HTML
            "", payload.primaryAction.url, payload.primaryAction.text, {
                template: "calendar_event",
                calendarEvent: payload,
                notificationConfig: payload.notificationConfig,
            });
            return true;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to show calendar event notification:", error);
            return false;
        }
    });
    // Window controls
    // Centralize mainWindow safety checks and error logging
    const withMain = (fn) => {
        try {
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed())
                fn(windowing_1.mainWindow);
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Window op failed:", error);
        }
    };
    electron_1.ipcMain.handle("window-minimize", async () => {
        withMain((w) => w.minimize());
    });
    electron_1.ipcMain.handle("window-show-main", async () => {
        (0, windowing_1.showMainWindow)();
    });
    electron_1.ipcMain.handle("window-close", async (event) => {
        try {
            // Get the window that sent the close request
            const senderWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (senderWindow && !senderWindow.isDestroyed()) {
                // Close should hide app to tray and remove from dock/taskbar
                if (senderWindow === windowing_1.mainWindow) {
                    try {
                        electron_log_1.default.info("[IPC] Hiding main window to tray");
                        senderWindow.hide();
                        senderWindow.setSkipTaskbar(true);
                    }
                    catch (error) {
                        electron_log_1.default.error("[IPC] Failed to hide main window:", error);
                    }
                }
                else {
                    try {
                        electron_log_1.default.info("[IPC] Destroying live window");
                        if (senderWindow === windowing_1.liveWindow) {
                            (0, windowing_1.destroyLiveWindow)();
                        }
                        else {
                            senderWindow.destroy();
                        }
                    }
                    catch (error) {
                        electron_log_1.default.error("[IPC] Failed to destroy live window:", error);
                    }
                }
            }
            else {
                // Fallback to main window
                withMain((w) => {
                    try {
                        w.hide();
                        w.setSkipTaskbar(true);
                    }
                    catch (error) {
                        electron_log_1.default.error("[IPC] Failed to hide window:", error);
                    }
                });
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to close window:", error);
            // Fallback to main window close
            withMain((w) => {
                try {
                    w.hide();
                    w.setSkipTaskbar(true);
                }
                catch (error) {
                    electron_log_1.default.error("[IPC] Failed to hide window:", error);
                }
            });
        }
    });
    electron_1.ipcMain.handle("window-close-and-focus-main", async (event, options) => {
        try {
            const senderWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
            const isLiveViewSender = event.sender === (0, windowing_1.getLiveBrowserViewWebContents)();
            // Exit fullscreen on the live window before destroying it
            // so macOS cleanly transitions out of the fullscreen Space
            await (0, windowing_1.exitLiveFullWindowFullscreen)();
            // Capture live window bounds before closing
            let targetBounds = null;
            if (isLiveViewSender && windowing_1.liveWindow && !windowing_1.liveWindow.isDestroyed()) {
                targetBounds = windowing_1.liveWindow.getBounds();
                electron_log_1.default.info("[IPC] Captured live window bounds:", targetBounds);
            }
            else if (senderWindow &&
                !senderWindow.isDestroyed() &&
                senderWindow !== windowing_1.mainWindow) {
                targetBounds = senderWindow.getBounds();
                electron_log_1.default.info("[IPC] Captured live window bounds:", targetBounds);
            }
            // Close the sender window if it's not the main window
            if (isLiveViewSender) {
                electron_log_1.default.info("[IPC] Closing live view and focusing main");
                (0, windowing_1.destroyLiveWindow)();
            }
            else if (senderWindow &&
                !senderWindow.isDestroyed() &&
                senderWindow !== windowing_1.mainWindow) {
                electron_log_1.default.info("[IPC] Closing window and focusing main");
                if (senderWindow === windowing_1.liveWindow) {
                    (0, windowing_1.destroyLiveWindow)();
                }
                else {
                    senderWindow.destroy();
                }
            }
            // Skip repositioning if main window is fullscreen (it already fills the screen)
            const isMainFullscreen = windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed() && windowing_1.mainWindow.isFullScreen();
            // Move main window to the same screen as the live window was
            if (targetBounds &&
                windowing_1.mainWindow &&
                !windowing_1.mainWindow.isDestroyed() &&
                !isMainFullscreen) {
                const targetDisplay = electron_1.screen.getDisplayMatching(targetBounds);
                const workArea = targetDisplay.workArea;
                // Keep main window's current size
                const mainBounds = windowing_1.mainWindow.getBounds();
                const mainWidth = mainBounds.width;
                const mainHeight = mainBounds.height;
                // Center the main window on the same screen
                const x = Math.round(workArea.x + (workArea.width - mainWidth) / 2);
                const y = Math.round(workArea.y + (workArea.height - mainHeight) / 2);
                // Clamp to work area bounds
                const clampedX = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - mainWidth));
                const clampedY = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - mainHeight));
                windowing_1.mainWindow.setBounds({
                    x: clampedX,
                    y: clampedY,
                    width: mainWidth,
                    height: mainHeight,
                });
                electron_log_1.default.info("[IPC] Moved main window to screen:", {
                    x: clampedX,
                    y: clampedY,
                    display: targetDisplay.id,
                });
            }
            // Focus the main window
            // app.focus forces macOS to switch to the Space where mainWindow lives
            if (process.platform === "darwin") {
                electron_1.app.focus({ steal: true });
            }
            (0, windowing_1.showMainWindow)();
            // Navigate to home screen in main window (unless caller already navigated elsewhere)
            if (!options?.skipNavigateHome &&
                windowing_1.mainWindow &&
                !windowing_1.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[IPC] Navigating main window to home");
                windowing_1.mainWindow.webContents.send("navigate-to-home");
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to close window and focus main:", error);
        }
    });
    // Trigger refetch in main window from another window
    electron_1.ipcMain.on("trigger-main-refetch", () => {
        try {
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[IPC] Triggering refetch in main window");
                windowing_1.mainWindow.webContents.send("trigger-refetch");
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to trigger main refetch:", error);
        }
    });
    // Navigate main window to Live screen for a meeting without focusing it
    electron_1.ipcMain.on("navigate-main-to-live", (_event, meetingId) => {
        try {
            if (!meetingId)
                return;
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[IPC] Navigating main window to live meeting:", meetingId);
                windowing_1.mainWindow.webContents.send("navigate-to-live", meetingId);
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to navigate main window to live:", error);
        }
    });
    // Navigate the main window to an in-app route and focus it. Used by the
    // post-meeting instant summary pane to open the Desktop Notepad. The main
    // window's navigation tears down any reparented live overlay on its own.
    electron_1.ipcMain.on("navigate-main-to-route", (_event, route) => {
        try {
            if (!route)
                return;
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[IPC] Navigating main window to route:", route);
                windowing_1.mainWindow.webContents.send("navigate-to-route", route);
                windowing_1.mainWindow.show();
                windowing_1.mainWindow.focus();
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to navigate main window to route:", error);
        }
    });
    electron_1.ipcMain.handle("liveview:close-window", async () => {
        try {
            (0, windowing_1.hideMeetingEndAnimationWindow)();
            (0, windowing_1.destroyLiveWindow)();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to close live window:", error);
        }
    });
    // Reparent the live WebContentsView into the main window as an overlay
    electron_1.ipcMain.handle("liveview:reparent-to-main", async () => {
        electron_log_1.default.info("[IPC] liveview:reparent-to-main handler invoked");
        try {
            const result = await (0, windowing_1.reparentLiveViewToMain)();
            electron_log_1.default.info("[IPC] reparentLiveViewToMain returned:", result);
            return result;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to reparent live view to main:", error);
            return false;
        }
    });
    // Detach the live WebContentsView from the main window
    electron_1.ipcMain.handle("liveview:detach-from-main", async () => {
        try {
            (0, windowing_1.detachLiveViewFromMain)();
            // Navigate main window to home screen after detaching the overlay
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[IPC] Navigating main window to home after detach");
                windowing_1.mainWindow.webContents.send("navigate-to-home");
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to detach live view from main:", error);
        }
    });
    // The main window's renderer navigated (e.g. via a notification click). If the
    // post-meeting live overlay is currently reparented onto the main window, it
    // would hide whatever the user navigated to, so tear it down.
    //
    // Both the real main window and the reparented live view run the same SPA and
    // emit this on navigation, so we must only act for the real main window. The
    // reparented live view is a WebContentsView, for which
    // BrowserWindow.fromWebContents returns null, so it can never match mainWindow.
    //
    // We call detachLiveViewFromMain() directly (not the "liveview:detach-from-main"
    // handler) to avoid sending "navigate-to-home" — the main window is already
    // navigating to wherever the user intended.
    electron_1.ipcMain.on("liveview:main-window-navigated", (event) => {
        const senderWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
        const isRealMain = Boolean(senderWindow && windowing_1.mainWindow && senderWindow === windowing_1.mainWindow);
        if (isRealMain && (0, windowing_1.isLiveViewOnMain)()) {
            electron_log_1.default.info("[IPC] Main window navigated with live overlay present — detaching");
            (0, windowing_1.detachLiveViewFromMain)();
        }
    });
    // The Live window ended its recording and swapped to the notepad in place;
    // expand to full (if compact) and switch close behavior from "collapse to
    // compact" to a real close.
    electron_1.ipcMain.on("liveview:meeting-ended-in-place", () => {
        (0, windowing_1.markLiveMeetingEndedInPlace)();
        void applyLiveViewMode("full");
    });
    // Hide a live meeting from the main window's list (used when meeting ends in live window)
    electron_1.ipcMain.on("live-meeting-ended", (_event, meetingId) => {
        // The single "this session is over" edge, whatever ended it and wherever
        // the notepad lands afterwards. The pill leans on it rather than on the
        // recorder's own report, which trails the click.
        (0, windowing_1.markLiveMeetingEnded)(meetingId);
        try {
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[IPC] Hiding live meeting in main window:", meetingId);
                windowing_1.mainWindow.webContents.send("live-meeting-ended", meetingId);
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to hide live meeting:", error);
        }
    });
    electron_1.ipcMain.handle("recording-context:get", async () => {
        return (0, recording_context_store_1.getRecordingContextSnapshot)();
    });
    electron_1.ipcMain.on("recording-context:sync", (event, snapshot) => {
        const senderWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!windowing_1.mainWindow || senderWindow !== windowing_1.mainWindow)
            return;
        (0, recording_context_store_1.setRecordingContextSnapshot)(snapshot);
        // The pill must not offer to start notes the user is already taking, and
        // this outlives the live windows across a restart.
        (0, windowing_1.setMeetingRecordingActive)(snapshot?.state === "recording" || snapshot?.state === "paused", snapshot?.meetingId);
        (0, tray_1.rebuildTray)();
        // Same signal that drives the tray's active icon, so the camera chip and
        // the tray can never disagree about whether a recording is running.
        (0, virtual_camera_1.notifyRecordingStateChanged)();
        const liveContents = (0, windowing_1.getLiveBrowserViewWebContents)();
        if (liveContents && !liveContents.isDestroyed()) {
            liveContents.send("recording-context:updated", snapshot);
        }
    });
    electron_1.ipcMain.handle("virtual-camera:get-status", () => (0, virtual_camera_1.getVirtualCameraStatus)());
    electron_1.ipcMain.handle("virtual-camera:enable", () => (0, virtual_camera_1.enableVirtualCamera)());
    electron_1.ipcMain.handle("virtual-camera:disable", () => (0, virtual_camera_1.disableVirtualCamera)());
    (0, virtual_camera_1.onVirtualCameraStatusChanged)((status) => {
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            windowing_1.mainWindow.webContents.send("virtual-camera:status-changed", status);
        }
        // The Live view needs this too, not just Settings: it is where the notice
        // that a recording has been muted has to appear, and it is a separate
        // renderer that never sees the main window's copy.
        const liveContents = (0, windowing_1.getLiveBrowserViewWebContents)();
        if (liveContents && !liveContents.isDestroyed()) {
            liveContents.send("virtual-camera:status-changed", status);
        }
    });
    electron_1.ipcMain.on("recording-context:request-update", (_event, update) => {
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            windowing_1.mainWindow.webContents.send("recording-context:apply-update", update);
        }
    });
    // A rename in one window has to reach every window: each renderer keeps its
    // own Apollo cache and stores, so the home banners / live header / notepad
    // would otherwise stay on the old title until a server refetch. The sender is
    // included so the window owning the recorder always updates the recording
    // context's title copy through the same path, even when it is the renamer.
    electron_1.ipcMain.on("meeting:title-updated", (_event, update) => {
        if (!update?.meetingId)
            return;
        const targets = [
            windowing_1.mainWindow?.webContents,
            (0, windowing_1.getLiveBrowserViewWebContents)(),
            ...electron_1.BrowserWindow.getAllWindows().map((win) => win.webContents),
        ];
        const delivered = new Set();
        for (const contents of targets) {
            if (!contents || contents.isDestroyed() || delivered.has(contents.id)) {
                continue;
            }
            delivered.add(contents.id);
            contents.send("meeting:title-updated", update);
        }
    });
    electron_1.ipcMain.on("recording-context:ended", (event, payload) => {
        const senderWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!windowing_1.mainWindow || senderWindow !== windowing_1.mainWindow)
            return;
        const liveContents = (0, windowing_1.getLiveBrowserViewWebContents)();
        if (liveContents && !liveContents.isDestroyed()) {
            liveContents.send("recording-context:ended", payload);
        }
    });
    electron_1.ipcMain.handle("recording:stop", async (_event, meetingId) => {
        if (!windowing_1.mainWindow || windowing_1.mainWindow.isDestroyed())
            return false;
        windowing_1.mainWindow.webContents.send("recording:stop", { meetingId });
        return true;
    });
    // Discard request from the live window — the recorder lives in the main
    // window, so forward it there exactly like recording:stop. Unlike stop, we
    // wait for the main window to acknowledge that teardown is complete before
    // resolving, so the caller can delete the meeting without racing a recording
    // session that is still active. Slow teardown gets a longer deadline, and a
    // missing acknowledgement returns false instead of authorizing deletion.
    electron_1.ipcMain.handle("recording:discard", async (_event, meetingId) => {
        if (!windowing_1.mainWindow || windowing_1.mainWindow.isDestroyed())
            return false;
        const recorderContents = windowing_1.mainWindow.webContents;
        const acked = (0, recorder_ack_1.waitForRecorderAck)({
            ipc: electron_1.ipcMain,
            channel: "recording:discard-done",
            recorderContents,
            meetingId,
            timeoutMs: recorder_ack_1.RECORDING_DISCARD_ACK_TIMEOUT_MS,
        });
        recorderContents.send("recording:discard", { meetingId });
        return acked;
    });
    electron_1.ipcMain.on("recording:toggle-pause-resume", (event) => {
        electron_log_1.default.info("[IPC] recording:toggle-pause-resume received from sender:", event.sender.id);
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            electron_log_1.default.info("[IPC] Forwarding toggle-pause-resume to main window, webContents id:", windowing_1.mainWindow.webContents.id);
            windowing_1.mainWindow.webContents.send("recording:toggle-pause-resume");
        }
        else {
            electron_log_1.default.warn("[IPC] Cannot forward toggle-pause-resume: mainWindow unavailable", {
                exists: !!windowing_1.mainWindow,
                destroyed: windowing_1.mainWindow?.isDestroyed(),
            });
        }
    });
    electron_1.ipcMain.on("recording:set-input-device", (_event, deviceId) => {
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            windowing_1.mainWindow.webContents.send("recording:set-input-device", deviceId);
        }
    });
    electron_1.ipcMain.handle("window-maximize", async () => {
        withMain((w) => w.maximize());
    });
    electron_1.ipcMain.handle("window-unmaximize", async () => {
        withMain((w) => w.unmaximize());
    });
    electron_1.ipcMain.handle("window-is-maximized", async () => {
        try {
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                return windowing_1.mainWindow.isMaximized();
            }
            return false;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to check if window is maximized:", error);
            return false;
        }
    });
    electron_1.ipcMain.handle("window-is-fullscreen", async (event) => {
        try {
            // The live content view can't be resolved via fromWebContents, so detect
            // it directly and report its host window's fullscreen state instead of
            // always answering for the main window.
            const isLiveView = !(0, windowing_1.isLiveViewOnMain)() && event.sender === (0, windowing_1.getLiveBrowserViewWebContents)();
            if (isLiveView) {
                return (0, windowing_1.isLiveViewHostFullscreen)();
            }
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                return windowing_1.mainWindow.isFullScreen();
            }
            return false;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to check if window is fullscreen:", error);
            return false;
        }
    });
    // Browser meeting detection
    electron_1.ipcMain.handle("browser-meeting-detected", async (_event, meetingUrl) => {
        electron_log_1.default.info("[IPC] Browser meeting detected:", meetingUrl);
        // This will be called from the renderer when a new meeting is detected
        // The notification logic will be handled in the renderer process
        return true;
    });
    electron_1.ipcMain.handle("liveview:get-mode", async () => currentLiveViewMode);
    electron_1.ipcMain.handle("liveview:get-preferred-mode", async () => (0, live_view_mode_store_1.getPreferredLiveViewMode)());
    electron_1.ipcMain.handle("liveview:set-preferred-mode", async (_event, mode) => {
        (0, live_view_mode_store_1.setPreferredLiveViewMode)(mode);
    });
    electron_1.ipcMain.handle("liveview:is-window-alive", async () => {
        return !!(windowing_1.liveWindow && !windowing_1.liveWindow.isDestroyed());
    });
    electron_1.ipcMain.handle("liveview:get-meeting-id", async () => {
        return (0, windowing_1.getCurrentLiveMeetingId)();
    });
    electron_1.ipcMain.handle("liveview:set-mode", async (_event, mode, persist) => {
        try {
            await applyLiveViewMode(mode);
            // Only explicit user toggles (persist === true) update the saved
            // preference. System transitions — the meeting-end switch to full and
            // the full window's close-to-compact fallback — are not mode choices.
            if (persist) {
                (0, live_view_mode_store_1.setPreferredLiveViewMode)(mode);
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to set live view mode:", error);
        }
    });
    electron_1.ipcMain.handle("liveview:show-window", async () => {
        try {
            if (windowing_1.liveWindow && !windowing_1.liveWindow.isDestroyed()) {
                electron_log_1.default.info("[LIVEVIEW] Showing live window");
                windowing_1.liveWindow.show();
                windowing_1.liveWindow.focus();
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to show live window:", error);
        }
    });
    electron_1.ipcMain.handle("liveview:enter-fullscreen", async () => {
        try {
            await (0, windowing_1.enterLiveFullWindowFullscreen)();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to enter fullscreen on live window:", error);
        }
    });
    // Meeting end animation window
    electron_1.ipcMain.handle("meeting-end-animation:show", async () => {
        try {
            (0, windowing_1.showMeetingEndAnimationWindow)();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to show meeting end animation:", error);
        }
    });
    electron_1.ipcMain.handle("meeting-end-animation:hide", async () => {
        try {
            (0, windowing_1.hideMeetingEndAnimationWindow)();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to hide meeting end animation:", error);
        }
    });
    // Per-window: toggle mouse event passthrough (for transparent areas)
    electron_1.ipcMain.handle("window-set-ignore-mouse-events", async (event, ignore, forward) => {
        try {
            const win = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (!win || win.isDestroyed())
                return;
            if (forward) {
                win.setIgnoreMouseEvents(ignore, { forward: true });
            }
            else {
                win.setIgnoreMouseEvents(ignore);
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] setIgnoreMouseEvents failed:", error);
        }
    });
    // Resize window to match content size (top-centered), clamped to work area
    electron_1.ipcMain.handle("live-bar:get-side", () => (0, windowing_1.getLiveBarDockSide)());
    electron_1.ipcMain.on("live-bar:drag-start", () => {
        (0, windowing_1.startLiveBarManualDrag)();
    });
    electron_1.ipcMain.on("live-bar:drag-end", () => {
        (0, windowing_1.endLiveBarManualDrag)();
    });
    electron_1.ipcMain.on("live-bar:dock", (_event, side) => {
        if (side === "bottom" ||
            side === "top" ||
            side === "left" ||
            side === "right") {
            (0, windowing_1.snapLiveBarToSide)(side);
        }
    });
    electron_1.ipcMain.handle("window-resize-to-content", async (event, width, height) => {
        try {
            resizeToStoredContent(event.sender, { width, height });
            // Keep the live content view filling the resized window (no clipping
            // while the user drags a panel card larger than the creation size).
            (0, windowing_1.syncLiveViewBounds)();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] window-resize-to-content failed:", error);
        }
    });
    // Snap window to top edge of the current work area (used for minimized sliver)
    electron_1.ipcMain.handle("window-snap-to-top", async (event) => {
        try {
            const win = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (!win || win.isDestroyed())
                return;
            const prev = win.getBounds();
            const display = electron_1.screen.getDisplayMatching(prev);
            const wa = display.workArea;
            const y = wa.y; // flush to top of work area (no extra margin)
            win.setBounds({ x: prev.x, y, width: prev.width, height: prev.height }, false);
        }
        catch (error) {
            electron_log_1.default.error("[IPC] window-snap-to-top failed:", error);
        }
    });
    electron_1.ipcMain.handle("window-move-by", async (event, dx, dy) => {
        try {
            const win = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (!win || win.isDestroyed())
                return;
            const prev = win.getBounds();
            const display = electron_1.screen.getDisplayMatching(prev);
            const wa = display.workArea;
            let x = prev.x + Math.round(dx);
            let y = prev.y + Math.round(dy);
            // clamp to work area
            x = Math.max(wa.x, Math.min(x, wa.x + wa.width - prev.width));
            y = Math.max(wa.y, Math.min(y, wa.y + wa.height - prev.height));
            win.setBounds({ x, y, width: prev.width, height: prev.height }, false);
        }
        catch (error) {
            electron_log_1.default.error("[IPC] window-move-by failed:", error);
        }
    });
    // Content protection (hide floating dock when screen sharing)
    electron_1.ipcMain.handle("window-set-content-protection", async (_event, enable) => {
        try {
            electron_log_1.default.info("[IPC] Setting content protection:", enable);
            // Use centralized setter which will apply to existing windows
            // and persist for future windows
            (0, windowing_1.setContentProtectionEnabled)(enable);
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to set content protection:", error);
        }
    });
    // Open live window
    electron_1.ipcMain.handle("window-open-live", async (_event, url, mode) => {
        try {
            electron_log_1.default.info("[IPC] Opening live window with URL:", url, "mode:", mode);
            (0, windowing_1.createChildWindow)(url, true, mode);
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to open live window:", error);
            throw error;
        }
    });
    // Launch at startup (login item)
    electron_1.ipcMain.handle("app-set-login-item-settings", async (_event, enable) => {
        try {
            // Skip in development/non-packaged sessions
            if (!electron_1.app.isPackaged) {
                electron_log_1.default.info("[IPC] Skipping login item settings in non-packaged session");
                return;
            }
            electron_log_1.default.info("[IPC] Setting login item settings:", enable);
            electron_1.app.setLoginItemSettings({
                openAtLogin: enable,
                openAsHidden: enable, // macOS only: start in hidden state when auto-launched
                args: enable ? ["--hidden"] : [],
            });
            electron_log_1.default.info("[IPC] Login item settings after write:", electron_1.app.getLoginItemSettings(process.platform === "win32" ? { args: ["--hidden"] } : {}));
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to set login item settings:", error);
        }
    });
    electron_1.ipcMain.handle("app-get-login-item-settings", async () => {
        try {
            // Always return false in development/non-packaged sessions
            if (!electron_1.app.isPackaged) {
                return false;
            }
            // On Windows, getLoginItemSettings must be called with the same
            // args used in setLoginItemSettings, otherwise the registry lookup
            // won't find the entry and always returns openAtLogin: false.
            const settings = electron_1.app.getLoginItemSettings(process.platform === "win32" ? { args: ["--hidden"] } : {});
            electron_log_1.default.info("[IPC] Login item settings:", settings);
            return settings.openAtLogin;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to get login item settings:", error);
            return false;
        }
    });
    electron_1.ipcMain.handle("app-set-quick-note-shortcut", async (event, enabled, key) => {
        if (!(0, desktop_logged_in_1.isMainDesktopLoginSender)(event.sender, windowing_1.mainWindow)) {
            electron_log_1.default.info("[QuickNote] Ignoring shortcut update from a non-main window", {
                senderId: event.sender.id,
            });
            return;
        }
        (0, quick_note_shortcut_1.setQuickNoteShortcut)(enabled, key);
    });
    electron_1.ipcMain.handle("clipboard-write-text", async (_event, text) => {
        electron_1.clipboard.writeText(text);
    });
    electron_1.ipcMain.handle("clipboard-write-markdown", async (_event, text) => {
        (0, dictation_clipboard_1.writeMarkdownClipboard)(text);
    });
    // Comfortably past a 2400×1260 PNG of the milestone card, and far short of
    // anything that would trouble the main process.
    // Data URL rather than a buffer: the renderer produces the PNG with a canvas,
    // and nativeImage reads that format directly. The caption rides along so a
    // paste into a text-only field still carries the link.
    electron_1.ipcMain.handle("clipboard-write-image", async (event, dataUrl, text) => {
        if (event.sender !== windowing_1.mainWindow?.webContents)
            return false;
        // Validated before decoding, so nothing unbounded reaches the decoder.
        if (!(0, clipboard_image_1.isAcceptableClipboardImage)(dataUrl))
            return false;
        const image = electron_1.nativeImage.createFromDataURL(dataUrl);
        if (image.isEmpty()) {
            electron_log_1.default.warn("[IPC] Clipboard image rejected: decoded to nothing");
            return false;
        }
        if ((0, clipboard_image_1.isAcceptableClipboardCaption)(text)) {
            electron_1.clipboard.write({ image, text: text });
            return true;
        }
        electron_1.clipboard.writeImage(image);
        return true;
    });
    electron_1.ipcMain.handle("clipboard-write-html", async (_event, html, text) => {
        electron_1.clipboard.write({ html, text });
    });
    electron_1.ipcMain.handle("app-get-system-idle-state", async (_event, idleThresholdSeconds = 60) => {
        try {
            const parsedThreshold = Number(idleThresholdSeconds);
            const threshold = Number.isFinite(parsedThreshold)
                ? Math.max(1, Math.floor(parsedThreshold))
                : 60;
            return electron_1.powerMonitor.getSystemIdleState(threshold);
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to read system idle state:", error);
            return "unknown";
        }
    });
    // Recording diagnostics: Windows 11 gives minimized and hidden windows
    // coarser timers, and battery power is suspected of the same effect. Both
    // can make a recording process audio slower than real time.
    electron_1.ipcMain.handle("app-get-window-power-state", (event) => ({
        windowState: windowDisplayState(electron_1.BrowserWindow.fromWebContents(event.sender)),
        onBatteryPower: electron_1.powerMonitor.isOnBatteryPower(),
    }));
    // CPU and memory per process, free RAM and the OS build, for the same
    // heartbeat. Primed now so the first reading covers the time since launch.
    (0, process_health_1.primeProcessMetrics)();
    electron_1.ipcMain.handle("app-get-process-health", (event) => (0, process_health_1.getProcessHealth)(event.sender.getOSProcessId()));
    // Opts the recording's processes out of Windows power throttling for the
    // length of a recording; see recording-power-policy.ts.
    const powerPolicyModes = [
        "unthrottled",
        "default",
    ];
    electron_1.ipcMain.handle("app-set-recording-power-policy", (event, mode) => powerPolicyModes.includes(mode)
        ? (0, recording_power_policy_1.setRecordingPowerPolicy)(event.sender, mode)
        : null);
    // Forward powerMonitor events to renderer for user-presence detection
    // Forward user-presence events to renderer (covers macOS + Windows)
    electron_1.powerMonitor.on("unlock-screen", () => {
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            windowing_1.mainWindow.webContents.send("power:user-became-active");
        }
    });
    electron_1.powerMonitor.on("user-did-become-active", () => {
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            windowing_1.mainWindow.webContents.send("power:user-became-active");
        }
    });
    electron_1.powerMonitor.on("resume", () => {
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            windowing_1.mainWindow.webContents.send("power:user-became-active");
        }
    });
    electron_1.ipcMain.handle("window-get-scale-factor", async (event) => {
        try {
            const win = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (!win || win.isDestroyed()) {
                // Fallback to primary display if window is not available
                return electron_1.screen.getPrimaryDisplay().scaleFactor;
            }
            const display = electron_1.screen.getDisplayMatching(win.getBounds());
            return display.scaleFactor;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] window-get-scale-factor failed:", error);
            return 1; // Fallback to 1x scaling
        }
    });
    electron_1.ipcMain.handle("window-get-zoom-factor", async (event) => {
        try {
            const zoomFactor = event.sender.getZoomFactor();
            return zoomFactor || 1;
        }
        catch (error) {
            electron_log_1.default.error("[IPC] window-get-zoom-factor failed:", error);
            return 1;
        }
    });
    // Audio Monitor IPC handlers
    electron_1.ipcMain.handle("audio-monitor-start", async () => {
        try {
            electron_log_1.default.info("[IPC] Starting audio monitor");
            return await audio_monitor_1.audioMonitor.start();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to start audio monitor:", error);
            return false;
        }
    });
    // Event-driven mode: enrich browser mic_started events with URL lookup
    const useEventDrivenMode = (0, audio_loopback_1.shouldUseCoreAudioTap)() || process.platform === "win32";
    // Setup audio event forwarding to renderer processes
    audio_monitor_1.audioMonitor.onAudioEvent(async (event) => {
        let enrichedEvent = event;
        // In event-driven mode, enrich mic_started events from browser processes
        if (useEventDrivenMode && event.type === "mic_started" && browserListener) {
            const browserName = resolveBrowserName(event);
            if (browserName) {
                try {
                    const result = await browserListener.lookupMeetingUrlForBrowser(browserName);
                    enrichedEvent = {
                        ...event,
                        browserName,
                        meetingUrl: result?.url,
                        enriched: true,
                    };
                    if (result?.url)
                        (0, meeting_url_store_1.setDetectedMeetingUrl)(result.url);
                    electron_log_1.default.info("[IPC] Enriched audio event with URL lookup", {
                        browserName,
                        meetingUrl: result?.url ?? "(none)",
                        pid: event.processID,
                    });
                }
                catch (error) {
                    electron_log_1.default.error("[IPC] Failed to enrich audio event:", error);
                    enrichedEvent = { ...event, browserName, enriched: true };
                }
            }
        }
        // Forward (enriched or raw) audio event to all windows
        if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
            windowing_1.mainWindow.webContents.send("audio-event", enrichedEvent);
        }
        if (windowing_1.liveWindow && !windowing_1.liveWindow.isDestroyed()) {
            windowing_1.liveWindow.webContents.send("audio-event", enrichedEvent);
        }
    });
    electron_1.ipcMain.handle("audio-monitor-stop", async () => {
        try {
            electron_log_1.default.info("[IPC] Stopping audio monitor");
            audio_monitor_1.audioMonitor.stop();
            return !audio_monitor_1.audioMonitor.isActive();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to stop audio monitor:", error);
            return false;
        }
    });
    electron_1.ipcMain.handle("audio-monitor-request-system-audio-permission", async () => {
        try {
            electron_log_1.default.info("[IPC] Requesting system audio permission");
            return await audio_monitor_1.audioMonitor.requestSystemAudioPermission();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to request system audio permission:", error);
            return false;
        }
    });
    electron_1.ipcMain.handle("audio-monitor-is-active", async () => {
        try {
            return audio_monitor_1.audioMonitor.isActive();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to check audio monitor status:", error);
            return false;
        }
    });
    // Audio loopback helper - check if CoreAudioTap should be used
    electron_1.ipcMain.handle("audio-loopback:should-use-core-audio-tap", () => {
        return (0, audio_loopback_1.shouldUseCoreAudioTap)();
    });
    // Permissions IPC handlers
    electron_1.ipcMain.handle("permissions:check", async (_event, type) => {
        try {
            return await (0, permissions_1.checkPermissionAsync)(type);
        }
        catch (error) {
            electron_log_1.default.error(`[IPC] Failed to check ${type} permission:`, error);
            return "unknown";
        }
    });
    electron_1.ipcMain.handle("permissions:check-all", async () => {
        try {
            return await (0, permissions_1.checkAllPermissions)();
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to check all permissions:", error);
            return {
                microphone: "unknown",
                screen: "unknown",
                systemAudio: "unknown",
            };
        }
    });
    electron_1.ipcMain.handle("permissions:request", async (_event, type) => {
        try {
            return await (0, permissions_1.requestPermission)(type);
        }
        catch (error) {
            electron_log_1.default.error(`[IPC] Failed to request ${type} permission:`, error);
            return false;
        }
    });
    electron_1.ipcMain.handle("permissions:open-settings", async (_event, type) => {
        try {
            (0, permissions_1.openPermissionSettings)(type);
        }
        catch (error) {
            electron_log_1.default.error(`[IPC] Failed to open ${type} settings:`, error);
        }
    });
    // Realtime streaming IPC bridge (renderer -> main)
    electron_1.ipcMain.handle("streaming:start", async (_event, config) => {
        try {
            await streamingManager.start(config, _event.sender);
            return { success: true };
        }
        catch (error) {
            electron_log_1.default.error("[IPC] streaming:start failed:", error);
            const code = error instanceof Error
                ? error.code
                : undefined;
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                ...(code ? { code } : {}),
            };
        }
    });
    electron_1.ipcMain.on("streaming:chunk", (_event, chunk) => {
        streamingManager.sendChunk(chunk, _event.sender);
    });
    electron_1.ipcMain.on("streaming:mic-activity", (_event, micActivity) => {
        streamingManager.sendMicActivity(micActivity, _event.sender);
    });
    electron_1.ipcMain.on("streaming:token-response", (event, response) => {
        streamingManager.handleTokenResponse(response, event.sender);
    });
    electron_1.ipcMain.handle("streaming:end", async (_event) => {
        streamingManager.sendEnd(_event.sender);
    });
    electron_1.ipcMain.handle("streaming:stop", async (_event) => {
        await streamingManager.stop(_event.sender);
    });
    electron_1.ipcMain.handle("streaming:get-health", () => {
        return streamingManager.getHealth();
    });
    electron_1.ipcMain.handle("network:is-reachable", () => (0, network_reachability_1.isReachable)({ request: network_reachability_requester_1.electronNetRequester }));
    // Glass underlay IPC handlers (macOS only)
    electron_1.ipcMain.on("glass:upsert", (event, id, rect) => {
        try {
            // Determine which window is calling
            const callingWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
            const isMainWindow = callingWindow === windowing_1.mainWindow;
            const glassManager = isMainWindow ? windowing_1.mainGlassManager : windowing_1.liveGlassManager;
            if (glassManager) {
                glassManager.upsert(id, rect);
            }
            else {
                electron_log_1.default.warn(`[IPC] glassManager not initialized for ${isMainWindow ? "main" : "live"} window`);
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] glass:upsert failed:", error);
        }
    });
    electron_1.ipcMain.on("glass:hide", (event, id) => {
        try {
            const callingWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
            const isMainWindow = callingWindow === windowing_1.mainWindow;
            const glassManager = isMainWindow ? windowing_1.mainGlassManager : windowing_1.liveGlassManager;
            if (glassManager) {
                glassManager.hide(id);
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] glass:hide failed:", error);
        }
    });
    electron_1.ipcMain.on("glass:remove", (event, id) => {
        try {
            const callingWindow = electron_1.BrowserWindow.fromWebContents(event.sender);
            const isMainWindow = callingWindow === windowing_1.mainWindow;
            const glassManager = isMainWindow ? windowing_1.mainGlassManager : windowing_1.liveGlassManager;
            if (glassManager) {
                glassManager.remove(id);
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] glass:remove failed:", error);
        }
    });
    electron_1.ipcMain.handle("glass:get-window-position", async (event) => {
        try {
            const win = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (win && !win.isDestroyed()) {
                const [x, y] = win.getPosition();
                return { x, y };
            }
            else {
                return { x: 0, y: 0 };
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] glass:get-window-position failed:", error);
            return { x: 0, y: 0 };
        }
    });
    // Logging IPC handlers
    electron_1.ipcMain.on("logger:write", (_event, level, tag, message, metadata) => {
        // Skip sensitive logs (case-insensitive)
        const lowerMessage = message.toLowerCase();
        const lowerTag = tag.toLowerCase();
        // Skip Apollo GraphQL errors
        if (lowerMessage.includes("[apollo] graphql error") ||
            lowerMessage.includes("graphql error:") ||
            lowerTag.includes("apollo")) {
            return;
        }
        // Skip auth-store logs (contains sensitive authentication data)
        if (lowerMessage.includes("[auth-store]") ||
            lowerTag.includes("auth-store")) {
            return;
        }
        // Sanitize metadata before logging
        const sanitizedMetadata = metadata
            ? (0, logger_1.sanitizeMetadata)(metadata)
            : undefined;
        const formattedMessage = `[${tag}] ${message}`;
        switch (level) {
            case "info":
                logger_1.logger.info(formattedMessage, sanitizedMetadata);
                break;
            case "warning":
                logger_1.logger.warn(formattedMessage, sanitizedMetadata);
                break;
            case "error":
                logger_1.logger.error(formattedMessage, sanitizedMetadata);
                break;
            case "debug":
                logger_1.logger.debug(formattedMessage, sanitizedMetadata);
                break;
        }
    });
    // Get log files list
    electron_1.ipcMain.handle("logger:get-log-files", async () => {
        try {
            return (0, logger_1.getLogFiles)();
        }
        catch (error) {
            logger_1.logger.error("[IPC] logger:get-log-files failed:", error);
            return [];
        }
    });
    // Capture console logs in development
    if (process.env.NODE_ENV === "development") {
        electron_1.ipcMain.on("logger:console", (_event, level, ...args) => {
            const message = args
                .map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg))
                .join(" ");
            switch (level) {
                case "log":
                case "info":
                    logger_1.logger.info(`[Console] ${message}`);
                    break;
                case "warn":
                    logger_1.logger.warn(`[Console] ${message}`);
                    break;
                case "error":
                    logger_1.logger.error(`[Console] ${message}`);
                    break;
                case "debug":
                    logger_1.logger.debug(`[Console] ${message}`);
                    break;
            }
        });
    }
    // Auto-updater IPC handlers
    electron_1.ipcMain.handle("updater:get-version", async () => {
        return electron_1.app.getVersion();
    });
    electron_1.ipcMain.handle("updater:get-status", async () => {
        return (0, download_and_update_1.getUpdateStatus)();
    });
    electron_1.ipcMain.handle("updater:check-for-updates", async () => {
        try {
            (0, download_and_update_1.checkForUpdates)("manual");
            return { success: true };
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to check for updates:", error);
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle("updater:install-update", async () => {
        try {
            (0, download_and_update_1.installUpdate)();
            return { success: true };
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to install update:", error);
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle("updater:clear-post-update-release-notes", async () => {
        try {
            (0, restart_state_1.clearPostUpdateReleaseNotes)();
            return { success: true };
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to clear update release notes:", error);
            return { success: false, error: String(error) };
        }
    });
    // Single calendar sync feeds both the tray and the auto-updater. The
    // renderer already diffs and only invokes this when the payload changes, so
    // every call here represents a real state change worth logging.
    electron_1.ipcMain.handle("calendar:sync", (_event, state) => {
        try {
            const events = Array.isArray(state?.events) ? state.events : [];
            const liveMeetings = Array.isArray(state?.liveMeetings)
                ? state.liveMeetings
                : [];
            electron_log_1.default.info("[CALENDAR] Sync received", {
                upcoming: events.length,
                live: liveMeetings.length,
                isLoadingEvents: Boolean(state?.isLoadingEvents),
            });
            (0, tray_1.updateTrayCalendarState)({ upcomingEvents: events, liveMeetings });
            if ((0, platform_1.isSilentAutoRestartSupported)()) {
                (0, auto_install_1.setAutoRestartCalendarEvents)(events, Boolean(state?.isLoadingEvents));
            }
            return { success: true };
        }
        catch (error) {
            electron_log_1.default.error("[IPC] Failed to sync desktop calendar:", error);
            return { success: false, error: String(error) };
        }
    });
    // File system IPC handlers for recording storage
    const getRecordingsDir = () => path.join(electron_1.app.getPath("userData"), "recordings");
    const getLogsDir = () => electron_1.app.isPackaged
        ? electron_1.app.getPath("logs")
        : path.join(electron_1.app.getPath("userData"), "logs");
    // Path confinement: only allow access within recordings and logs directories
    const allowedBaseDirs = () => [getRecordingsDir(), getLogsDir()];
    function assertAllowedPath(targetPath) {
        const resolved = path.resolve(targetPath);
        const allowed = allowedBaseDirs();
        if (!allowed.some((dir) => resolved.startsWith(dir + path.sep) || resolved === dir)) {
            throw new Error(`Path not allowed: must be within app recordings or logs directory`);
        }
    }
    electron_1.ipcMain.handle("fs:get-recordings-dir", async () => {
        const dir = getRecordingsDir();
        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });
        return dir;
    });
    electron_1.ipcMain.handle("fs:get-logs-dir", async () => {
        const dir = getLogsDir();
        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });
        return dir;
    });
    electron_1.ipcMain.handle("fs:mkdir", async (_event, dirPath) => {
        assertAllowedPath(dirPath);
        try {
            await fs.mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            electron_log_1.default.error("[IPC] fs:mkdir failed:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("fs:write-file", async (_event, filePath, data) => {
        assertAllowedPath(filePath);
        try {
            await fs.writeFile(filePath, Buffer.from(data));
        }
        catch (error) {
            electron_log_1.default.error("[IPC] fs:write-file failed:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("fs:append-file", async (_event, filePath, data) => {
        assertAllowedPath(filePath);
        try {
            await fs.appendFile(filePath, Buffer.from(data));
        }
        catch (error) {
            electron_log_1.default.error("[IPC] fs:append-file failed:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("fs:read-file", async (_event, filePath) => {
        assertAllowedPath(filePath);
        try {
            const buffer = await fs.readFile(filePath);
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }
        catch (error) {
            electron_log_1.default.error("[IPC] fs:read-file failed:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("fs:read-file-range", async (_event, filePath, start, length) => {
        assertAllowedPath(filePath);
        try {
            const fileHandle = await fs.open(filePath, "r");
            try {
                const buffer = Buffer.alloc(length);
                const { bytesRead } = await fileHandle.read(buffer, 0, length, start);
                return buffer.buffer.slice(0, bytesRead);
            }
            finally {
                await fileHandle.close();
            }
        }
        catch (error) {
            electron_log_1.default.error("[IPC] fs:read-file-range failed:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("fs:stat", async (_event, filePath) => {
        assertAllowedPath(filePath);
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                mtime: stats.mtimeMs,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
            };
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return null;
            }
            electron_log_1.default.error("[IPC] fs:stat failed:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("fs:exists", async (_event, filePath) => {
        assertAllowedPath(filePath);
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    });
    electron_1.ipcMain.handle("fs:unlink", async (_event, filePath) => {
        assertAllowedPath(filePath);
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code !== "ENOENT") {
                electron_log_1.default.error("[IPC] fs:unlink failed:", error);
                throw error;
            }
        }
    });
    electron_1.ipcMain.handle("fs:readdir", async (_event, dirPath) => {
        assertAllowedPath(dirPath);
        try {
            return await fs.readdir(dirPath);
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return [];
            }
            electron_log_1.default.error("[IPC] fs:readdir failed:", error);
            throw error;
        }
    });
    // Shell IPC handlers
    electron_1.ipcMain.handle("shell:open-path", async (_event, pathToOpen) => {
        assertAllowedPath(pathToOpen);
        return electron_1.shell.openPath(pathToOpen);
    });
    electron_1.ipcMain.handle("shell:show-item-in-folder", (_event, pathToShow) => {
        assertAllowedPath(pathToShow);
        electron_1.shell.showItemInFolder(pathToShow);
    });
    // Clear host resolver (DNS) cache
    // Note: Due to Electron limitations, this may not affect the renderer process's
    // DNS cache directly, but the full socket disconnect/reconnect cycle in the
    // renderer should still help establish fresh connections.
    electron_1.ipcMain.handle("clear-host-resolver-cache", async (event) => {
        try {
            const win = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (win && !win.isDestroyed() && win.webContents.session) {
                await win.webContents.session.clearHostResolverCache();
                electron_log_1.default.info("[IPC] Host resolver cache cleared");
            }
        }
        catch (error) {
            electron_log_1.default.warn("[IPC] Failed to clear host resolver cache:", error);
        }
    });
    // Meeting chat keyboard automation (macOS)
    electron_1.ipcMain.handle("meetings:send-chat", async (_event, browser, message) => {
        electron_log_1.default.info("[IPC] meetings:send-chat invoked", { browser });
        const { sendGoogleMeetChatViaKeyboard, BROWSER_PROCESS_NAMES } = await import("./meeting-chat-keyboard.js");
        const processName = BROWSER_PROCESS_NAMES[browser];
        if (!processName) {
            electron_log_1.default.warn("[IPC] meetings:send-chat unknown browser", { browser });
            return { success: false, error: `Unknown browser: ${browser}` };
        }
        electron_log_1.default.info("[IPC] meetings:send-chat resolved process", {
            browser,
            processName,
        });
        const result = await sendGoogleMeetChatViaKeyboard(processName, message);
        electron_log_1.default.info("[IPC] meetings:send-chat result", result);
        return result;
    });
    electron_1.ipcMain.handle("meetings:send-zoom-native-chat", async (_event, message) => {
        electron_log_1.default.info("[IPC] meetings:send-zoom-native-chat invoked");
        const { sendZoomNativeChatViaKeyboard } = await import("./meeting-chat-keyboard.js");
        const result = await sendZoomNativeChatViaKeyboard(message);
        electron_log_1.default.info("[IPC] meetings:send-zoom-native-chat result", result);
        return result;
    });
    electron_1.ipcMain.handle("meetings:is-keyboard-available", async () => {
        const { isKeyboardModuleAvailable, hasAccessibilityPermission } = await import("./meeting-chat-keyboard.js");
        const moduleAvail = isKeyboardModuleAvailable();
        const accessPerm = hasAccessibilityPermission();
        electron_log_1.default.info("[IPC] meetings:is-keyboard-available", {
            moduleAvail,
            accessPerm,
        });
        return moduleAvail && accessPerm;
    });
    electron_1.ipcMain.handle("meetings:check-accessibility-permission", async () => {
        const { hasAccessibilityPermission } = await import("./meeting-chat-keyboard.js");
        return hasAccessibilityPermission();
    });
    electron_1.ipcMain.handle("meetings:open-accessibility-settings", async () => {
        const { openPermissionSettings } = await import("./permissions.js");
        openPermissionSettings("accessibility");
    });
    electron_1.ipcMain.handle("meetings:request-accessibility-permission", async () => {
        const { requestAccessibilityPermission } = await import("./permissions.js");
        return requestAccessibilityPermission();
    });
    // Audio playback. The renderer runs on a privileged scheme with web security
    // enabled in packaged builds, which blocks file:// media, so send the bytes.
    electron_1.ipcMain.handle("audio:get-consent-message", async () => {
        const { isDev } = await import("./utils.js");
        const consentAudioPath = isDev()
            ? path.join("assets", CONSENT_AUDIO_FILE_NAME)
            : path.join(process.resourcesPath, "assets", CONSENT_AUDIO_FILE_NAME);
        try {
            return await fs.readFile(consentAudioPath);
        }
        catch (error) {
            electron_log_1.default.warn("[IPC] Consent audio file not readable", {
                consentAudioPath,
                error,
            });
            return null;
        }
    });
}
//# sourceMappingURL=ipc.js.map
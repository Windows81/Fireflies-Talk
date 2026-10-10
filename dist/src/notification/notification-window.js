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
exports.showNotificationWindow = showNotificationWindow;
exports.setupNotificationHandlers = setupNotificationHandlers;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const url_1 = require("url");
const utils_1 = require("../utils");
const electron_log_1 = __importDefault(require("electron-log"));
const windowing_1 = require("../windowing");
const constants_1 = require("../constants");
const meeting_url_store_1 = require("../meeting-url-store");
const macos_spaces_1 = require("../macos-spaces");
function parsePid(value) {
    const pid = value ? Number(value) : NaN;
    return Number.isFinite(pid) ? pid : undefined;
}
/**
 * Validate and sanitize notification action URLs to prevent open redirects and XSS
 */
function isValidActionUrl(actionUrl) {
    // Allow internal app routes (start with /)
    if (actionUrl.startsWith("/") && !actionUrl.startsWith("//")) {
        return true;
    }
    // Allow app protocol URLs
    if (actionUrl.startsWith(constants_1.APP_ORIGIN) ||
        actionUrl.startsWith(constants_1.DEEPLINK_PROTOCOL)) {
        return true;
    }
    // For HTTP(S) URLs, validate against whitelist
    if (actionUrl.startsWith("http://") || actionUrl.startsWith("https://")) {
        try {
            const url = new URL(actionUrl);
            const allowedDomains = ["fireflies.ai", "fireflies.dev"];
            return allowedDomains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
        }
        catch {
            return false;
        }
    }
    // Reject all other schemes (javascript:, file:, etc.)
    return false;
}
/** All currently visible notification windows, ordered by creation time (oldest first). */
const notificationWindows = new Map();
/**
 * Recent notification content keys with timestamps for deduplication.
 * Prevents showing the same notification twice within a short window.
 */
const NOTIFICATION_DEDUP_MS = 5000;
const recentNotificationKeys = new Map();
function getNotificationContentKey(title, actionUrl, template) {
    return `${template}:${title}:${actionUrl}`;
}
function isDuplicateNotification(title, actionUrl, template) {
    const key = getNotificationContentKey(title, actionUrl, template);
    const now = Date.now();
    // Clean expired entries
    for (const [k, ts] of recentNotificationKeys) {
        if (now - ts > NOTIFICATION_DEDUP_MS) {
            recentNotificationKeys.delete(k);
        }
    }
    if (recentNotificationKeys.has(key)) {
        return true;
    }
    recentNotificationKeys.set(key, now);
    return false;
}
/**
 * Visual gap between notification cards (not windows).
 * Windows overlap their transparent padding areas to achieve this tight spacing.
 */
const CARD_GAP = 10;
const NOTIFICATION_MARGIN = process.platform === "win32" ? 30 : 0;
const CONTENT_WIDTH = 406;
// Extra space for close button (14px) + shadow (15px) + buffer (10px)
const WINDOW_PADDING = 39;
/** Return a unique id for each notification. */
function generateNotificationId() {
    return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
/** Calculate content height for a given template / options. */
function getContentHeight(template, actionUrl, options) {
    if (template === "upcoming")
        return 118;
    if (template === "calendar_event")
        return 136;
    if (template === "meeting") {
        const hasSecondary = Boolean(options?.secondaryAction?.url && options?.secondaryAction?.text);
        return hasSecondary ? 180 : 146;
    }
    // Default template: shorter height when there's no action button
    return actionUrl ? 118 : 86;
}
/**
 * Re-position all notification windows as a vertical column.
 * Oldest notification sits at the top; newest at the bottom.
 */
function repositionWindows() {
    const cursorPoint = electron_1.screen.getCursorScreenPoint();
    const display = electron_1.screen.getDisplayNearestPoint(cursorPoint);
    const { x: displayX, y: displayY, width: screenWidth } = display.workArea;
    const windowWidth = CONTENT_WIDTH + WINDOW_PADDING;
    const x = displayX + screenWidth - windowWidth - NOTIFICATION_MARGIN;
    let currentY = displayY + NOTIFICATION_MARGIN;
    for (const [, entry] of notificationWindows) {
        if (entry.window.isDestroyed())
            continue;
        const windowHeight = entry.height + WINDOW_PADDING;
        entry.window.setBounds({
            x,
            y: currentY,
            width: windowWidth,
            height: windowHeight,
        });
        // Advance by content height + visual gap (windows overlap in their transparent padding)
        currentY += entry.height + CARD_GAP;
    }
}
/** Find notification id by webContents id of the sender. */
function findNotificationBySender(senderWebContentsId) {
    for (const [id, entry] of notificationWindows) {
        if (!entry.window.isDestroyed() &&
            entry.window.webContents.id === senderWebContentsId) {
            return [id, entry];
        }
    }
    return null;
}
/** Close and remove a notification entry by id. */
function closeNotificationById(id) {
    const entry = notificationWindows.get(id);
    if (entry) {
        if (entry.atopInterval)
            clearInterval(entry.atopInterval);
        if (!entry.window.isDestroyed())
            entry.window.close();
        // Removal from map happens in the "closed" handler
    }
}
function showNotificationWindow(title, body, actionUrl, actionText, options) {
    const template = options?.template ?? "default";
    // Deduplicate: skip if an identical notification was shown recently
    const primaryUrl = options?.primaryAction?.url ?? actionUrl;
    if (isDuplicateNotification(title, primaryUrl, template)) {
        electron_log_1.default.info("[NOTIFICATION] Skipping duplicate notification", title, primaryUrl);
        return;
    }
    const id = generateNotificationId();
    electron_log_1.default.info("[NOTIFICATION] Creating notification window", id);
    const contentHeight = getContentHeight(template, actionUrl, options);
    const windowWidth = CONTENT_WIDTH + WINDOW_PADDING;
    const windowHeight = contentHeight + WINDOW_PADDING;
    // Position below all existing notifications
    const cursorPoint = electron_1.screen.getCursorScreenPoint();
    const display = electron_1.screen.getDisplayNearestPoint(cursorPoint);
    const { x: displayX, y: displayY, width: screenWidth } = display.workArea;
    const x = displayX + screenWidth - windowWidth - NOTIFICATION_MARGIN;
    let y = displayY + NOTIFICATION_MARGIN;
    // Stack below existing windows (advance by card height + visual gap)
    for (const [, entry] of notificationWindows) {
        if (!entry.window.isDestroyed()) {
            y += entry.height + CARD_GAP;
        }
    }
    const win = new electron_1.BrowserWindow({
        title: "", // workaround to unlist it from dock
        width: windowWidth,
        height: windowHeight,
        x,
        y,
        frame: false,
        transparent: true,
        type: "panel", // macOS panel type - doesn't activate app on click
        alwaysOnTop: true,
        hasShadow: false,
        closable: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        show: false,
        acceptFirstMouse: true, // Don't activate app on first mouse click (macOS)
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "..", "..", "preload.js"),
            webSecurity: !(0, utils_1.isDev)(),
            sandbox: !(0, utils_1.isDev)(),
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            backgroundThrottling: false,
        },
    });
    // Make sure the window floats above other apps and spaces
    win.setAlwaysOnTop(true, "screen-saver");
    (0, macos_spaces_1.keepWindowOnActiveSpace)(win);
    // Build query string
    const qs = new URLSearchParams({
        title,
        body,
        platform: process.platform,
    });
    if (template === "meeting") {
        const primaryAction = options?.primaryAction || {
            text: actionText || "Action",
            url: actionUrl,
        };
        qs.set("primaryUrl", primaryAction.url);
        qs.set("primaryText", primaryAction.text);
        if (primaryAction.icon)
            qs.set("primaryIcon", primaryAction.icon);
        if (options?.secondaryAction) {
            qs.set("secondaryUrl", options.secondaryAction.url);
            qs.set("secondaryText", options.secondaryAction.text);
            if (options.secondaryAction.icon) {
                qs.set("secondaryIcon", options.secondaryAction.icon);
            }
        }
        if (options?.titleIcon)
            qs.set("titleIcon", options.titleIcon);
        if (options?.orText)
            qs.set("orText", options.orText);
    }
    else if (template === "upcoming" && options?.upcoming) {
        const u = options.upcoming;
        qs.set("meetingName", u.meetingName);
        qs.set("eventId", u.eventId);
        if (u.iCalUID)
            qs.set("iCalUID", u.iCalUID);
        if (u.calendarType)
            qs.set("calendarType", u.calendarType);
        qs.set("hasMeetingPrep", String(u.hasMeetingPrep));
        qs.set("hasAutoJoin", String(u.hasAutoJoin));
        if (u.prepUrl)
            qs.set("prepUrl", u.prepUrl);
    }
    else if (template === "calendar_event" && options?.calendarEvent) {
        const c = options.calendarEvent;
        qs.set("meetingName", c.meetingName);
        qs.set("eventId", c.eventId);
        qs.set("timeLabel", c.timeLabel);
        qs.set("primaryText", c.primaryAction.text);
        qs.set("primaryUrl", c.primaryAction.url);
        if (c.primaryAction.icon)
            qs.set("primaryIcon", c.primaryAction.icon);
        if (c.menuAction) {
            qs.set("menuText", c.menuAction.text);
            qs.set("menuUrl", c.menuAction.url);
            if (c.menuAction.icon)
                qs.set("menuIcon", c.menuAction.icon);
        }
    }
    else {
        if (actionUrl)
            qs.set("actionUrl", actionUrl);
        if (actionText)
            qs.set("actionText", actionText);
    }
    if (options?.notificationConfig) {
        if (options.notificationConfig.showProgress === false) {
            qs.set("showProgress", "false");
        }
        if (options.notificationConfig.showCloseAlways === true) {
            qs.set("showCloseAlways", "true");
        }
        if (options.notificationConfig.timeout != null) {
            qs.set("timeout", String(options.notificationConfig.timeout));
        }
    }
    // Resolve HTML file path
    let notificationFileName;
    if (template === "meeting") {
        notificationFileName = "notification-meeting.html";
    }
    else if (template === "upcoming") {
        notificationFileName = "notification-upcoming.html";
    }
    else if (template === "calendar_event") {
        notificationFileName = "notification-calendar-event.html";
    }
    else {
        notificationFileName = "notification.html";
    }
    const possiblePaths = [
        path.join(__dirname, notificationFileName),
        path.join(__dirname, "..", "..", "..", "src", "notification", notificationFileName),
        path.join(process.resourcesPath || __dirname, notificationFileName),
    ];
    let notificationHtmlPath = null;
    for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
            notificationHtmlPath = testPath;
            break;
        }
    }
    if (!notificationHtmlPath) {
        electron_log_1.default.error("[NOTIFICATION] Notification HTML not found at paths:", possiblePaths);
        if (!win.isDestroyed()) {
            win.destroy();
        }
        return;
    }
    if (template === "calendar_event") {
        const soundPath = path.join(path.dirname(notificationHtmlPath), "notification-sound.wav");
        if (fs.existsSync(soundPath)) {
            qs.set("soundUrl", (0, url_1.pathToFileURL)(soundPath).toString());
        }
    }
    const notificationUrl = `file://${notificationHtmlPath}?${qs.toString()}`;
    win.loadURL(notificationUrl).catch((error) => {
        electron_log_1.default.error("[NOTIFICATION] Failed to load notification HTML:", error);
        if (!win.isDestroyed()) {
            win.destroy();
        }
    });
    // Track the window
    const entry = { window: win, height: contentHeight };
    notificationWindows.set(id, entry);
    win.once("ready-to-show", () => {
        // Disallow any navigation/new windows from the notification content
        win.webContents.setWindowOpenHandler(() => ({
            action: "deny",
        }));
        win.webContents.on("will-navigate", (e) => e.preventDefault());
        win.setAlwaysOnTop(true, "screen-saver");
        // Use showInactive to prevent focus stealing
        win.showInactive();
        win.moveTop?.();
        // Periodically re-assert always-on-top and z-order while visible
        entry.atopInterval = setInterval(() => {
            if (win.isDestroyed()) {
                if (entry.atopInterval)
                    clearInterval(entry.atopInterval);
                return;
            }
            win.setAlwaysOnTop(true, "screen-saver");
            win.moveTop?.();
        }, 5000);
    });
    win.on("closed", () => {
        if (entry.atopInterval)
            clearInterval(entry.atopInterval);
        notificationWindows.delete(id);
        // Reposition remaining windows upward
        repositionWindows();
    });
}
// Setup IPC handler for notification actions
function setupNotificationHandlers() {
    electron_1.ipcMain.handle("notification-action", async (event, actionUrl) => {
        electron_log_1.default.info("[NOTIFICATION] ===== Action triggered:", actionUrl, "=====");
        // Find the source notification window that triggered this action
        const source = findNotificationBySender(event.sender.id);
        // Handle skip-auto-join: don't close source, update or replace it
        if (typeof actionUrl === "string" &&
            actionUrl.startsWith("/skip-auto-join")) {
            electron_log_1.default.info("[NOTIFICATION] Skip auto-join action:", actionUrl);
            // Validate URL
            if (!isValidActionUrl(actionUrl)) {
                electron_log_1.default.error("[NOTIFICATION] Rejected invalid skip-auto-join URL:", actionUrl);
                return false;
            }
            // Forward to renderer for the toggle mutation
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                windowing_1.mainWindow.webContents.send("notification-navigate", actionUrl);
            }
            const parsed = new URL(actionUrl, "https://local");
            const hasMeetingPrep = parsed.searchParams.get("hasMeetingPrep") === "true";
            if (hasMeetingPrep && source) {
                const [, sourceEntry] = source;
                // Transition the notification to meeting-prep-only state
                if (!sourceEntry.window.isDestroyed()) {
                    sourceEntry.window.webContents
                        .executeJavaScript("typeof switchToMeetingPrepOnly === 'function' && switchToMeetingPrepOnly()")
                        .catch((err) => electron_log_1.default.error("[NOTIFICATION] Failed to switch state:", err));
                }
            }
            else if (source) {
                // No meeting prep — close the source notification
                const [sourceId] = source;
                closeNotificationById(sourceId);
            }
            // Show info notification below
            showNotificationWindow("Notetaker will not auto-join the meeting", "You'll be notified when meeting starts.", "", "", {
                notificationConfig: {
                    showProgress: false,
                    showCloseAlways: true,
                    timeout: 5000,
                },
            });
            return true;
        }
        // Default: close the source notification window
        if (source) {
            const [, sourceEntry] = source;
            if (!sourceEntry.window.isDestroyed()) {
                sourceEntry.window.close();
            }
            // Deletion happens in the "closed" handler
        }
        if (typeof actionUrl === "string" && actionUrl.length > 0) {
            // Validate actionUrl to prevent open redirects and XSS
            if (!isValidActionUrl(actionUrl)) {
                electron_log_1.default.error("[NOTIFICATION] Rejected invalid or malicious actionUrl:", actionUrl);
                return false;
            }
            // All internal routes go through notification-navigate channel
            if (actionUrl.startsWith("/add-to-meeting")) {
                if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                    electron_log_1.default.info("[NOTIFICATION] Forwarding /add-to-meeting to renderer:", actionUrl);
                    // Check if URL is provided (browser detection) or empty (audio detection)
                    const parsed = new URL(actionUrl, "https://local");
                    const meetingUrl = parsed.searchParams.get("url") || "";
                    if (meetingUrl)
                        (0, meeting_url_store_1.setDetectedMeetingUrl)(meetingUrl);
                    windowing_1.mainWindow.webContents.send("notification-navigate", actionUrl);
                    electron_log_1.default.info("[NOTIFICATION] /add-to-meeting forwarded to renderer", {
                        hasMeetingUrl: Boolean(meetingUrl.trim()),
                    });
                    return true;
                }
            }
            // Handle capture audio action
            if (actionUrl.startsWith("/start-recording")) {
                if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                    const parsed = new URL(actionUrl, "https://local");
                    const payload = {
                        source: parsed.searchParams.get("source") || "notification",
                        trigger: parsed.searchParams.get("trigger") === "calendar_event"
                            ? "calendar_event"
                            : undefined,
                        title: parsed.searchParams.get("title") || undefined,
                        processId: parsePid(parsed.searchParams.get("processId")),
                        processName: parsed.searchParams.get("processName") || undefined,
                        parentProcessName: parsed.searchParams.get("parentProcessName") || undefined,
                        parentProcessId: parsePid(parsed.searchParams.get("parentProcessId")),
                        platform: parsed.searchParams.get("platform") || undefined,
                        displayName: parsed.searchParams.get("displayName") || undefined,
                        meetingUrl: parsed.searchParams.get("meetingUrl") || undefined,
                        joinUrl: parsed.searchParams.get("joinUrl") || undefined,
                        calendarEventId: parsed.searchParams.get("calendarEventId") || undefined,
                        iCalUID: parsed.searchParams.get("iCalUID") || undefined,
                    };
                    electron_log_1.default.info("[NOTIFICATION] Triggering start recording", payload);
                    windowing_1.mainWindow.webContents.send("start-recording", payload);
                    return true;
                }
            }
            // Forward all actions to renderer — it decides internal nav vs external open
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[NOTIFICATION] forwarding navigation to renderer:", actionUrl);
                windowing_1.mainWindow.webContents.send("notification-navigate", actionUrl);
            }
        }
        return true;
    });
    electron_1.ipcMain.handle("notification-close", async (event, actionUrl) => {
        try {
            electron_log_1.default.info("[NOTIFICATION] Close requested via IPC", { actionUrl });
            // If actionUrl is provided, it's a user dismiss - notify renderer for tracking
            if (actionUrl && windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                windowing_1.mainWindow.webContents.send("notification-dismissed", actionUrl);
            }
            // Find and close the source notification window
            const source = findNotificationBySender(event.sender.id);
            if (source) {
                const [sourceId] = source;
                closeNotificationById(sourceId);
                return true;
            }
            return false;
        }
        catch (e) {
            electron_log_1.default.error("[NOTIFICATION] Error while closing notification window:", e);
            return false;
        }
    });
    electron_1.ipcMain.handle("notification-focus", async (event) => {
        try {
            // Find the source notification window and focus it
            const source = findNotificationBySender(event.sender.id);
            if (source) {
                const [, entry] = source;
                if (!entry.window.isDestroyed()) {
                    entry.window.focus();
                    return true;
                }
            }
            return false;
        }
        catch (e) {
            electron_log_1.default.error("[NOTIFICATION] Error while focusing notification window:", e);
            return false;
        }
    });
    electron_1.ipcMain.handle("notification-report-height", async (event, height) => {
        try {
            const source = findNotificationBySender(event.sender.id);
            if (!source)
                return false;
            const [, entry] = source;
            if (entry.window.isDestroyed() || entry.height === height)
                return false;
            entry.height = height;
            const bounds = entry.window.getBounds();
            entry.window.setBounds({
                ...bounds,
                height: height + WINDOW_PADDING,
            });
            repositionWindows();
            return true;
        }
        catch (e) {
            electron_log_1.default.error("[NOTIFICATION] Error while resizing notification window:", e);
            return false;
        }
    });
}
//# sourceMappingURL=notification-window.js.map
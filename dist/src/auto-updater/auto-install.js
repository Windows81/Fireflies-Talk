"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isActiveRecording = isActiveRecording;
exports.setupDownloadedUpdateAutoInstall = setupDownloadedUpdateAutoInstall;
exports.setAutoRestartCalendarEvents = setAutoRestartCalendarEvents;
exports.scheduleDownloadedUpdateInstallCheck = scheduleDownloadedUpdateInstallCheck;
exports.clearDownloadedUpdateInstallCheck = clearDownloadedUpdateInstallCheck;
exports.getAutoUpdaterIdleBlocker = getAutoUpdaterIdleBlocker;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const recording_context_store_1 = require("../recording-context-store");
const windowing_1 = require("../windowing");
const platform_1 = require("./platform");
const AUTO_INSTALL_RETRY_INTERVAL = 60 * 1000; // 1 minute
const CALENDAR_AUTO_RESTART_BLOCK_WINDOW_MS = 20 * 60 * 1000;
const DEFAULT_CALENDAR_EVENT_DURATION_MS = 60 * 60 * 1000;
let autoRestartCalendarEvents = [];
let autoInstallListenersRegistered = false;
let deferredInstallTimeout = null;
let autoInstallOptions = null;
let autoInstallListenersCleanup = null;
function isActiveRecording() {
    return getRecordingDebugState().active;
}
function hasAliveLiveWindow() {
    return Boolean(windowing_1.liveWindow && !windowing_1.liveWindow.isDestroyed());
}
function setupDownloadedUpdateAutoInstall(options) {
    autoInstallOptions = options;
    if (autoInstallListenersRegistered) {
        return autoInstallListenersCleanup ?? cleanupDownloadedUpdateAutoInstall;
    }
    if (!(0, platform_1.isSilentAutoRestartSupported)()) {
        electron_log_1.default.info("[AUTO-UPDATER] Silent auto-restart setup skipped", {
            reason: "unsupported platform",
            state: getAutoInstallDebugState(),
        });
        return cleanupDownloadedUpdateAutoInstall;
    }
    autoInstallListenersRegistered = true;
    electron_log_1.default.info("[AUTO-UPDATER] Silent auto-restart listeners registered", {
        state: getAutoInstallDebugState(),
    });
    const schedule = (reason) => {
        scheduleDownloadedUpdateInstallCheck(reason);
    };
    const userDidResignActive = () => schedule("user inactive");
    const lockScreen = () => schedule("screen locked");
    const resume = () => schedule("system resumed");
    const mainWindowHidden = () => schedule("main window hidden");
    const mainWindowMinimized = () => schedule("main window minimized");
    const browserWindowBlur = (_event, window) => {
        if (window === windowing_1.mainWindow) {
            schedule("main window blurred");
        }
    };
    const cleanup = () => {
        electron_1.powerMonitor.removeListener("user-did-resign-active", userDidResignActive);
        electron_1.powerMonitor.removeListener("lock-screen", lockScreen);
        electron_1.powerMonitor.removeListener("resume", resume);
        electron_1.app.removeListener("browser-window-blur", browserWindowBlur);
        windowing_1.mainWindow?.removeListener("hide", mainWindowHidden);
        windowing_1.mainWindow?.removeListener("minimize", mainWindowMinimized);
        electron_1.app.removeListener("will-quit", cleanup);
        cleanupDownloadedUpdateAutoInstall();
    };
    autoInstallListenersCleanup = cleanup;
    electron_1.powerMonitor.on("user-did-resign-active", userDidResignActive);
    electron_1.powerMonitor.on("lock-screen", lockScreen);
    electron_1.powerMonitor.on("resume", resume);
    electron_1.app.on("browser-window-blur", browserWindowBlur);
    windowing_1.mainWindow?.on("hide", mainWindowHidden);
    windowing_1.mainWindow?.on("minimize", mainWindowMinimized);
    electron_1.app.once("will-quit", cleanup);
    return cleanup;
}
function cleanupDownloadedUpdateAutoInstall() {
    clearDownloadedUpdateInstallCheck();
    autoInstallOptions = null;
    autoInstallListenersRegistered = false;
    autoInstallListenersCleanup = null;
}
function setAutoRestartCalendarEvents(events, isLoadingEvents = false) {
    autoRestartCalendarEvents = events
        .filter((event) => event.isValidMeeting !== false && !event.cancelReason)
        .map((event) => {
        const startTime = parseEventTime(event.startTime);
        const endTime = parseEventTime(event.endTime);
        return {
            id: event.id,
            startTime,
            endTime: normalizeEventEndTime(startTime, endTime),
        };
    })
        .filter((event) => Number.isFinite(event.startTime));
    electron_log_1.default.info("[AUTO-UPDATER] Calendar restart state synced", {
        isLoadingEvents,
        inputEventCount: events.length,
        trackedEventCount: autoRestartCalendarEvents.length,
        state: getAutoInstallDebugState(),
    });
    scheduleDownloadedUpdateInstallCheck("calendar events updated");
}
function scheduleDownloadedUpdateInstallCheck(reason) {
    if (!(0, platform_1.isSilentAutoRestartSupported)()) {
        if (reason === "update downloaded") {
            electron_log_1.default.info("[AUTO-UPDATER] Silent restart check skipped", {
                reason,
                blocker: "unsupported platform",
                state: getAutoInstallDebugState(),
            });
        }
        return;
    }
    if (!autoInstallOptions?.isUpdateDownloaded()) {
        if (reason === "update downloaded") {
            electron_log_1.default.info("[AUTO-UPDATER] Silent restart check skipped", {
                reason,
                blocker: "no downloaded update",
                state: getAutoInstallDebugState(),
            });
        }
        return;
    }
    if (autoInstallOptions.isInstallingUpdate()) {
        electron_log_1.default.info("[AUTO-UPDATER] Silent restart check skipped", {
            reason,
            blocker: "install already in progress",
            state: getAutoInstallDebugState(),
        });
        return;
    }
    if (deferredInstallTimeout) {
        electron_log_1.default.info("[AUTO-UPDATER] Silent restart check already scheduled", {
            reason,
            state: getAutoInstallDebugState(),
        });
        return;
    }
    electron_log_1.default.info("[AUTO-UPDATER] Scheduling silent restart check", {
        reason,
        state: getAutoInstallDebugState(),
    });
    deferredInstallTimeout = setTimeout(() => {
        deferredInstallTimeout = null;
        attemptAutoInstallDownloadedUpdate(reason);
    }, 0);
}
function clearDownloadedUpdateInstallCheck() {
    if (!deferredInstallTimeout)
        return;
    clearTimeout(deferredInstallTimeout);
    deferredInstallTimeout = null;
}
function parseEventTime(value) {
    if (typeof value === "number")
        return value;
    if (!value)
        return NaN;
    return new Date(value).getTime();
}
function normalizeEventEndTime(startTime, endTime) {
    if (Number.isFinite(endTime))
        return endTime;
    if (!Number.isFinite(startTime))
        return NaN;
    return startTime + DEFAULT_CALENDAR_EVENT_DURATION_MS;
}
function attemptAutoInstallDownloadedUpdate(reason) {
    if (!(0, platform_1.isSilentAutoRestartSupported)() ||
        !autoInstallOptions?.isUpdateDownloaded() ||
        autoInstallOptions.isInstallingUpdate()) {
        return;
    }
    electron_log_1.default.info("[AUTO-UPDATER] Evaluating silent restart", {
        reason,
        state: getAutoInstallDebugState(),
    });
    const blocker = getAutoUpdaterIdleBlockerDetails();
    if (blocker) {
        electron_log_1.default.info("[AUTO-UPDATER] Deferring silent restart:", {
            reason,
            blocker: blocker.reason,
            blockerDetails: blocker.details,
            state: getAutoInstallDebugState(),
        });
        deferredInstallTimeout = setTimeout(() => {
            deferredInstallTimeout = null;
            attemptAutoInstallDownloadedUpdate(blocker.reason);
        }, AUTO_INSTALL_RETRY_INTERVAL);
        return;
    }
    electron_log_1.default.info("[AUTO-UPDATER] Auto-restarting to install downloaded update", {
        reason,
        state: getAutoInstallDebugState(),
    });
    autoInstallOptions.installUpdate();
}
function getAutoUpdaterIdleBlocker() {
    return getAutoUpdaterIdleBlockerDetails()?.reason ?? null;
}
function getAutoUpdaterIdleBlockerDetails() {
    const recording = getRecordingDebugState();
    if (recording.active) {
        return { reason: "recording in progress", details: recording };
    }
    const liveWindowState = getBrowserWindowDebugState(windowing_1.liveWindow);
    if (hasAliveLiveWindow()) {
        return { reason: "live window is open", details: liveWindowState };
    }
    const calendar = getCalendarDebugState();
    if (calendar.blockingMeeting) {
        return {
            reason: "calendar meeting within 20 minutes",
            details: calendar.blockingMeeting,
        };
    }
    const mainWindowState = getBrowserWindowDebugState(windowing_1.mainWindow);
    if (mainWindowState.exists && mainWindowState.focused) {
        return { reason: "main window focused", details: mainWindowState };
    }
    return null;
}
function getBlockingCalendarMeeting(now = Date.now()) {
    const restartBlockUntil = now + CALENDAR_AUTO_RESTART_BLOCK_WINDOW_MS;
    for (const event of autoRestartCalendarEvents) {
        const startsSoon = event.startTime >= now && event.startTime <= restartBlockUntil;
        const isOngoing = event.startTime <= now && event.endTime >= now;
        if (startsSoon || isOngoing) {
            return {
                startsSoon,
                isOngoing,
                startsInMinutes: Math.round((event.startTime - now) / 60000),
                endsInMinutes: Math.round((event.endTime - now) / 60000),
                startTime: new Date(event.startTime).toISOString(),
                endTime: new Date(event.endTime).toISOString(),
            };
        }
    }
    return null;
}
function getRecordingDebugState() {
    const recordingSnapshot = (0, recording_context_store_1.getRecordingContextSnapshot)();
    const state = recordingSnapshot?.state ?? null;
    return {
        state,
        active: state === "recording" || state === "paused",
    };
}
function getBrowserWindowDebugState(window) {
    if (!window) {
        return { exists: false };
    }
    const destroyed = window.isDestroyed();
    if (destroyed) {
        return { exists: true, destroyed };
    }
    return {
        exists: true,
        destroyed,
        visible: window.isVisible(),
        focused: window.isFocused(),
        minimized: window.isMinimized(),
    };
}
function getCalendarDebugState(now = Date.now()) {
    return {
        trackedEventCount: autoRestartCalendarEvents.length,
        blockingMeeting: getBlockingCalendarMeeting(now),
    };
}
function getAutoInstallDebugState() {
    return {
        platform: process.platform,
        uptimeSeconds: Math.round(process.uptime()),
        hasAutoInstallOptions: Boolean(autoInstallOptions),
        updateDownloaded: autoInstallOptions?.isUpdateDownloaded() ?? false,
        installingUpdate: autoInstallOptions?.isInstallingUpdate() ?? false,
        deferredInstallScheduled: Boolean(deferredInstallTimeout),
        recording: getRecordingDebugState(),
        liveWindow: getBrowserWindowDebugState(windowing_1.liveWindow),
        mainWindow: getBrowserWindowDebugState(windowing_1.mainWindow),
        calendar: getCalendarDebugState(),
    };
}
//# sourceMappingURL=auto-install.js.map
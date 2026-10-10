"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserListenerWindows = void 0;
exports.getBrowserFromProcess = getBrowserFromProcess;
const electron_log_1 = __importDefault(require("electron-log"));
const system_native_windows_1 = require("../system-native-windows");
/**
 * Google Meet meeting code pattern: xxx-xxxx-xxx
 * Only matches window titles that contain the full meeting code.
 * Example: "Meet - abc-defg-hij" or "Meeting Title | Meet - abc-defg-hij"
 */
const GOOGLE_MEET_CODE_PATTERN = /[a-z]{3}-[a-z]{4}-[a-z]{3}/i;
/**
 * Browser process names on Windows
 */
const BROWSER_PROCESSES = {
    chrome: "chrome",
    msedge: "edge",
    brave: "brave",
    vivaldi: "vivaldi",
    arc: "arc",
    comet: "comet",
    // Note: Safari and ChatGPT-Atlas is not available on Windows
};
/**
 * Detect Google Meet from window title.
 * Only returns a match if the full meeting code (xxx-xxxx-xxx) is present.
 */
function detectGoogleMeetFromTitle(title) {
    const match = title.match(GOOGLE_MEET_CODE_PATTERN);
    if (match) {
        return {
            type: "google-meet",
            code: match[0].toLowerCase(),
        };
    }
    return null;
}
/**
 * Map process name to browser name
 */
function getBrowserFromProcess(processName) {
    const normalizedName = processName.toLowerCase().replace(/\.exe$/i, "");
    return BROWSER_PROCESSES[normalizedName] ?? null;
}
/**
 * BrowserListenerWindows - Detects meetings by scanning browser window titles on Windows.
 *
 * Unlike macOS which uses AppleScript to access browser tab URLs directly,
 * Windows relies on window title patterns to detect active meetings. Titles
 * come from the native-system-windows addon, in-process; this used to poll a
 * hidden PowerShell, which security tooling flags.
 */
class BrowserListenerWindows {
    constructor() {
        this.poller = null;
        this.lastState = "";
        // Validation state to prevent false positives from temporary windows
        this.pendingMeetings = new Map(); // key -> timestamp when first seen
        this.validatedMeetings = new Set();
        this.VALIDATION_DELAY_MS = 2000; // 2 seconds
        /** The meetings the last readable scan validated, replayed when a read fails. */
        this.lastValidatedMeetings = [];
    }
    /**
     * Titled top-level windows of the browsers we know, and whether we could
     * actually read them. `readable` is false when the addon is missing or the
     * native call fails — that is "could not look", not "found nothing", which
     * callers must not confuse (an unread state must not suppress consent).
     */
    queryBrowserWindows() {
        const native = (0, system_native_windows_1.getWindowsSystemNative)();
        if (!native)
            return { windows: [], readable: false };
        try {
            const windows = native
                .listTopLevelWindows()
                .filter((window) => getBrowserFromProcess(window.processName) !== null)
                .map((window) => ({
                processName: window.processName,
                windowTitle: window.title,
                pid: window.pid,
            }));
            return { windows, readable: true };
        }
        catch (error) {
            electron_log_1.default.error("[BrowserListenerWindows] Failed to list windows:", error);
            return { windows: [], readable: false };
        }
    }
    getWindowTitles() {
        return this.queryBrowserWindows().windows;
    }
    /**
     * Generate a unique key for a meeting detection
     */
    getMeetingKey(meeting) {
        return `${meeting.browser}:${meeting.meetingType}:${meeting.meetingCode ?? meeting.windowTitle}`;
    }
    /**
     * Validate meetings to prevent false positives from temporary windows.
     * Only returns meetings that have been stable for at least VALIDATION_DELAY_MS.
     */
    validateMeetings(currentMeetings) {
        const now = Date.now();
        const currentKeys = new Set(currentMeetings.map((m) => this.getMeetingKey(m)));
        // Check each current meeting
        for (const meeting of currentMeetings) {
            const key = this.getMeetingKey(meeting);
            if (this.validatedMeetings.has(key)) {
                continue;
            }
            if (this.pendingMeetings.has(key)) {
                const firstSeenAt = this.pendingMeetings.get(key);
                const timeSinceFirstSeen = now - firstSeenAt;
                if (timeSinceFirstSeen >= this.VALIDATION_DELAY_MS) {
                    electron_log_1.default.debug(`[BrowserListenerWindows] Meeting validated after ${timeSinceFirstSeen}ms: ${key}`);
                    this.validatedMeetings.add(key);
                    this.pendingMeetings.delete(key);
                }
                else {
                    electron_log_1.default.debug(`[BrowserListenerWindows] Meeting pending validation (${timeSinceFirstSeen}/${this.VALIDATION_DELAY_MS}ms): ${key}`);
                }
            }
            else {
                electron_log_1.default.debug(`[BrowserListenerWindows] New meeting detected, starting validation: ${key}`);
                this.pendingMeetings.set(key, now);
            }
        }
        // Clean up meetings that are no longer present
        for (const key of this.pendingMeetings.keys()) {
            if (!currentKeys.has(key)) {
                electron_log_1.default.debug(`[BrowserListenerWindows] Meeting disappeared before validation: ${key}`);
                this.pendingMeetings.delete(key);
            }
        }
        for (const key of this.validatedMeetings.keys()) {
            if (!currentKeys.has(key)) {
                electron_log_1.default.debug(`[BrowserListenerWindows] Validated meeting removed (window closed): ${key}`);
                this.validatedMeetings.delete(key);
            }
        }
        // Return only validated meetings
        return currentMeetings.filter((m) => this.validatedMeetings.has(this.getMeetingKey(m)));
    }
    buildScanResult(validatedMeetings) {
        // Only Google Meet with a full code is detected, so the URL is constructible.
        const meetingsWithBrowser = validatedMeetings.map((m) => ({
            url: `https://meet.google.com/${m.meetingCode}`,
            browser: m.browser,
        }));
        const matchedUrls = meetingsWithBrowser.map((m) => m.url);
        return {
            matchedUrls,
            hasAnyMeeting: matchedUrls.length > 0,
            meetingsWithBrowser,
            windowMeetings: validatedMeetings,
        };
    }
    /**
     * Scan for meeting windows across supported browsers.
     */
    async scan() {
        const { windows, readable } = this.queryBrowserWindows();
        // A failed read is not "no meetings". Keep already-validated meetings and
        // the last result, but clear the pending (not-yet-stable) ones: an unread
        // interval is no evidence a meeting stayed present, so its stability window
        // must restart rather than count the gap toward the delay.
        if (!readable) {
            this.pendingMeetings.clear();
            return this.buildScanResult(this.lastValidatedMeetings);
        }
        const detectedMeetings = [];
        for (const info of windows) {
            const browser = getBrowserFromProcess(info.processName);
            if (!browser)
                continue;
            // Only detect Google Meet with full meeting code
            const meeting = detectGoogleMeetFromTitle(info.windowTitle);
            if (meeting) {
                detectedMeetings.push({
                    windowTitle: info.windowTitle,
                    browser,
                    meetingType: meeting.type,
                    meetingCode: meeting.code,
                });
            }
        }
        const validatedMeetings = this.validateMeetings(detectedMeetings);
        this.lastValidatedMeetings = validatedMeetings;
        return this.buildScanResult(validatedMeetings);
    }
    /**
     * Watch for changes (presence toggles or meeting set changes) and invoke callback.
     */
    startWatching(intervalMs, onChange) {
        if (this.poller)
            return;
        const run = async () => {
            try {
                const result = await this.scan();
                const signature = JSON.stringify({
                    hasAnyMeeting: result.hasAnyMeeting,
                    matchedUrls: result.matchedUrls,
                });
                if (signature !== this.lastState) {
                    this.lastState = signature;
                    onChange({
                        hasAnyMeeting: result.hasAnyMeeting,
                        matchedUrls: result.matchedUrls,
                        meetingsWithBrowser: result.meetingsWithBrowser,
                        windowMeetings: result.windowMeetings,
                    });
                }
            }
            catch (err) {
                electron_log_1.default.error("[BrowserListenerWindows] Scan error:", err);
            }
        };
        void run(); // initial fire
        this.poller = setInterval(run, Math.max(1000, intervalMs));
    }
    stopWatching() {
        if (this.poller)
            clearInterval(this.poller);
        this.poller = null;
        this.pendingMeetings.clear();
        this.validatedMeetings.clear();
        // Otherwise an unreadable first scan after a restart would replay meetings
        // from the previous watch session.
        this.lastValidatedMeetings = [];
    }
    /**
     * Windows has no automation permission to grant, so this is whether the
     * window-title addon loaded at all. When it did not, browser audio events
     * are notified immediately rather than waiting on a title lookup that can
     * never succeed.
     */
    async isAutomationAvailable() {
        return (0, system_native_windows_1.getWindowsSystemNative)() !== null;
    }
    /**
     * Which browser has a Google Meet meeting open right now.
     *
     * `readable` reflects whether we could inspect the windows at all. When the
     * addon is present, an empty result is a real "no meeting"; when it is
     * missing or the query fails, `readable` is false so consent targeting can
     * fall back to the mic browser instead of treating it as "no meeting".
     * Reads titles directly rather than through `scan`, whose stability filter
     * would withhold a window that just appeared.
     */
    async findGoogleMeetBrowser() {
        const { windows, readable } = this.queryBrowserWindows();
        for (const info of windows) {
            const browser = getBrowserFromProcess(info.processName);
            if (browser && detectGoogleMeetFromTitle(info.windowTitle)) {
                return { browser, readable: true };
            }
        }
        return { browser: null, readable };
    }
    /**
     * One-shot lookup: scan browser windows for a specific process name.
     * Returns meeting info if found, null otherwise.
     * Used by event-driven mode to enrich audio events with URL info.
     *
     * Retries up to MAX_LOOKUP_RETRIES times with LOOKUP_RETRY_DELAY_MS between
     * attempts to handle Chrome's race condition where the window title starts as
     * "meet" and only updates to "Tab: Meet - xxx-xxxx-xxx" after a few seconds.
     */
    async lookupMeetingUrlForProcess(processName) {
        const browser = getBrowserFromProcess(processName);
        if (!browser)
            return null;
        const MAX_LOOKUP_RETRIES = 3;
        const LOOKUP_RETRY_DELAY_MS = 1000;
        for (let attempt = 0; attempt <= MAX_LOOKUP_RETRIES; attempt++) {
            if (attempt > 0) {
                await new Promise((resolve) => setTimeout(resolve, LOOKUP_RETRY_DELAY_MS));
            }
            const windowInfos = this.getWindowTitles();
            for (const info of windowInfos) {
                if (getBrowserFromProcess(info.processName) !== browser)
                    continue;
                const meeting = detectGoogleMeetFromTitle(info.windowTitle);
                if (!meeting)
                    continue;
                if (attempt > 0) {
                    electron_log_1.default.debug(`[BrowserListenerWindows] Found meeting URL on retry ${attempt}: ${meeting.code}`);
                }
                return { url: `https://meet.google.com/${meeting.code}`, browser };
            }
            electron_log_1.default.debug(`[BrowserListenerWindows] No meeting URL on attempt ${attempt + 1}/${MAX_LOOKUP_RETRIES + 1} for ${processName}`);
        }
        return null;
    }
}
exports.BrowserListenerWindows = BrowserListenerWindows;
//# sourceMappingURL=browser-listener-windows.js.map
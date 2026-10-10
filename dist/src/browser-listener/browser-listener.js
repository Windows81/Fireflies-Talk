"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserListener = exports.MACOS_PROCESS_TO_BROWSER = void 0;
exports.isGoogleMeetMeetingUrl = isGoogleMeetMeetingUrl;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const electron_log_1 = __importDefault(require("electron-log"));
const shared_libs_utils_1 = require("@firefliesai/shared-libs.utils");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
/**
 * Enhanced URL validation that checks for actual meeting room URLs, not just platform domains.
 * This prevents false positives from general platform pages (e.g., meet.google.com homepage).
 */
function isTeamsCloudHostname(hostname) {
    return (hostname === "teams.cloud.microsoft" ||
        hostname.endsWith(".teams.cloud.microsoft"));
}
/** Google Meet meeting code: 3-4-3 characters separated by hyphens. */
const GOOGLE_MEET_CODE_PATTERN = /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
/**
 * A Google Meet room URL, as opposed to the meet.google.com landing page.
 * Gates the Meet-only keyboard shortcut, so it must not match the latter.
 */
function isGoogleMeetMeetingUrl(url) {
    try {
        const { hostname, pathname } = new URL(url.startsWith("http") ? url : `https://${url}`);
        return (hostname === "meet.google.com" && GOOGLE_MEET_CODE_PATTERN.test(pathname));
    }
    catch {
        return false;
    }
}
function isActualMeetingUrl(url) {
    try {
        const parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
        const { hostname, pathname } = parsedUrl;
        // teams.cloud.microsoft is not yet in shared-libs isUrlSupportedSafe,
        // so check it before the shared-libs gate to avoid false negatives.
        // The business experience loads meeting UI at "/" (no meeting-specific
        // path), so any teams.cloud.microsoft page is treated as a meeting
        // signal. This is safe because the URL lookup is only triggered after
        // the audio monitor detects mic usage from the same browser process.
        if (isTeamsCloudHostname(hostname)) {
            return true;
        }
        if (!(0, shared_libs_utils_1.isUrlSupportedSafe)(url)) {
            return false;
        }
        // Google Meet: https://meet.google.com/abc-defg-hij
        if (hostname === "meet.google.com") {
            return GOOGLE_MEET_CODE_PATTERN.test(pathname);
        }
        // Zoom: https://zoom.us/j/1234567890 or https://company.zoom.us/j/1234567890
        if (hostname === "zoom.us" ||
            hostname.endsWith(".zoom.us") ||
            hostname === "zoom.com" ||
            hostname.endsWith(".zoom.com")) {
            // Check for /j/ (join meeting), /s/ (start meeting), /w/ (webinar), or /my/ (vanity links)
            const zoomMeetingPattern = /^\/(j|s|w)\/\d+|^\/my\/[a-zA-Z0-9._-]+/;
            return zoomMeetingPattern.test(pathname);
        }
        // Microsoft Teams (teams.cloud.microsoft handled above before isUrlSupportedSafe gate)
        if (hostname === "teams.microsoft.com" || hostname === "teams.live.com") {
            if (/^\/l\/(meetup-join|meeting)/.test(pathname) && pathname.length > 20)
                return true;
            if (/^\/meet\/.+/.test(pathname))
                return true;
            // v2 or old Teams in-meeting: join path in hash fragment
            const hash = parsedUrl.hash?.toLowerCase() ?? "";
            if (hash.includes("/l/meetup-join/") || hash.includes("/l/meeting/"))
                return true;
            return false;
        }
        // Webex: https://company.webex.com/meet/...
        if (hostname === "webex.com" || hostname.endsWith(".webex.com")) {
            const webexMeetingPattern = /^\/(meet|join)\/[\w.-]+/;
            return webexMeetingPattern.test(pathname);
        }
        // GoToMeeting: https://company.gotomeeting.com/join/123456789 or https://gotomeet.me/Fireflies
        if (hostname === "gotomeeting.com" ||
            hostname.endsWith(".gotomeeting.com") ||
            hostname === "gotomeet.me" ||
            hostname.endsWith(".gotomeet.me")) {
            const gotoMeetingPattern = /^\/(join|meet)\/([\w.-]+)/;
            return gotoMeetingPattern.test(pathname);
        }
        // Slack Huddle: https://app.slack.com/huddle/... or https://workspace.slack.com/huddle/...
        // Only match huddle URLs, not regular Slack message URLs
        if (hostname === "app.slack.com" || hostname.endsWith(".slack.com")) {
            const slackHuddlePattern = /^\/huddle\/.+/;
            return slackHuddlePattern.test(pathname);
        }
        // DialPad/UberConference: https://uberconference.com/conference-id or https://meetings.dialpad.com/conference-id
        if (hostname === "uberconference.com" ||
            hostname.endsWith(".uberconference.com") ||
            hostname === "meetings.dialpad.com") {
            // Must have a path beyond just "/"
            return pathname.length > 1 && pathname !== "/";
        }
        // LifeSize: Various patterns
        if (hostname === "lifesize.com" || hostname.endsWith(".lifesize.com")) {
            const lifesizePattern = /^\/(join|room|guest)\/.+/;
            return lifesizePattern.test(pathname) || pathname.length > 5;
        }
        // Jitsi Meet: https://meet.jit.si/RoomName
        if (hostname === "meet.jit.si" || hostname === "video.preludd.com") {
            // Must have a room name (path beyond "/")
            return pathname.length > 1 && pathname !== "/";
        }
        // For any other supported URL, use basic path check
        return pathname.length > 1;
    }
    catch (error) {
        electron_log_1.default.error("Error validating meeting URL:", error);
        return false;
    }
}
/**
 * One AppleScript call that gathers URLs from multiple browsers:
 * - Google Chrome, Microsoft Edge, Brave Browser, Vivaldi (Chromium-based)
 * - Safari
 * It skips apps that aren't running.
 */
const APPLESCRIPT_LIST_ALL_TAB_URLS = `
set collected to {}

-- Chrome and Chromium-based browsers
tell application "System Events" to set isChromeRunning to (exists process "Google Chrome")
if isChromeRunning then
  try
    tell application "Google Chrome"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

-- Microsoft Edge
tell application "System Events" to set isEdgeRunning to (exists process "Microsoft Edge")
if isEdgeRunning then
  try
    tell application "Microsoft Edge"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

-- Brave Browser
tell application "System Events" to set isBraveRunning to (exists process "Brave Browser")
if isBraveRunning then
  try
    tell application "Brave Browser"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

-- Vivaldi
tell application "System Events" to set isVivaldiRunning to (exists process "Vivaldi")
if isVivaldiRunning then
  try
    tell application "Vivaldi"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

-- Arc (Chromium-based)
tell application "System Events" to set isArcRunning to (exists process "Arc")
if isArcRunning then
  try
    tell application "Arc"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

-- ChatGPT Atlas (Chromium-based)
tell application "System Events" to set isChatGPTAtlasRunning to (exists process "ChatGPT Atlas")
if isChatGPTAtlasRunning then
  try
    tell application "ChatGPT Atlas"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

-- Comet (Chromium-based)
tell application "System Events" to set isCometRunning to (exists process "Comet")
if isCometRunning then
  try
    tell application "Comet"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

-- Safari
tell application "System Events" to set isSafariRunning to (exists process "Safari")
if isSafariRunning then
  try
    tell application "Safari"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

set AppleScript's text item delimiters to linefeed
return collected as text
`;
// Re-exported from ../types (single source of truth)
var types_1 = require("../types");
Object.defineProperty(exports, "MACOS_PROCESS_TO_BROWSER", { enumerable: true, get: function () { return types_1.MACOS_PROCESS_TO_BROWSER; } });
function dedupe(arr) {
    const seen = new Set();
    return arr.filter((u) => {
        const k = u.trim();
        if (!k || seen.has(k))
            return false;
        seen.add(k);
        return true;
    });
}
const CLEANUP_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const ALL_BROWSERS = [
    "chrome",
    "safari",
    "edge",
    "brave",
    "vivaldi",
    "arc",
    "comet",
    "chatgpt-atlas",
];
class BrowserListener {
    constructor() {
        this.poller = null;
        this.lastState = "";
        this.cleanupTimer = null;
        // URL validation state to prevent false positives from temporary redirects
        this.pendingUrls = new Map(); // url -> timestamp when first seen
        this.validatedUrls = new Set(); // URLs that passed validation (stable for 2+ seconds)
        this.VALIDATION_DELAY_MS = 2000; // 2 seconds
        // Cache last-known automation availability for a short period to avoid frequent checks
        this.automationAvailableCache = null;
        this.AUTOMATION_CACHE_MS = 60000; // 60s
        // Start periodic cleanup timer
        this.cleanupTimer = setInterval(() => {
            this.resetState();
        }, CLEANUP_INTERVAL_MS);
    }
    /**
     * Reset internal state to prevent memory accumulation over time.
     * Called periodically (every 4 hours) to garbage collect stale data.
     */
    resetState() {
        electron_log_1.default.info("[BrowserListener] Resetting state for periodic cleanup");
        this.pendingUrls.clear();
        this.validatedUrls.clear();
        this.automationAvailableCache = null;
        this.lastState = "";
    }
    /**
     * Clean up resources when the listener is no longer needed.
     */
    destroy() {
        this.stopWatching();
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
    /**
     * Validate URLs to prevent false positives from temporary redirects.
     * Only returns URLs that have been stable for at least VALIDATION_DELAY_MS.
     */
    validateUrls(currentUrls) {
        const now = Date.now();
        const currentUrlSet = new Set(currentUrls);
        // Check each current URL
        for (const url of currentUrls) {
            if (this.validatedUrls.has(url)) {
                // Already validated, keep it
                continue;
            }
            if (this.pendingUrls.has(url)) {
                const firstSeenAt = this.pendingUrls.get(url);
                const timeSinceFirstSeen = now - firstSeenAt;
                if (timeSinceFirstSeen >= this.VALIDATION_DELAY_MS) {
                    // URL has been stable for 2+ seconds, validate it
                    electron_log_1.default.debug(`URL validated after ${timeSinceFirstSeen}ms: ${url}`);
                    this.validatedUrls.add(url);
                    this.pendingUrls.delete(url);
                }
                else {
                    // Still pending
                    electron_log_1.default.debug(`URL pending validation (${timeSinceFirstSeen}/${this.VALIDATION_DELAY_MS}ms): ${url}`);
                }
            }
            else {
                // First time seeing this URL, mark as pending
                electron_log_1.default.debug(`New URL detected, starting validation: ${url}`);
                this.pendingUrls.set(url, now);
            }
        }
        // Clean up URLs that are no longer present
        for (const url of this.pendingUrls.keys()) {
            if (!currentUrlSet.has(url)) {
                electron_log_1.default.debug(`URL disappeared before validation completed: ${url}`);
                this.pendingUrls.delete(url);
            }
        }
        for (const url of this.validatedUrls.keys()) {
            if (!currentUrlSet.has(url)) {
                electron_log_1.default.debug(`Validated URL removed (tab closed): ${url}`);
                this.validatedUrls.delete(url);
            }
        }
        // Return only validated URLs
        return currentUrls.filter((url) => this.validatedUrls.has(url));
    }
    /**
     * Get URLs from a specific browser
     */
    async getBrowserUrls(browserName) {
        const browserAppNames = {
            chrome: "Google Chrome",
            edge: "Microsoft Edge",
            brave: "Brave Browser",
            vivaldi: "Vivaldi",
            safari: "Safari",
            arc: "Arc",
            comet: "Comet",
            "chatgpt-atlas": "ChatGPT Atlas",
        };
        const browserProcessNames = {
            chrome: "Google Chrome",
            edge: "Microsoft Edge",
            brave: "Brave Browser",
            vivaldi: "Vivaldi",
            safari: "Safari",
            arc: "Arc",
            comet: "Comet",
            "chatgpt-atlas": "ChatGPT Atlas",
        };
        const appName = browserAppNames[browserName];
        const processName = browserProcessNames[browserName];
        const script = `
set collected to {}

tell application "System Events" to set isRunning to (exists process "${processName}")
if isRunning then
  try
    tell application "${appName}"
      repeat with w in windows
        repeat with t in tabs of w
          set end of collected to (URL of t as text)
        end repeat
      end repeat
    end tell
  end try
end if

set AppleScript's text item delimiters to linefeed
return collected as text
`;
        try {
            const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script], {
                timeout: 5000,
            });
            const urls = stdout
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean)
                .filter((url) => isActualMeetingUrl(url))
                .map((url) => ({ url, browser: browserName }));
            return urls;
        }
        catch {
            // Browser might not be installed or accessible
            return [];
        }
    }
    async listAllBrowserTabUrls() {
        const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", APPLESCRIPT_LIST_ALL_TAB_URLS], {
            timeout: 10000,
        });
        const urls = dedupe(stdout
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean));
        return urls;
    }
    /**
     * Scan for meeting URLs across supported providers.
     */
    async scan() {
        const results = await Promise.all(ALL_BROWSERS.map((browser) => this.getBrowserUrls(browser)));
        const meetingsWithBrowser = results.flat();
        // Deduplicate URLs (keep first occurrence with its browser)
        const seenUrls = new Set();
        const dedupedMeetings = meetingsWithBrowser.filter((meeting) => {
            if (seenUrls.has(meeting.url))
                return false;
            seenUrls.add(meeting.url);
            return true;
        });
        const allUrls = dedupedMeetings.map((m) => m.url);
        // Apply validation to prevent false positives from temporary redirects
        const validatedUrlList = this.validateUrls(allUrls);
        const validatedUrlSet = new Set(validatedUrlList);
        // Filter meetings to only include validated URLs
        const validatedMeetings = dedupedMeetings.filter((meeting) => validatedUrlSet.has(meeting.url));
        const matchedUrls = validatedMeetings.map((m) => m.url);
        const hasAnyMeeting = matchedUrls.length > 0;
        const automationAvailable = await this.isAutomationAvailableForChromium();
        return {
            matchedUrls,
            hasAnyMeeting,
            meetingsWithBrowser: validatedMeetings,
            automationAvailable,
        };
    }
    /**
     * Watch for changes (presence toggles or URL set changes) and invoke callback.
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
                    onChange(result);
                }
            }
            catch (err) {
                electron_log_1.default.error(err);
            }
        };
        void run(); // initial fire
        this.poller = setInterval(run, Math.max(1000, intervalMs));
    }
    stopWatching() {
        if (this.poller)
            clearInterval(this.poller);
        this.poller = null;
        // Clear validation state when stopping
        this.pendingUrls.clear();
        this.validatedUrls.clear();
    }
    /**
     * Heuristic check whether Apple Events automation permission is available for Chromium browsers.
     * Does not prompt the user. Returns true if a simple AppleScript command to any Chromium browser
     * succeeds; returns false on explicit permission errors; falls back to false if none are running.
     */
    async isAutomationAvailableForChromium() {
        const now = Date.now();
        if (this.automationAvailableCache &&
            now - this.automationAvailableCache.checkedAt < this.AUTOMATION_CACHE_MS) {
            return this.automationAvailableCache.value;
        }
        const chromiumApps = [
            { name: "chrome", process: "Google Chrome", app: "Google Chrome" },
            { name: "edge", process: "Microsoft Edge", app: "Microsoft Edge" },
            { name: "brave", process: "Brave Browser", app: "Brave Browser" },
            { name: "vivaldi", process: "Vivaldi", app: "Vivaldi" },
            { name: "arc", process: "Arc", app: "Arc" },
            { name: "comet", process: "Comet", app: "Comet" },
            { name: "chatgpt-atlas", process: "ChatGPT Atlas", app: "ChatGPT Atlas" },
        ];
        // Try each Chromium browser; consider available if any succeeds without permission error
        for (const b of chromiumApps) {
            const script = `
set isRunning to false
tell application "System Events" to set isRunning to (exists process "${b.process}")
if isRunning then
  try
    tell application "${b.app}"
      get (count of windows)
    end tell
    return "OK"
  on error errMsg number errNum
    return "ERR:" & errNum & ":" & errMsg
  end try
else
  return "NOTRUN"
end if
`;
            try {
                const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script], {
                    timeout: 5000,
                });
                const out = (stdout || "").trim();
                if (out === "OK") {
                    this.automationAvailableCache = { value: true, checkedAt: now };
                    return true;
                }
                if (out.startsWith("ERR:")) {
                    // If explicit AE permission error (-1744), we know it's unavailable
                    if (out.includes("-1744")) {
                        this.automationAvailableCache = { value: false, checkedAt: now };
                        return false;
                    }
                }
                // NOTRUN -> try next browser
            }
            catch {
                // Ignore and try next browser - timeout or other error
            }
        }
        // None running or inconclusive -> default to false
        this.automationAvailableCache = { value: false, checkedAt: now };
        return false;
    }
    /**
     * Which browser has a Google Meet meeting open right now.
     *
     * Deliberately bypasses `validateUrls`: that filter withholds a URL until it
     * has been seen twice, which is right for notifying the user but wrong for a
     * question asked once, on demand, about a meeting that may have opened a
     * second ago.
     */
    async findGoogleMeetBrowser() {
        const results = await Promise.all(ALL_BROWSERS.map((browser) => this.getBrowserUrls(browser)));
        const meeting = results
            .flat()
            .find((candidate) => isGoogleMeetMeetingUrl(candidate.url));
        if (meeting)
            return { browser: meeting.browser, readable: true };
        // No meeting found — say whether that is an answer or an inability to look.
        // The automation probe answers both: it runs a real AppleScript command, so
        // it reports false for a denied permission and for a browser that hangs,
        // which is the same tab query having failed above.
        return {
            browser: null,
            readable: await this.isAutomationAvailableForChromium(),
        };
    }
    /**
     * One-shot lookup: query a single browser for meeting URLs.
     * Returns the first meeting URL found, or null.
     * Used by event-driven mode to enrich audio events with URL info.
     */
    async lookupMeetingUrlForBrowser(browserName) {
        try {
            const results = await this.getBrowserUrls(browserName);
            return results.length > 0 ? results[0] : null;
        }
        catch (error) {
            electron_log_1.default.error(`[BrowserListener] lookupMeetingUrlForBrowser failed for ${browserName}:`, error);
            return null;
        }
    }
}
exports.BrowserListener = BrowserListener;
//# sourceMappingURL=browser-listener.js.map
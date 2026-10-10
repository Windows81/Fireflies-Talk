"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = checkPermission;
exports.checkPermissionAsync = checkPermissionAsync;
exports.checkAllPermissions = checkAllPermissions;
exports.requestPermission = requestPermission;
exports.requestAccessibilityPermission = requestAccessibilityPermission;
exports.setupRendererMediaPermissions = setupRendererMediaPermissions;
exports.openPermissionSettings = openPermissionSettings;
exports.hasRequiredPermissions = hasRequiredPermissions;
exports.getMissingPermissions = getMissingPermissions;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const electron_log_1 = __importDefault(require("electron-log"));
const audio_monitor_1 = require("./audio-monitor");
/**
 * Check the current status of a permission.
 * For systemAudio, this is async internally but returns a promise.
 */
function checkPermission(type) {
    if (process.platform === "win32") {
        // On Windows 10+, Electron can check microphone permission via system preferences.
        // This detects when the user has disabled "Let desktop apps access your microphone" in Windows Settings.
        if (type === "microphone") {
            return electron_1.systemPreferences.getMediaAccessStatus("microphone");
        }
        // Windows has no separate system audio or screen permission for desktop apps
        return "unknown";
    }
    if (process.platform !== "darwin") {
        return "unknown";
    }
    // systemAudio uses a different API (TCC private API via Swift binary)
    // For sync check, return "unknown" - use checkPermissionAsync for systemAudio
    if (type === "systemAudio") {
        return "unknown";
    }
    return electron_1.systemPreferences.getMediaAccessStatus(type);
}
/**
 * Check the current status of a permission asynchronously.
 * Required for systemAudio and screen which use the Swift binary for accurate detection.
 * Note: Electron's systemPreferences.getMediaAccessStatus('screen') returns 'denied'
 * for both 'not-determined' and 'denied' states, which is why we use native code.
 */
async function checkPermissionAsync(type) {
    if (process.platform === "win32") {
        // On Windows 10+, Electron can check microphone permission.
        // This detects when the user has disabled "Let desktop apps access your microphone" in Windows Settings.
        if (type === "microphone") {
            return electron_1.systemPreferences.getMediaAccessStatus("microphone");
        }
        // Windows has no separate system audio or screen permission for desktop apps
        return "unknown";
    }
    if (process.platform !== "darwin") {
        return "unknown";
    }
    if (type === "systemAudio") {
        return audio_monitor_1.audioMonitor.checkSystemAudioPermission();
    }
    if (type === "screen") {
        // Use native check for screen permission to properly distinguish
        // between "not-determined" and "denied"
        return audio_monitor_1.audioMonitor.checkScreenPermission();
    }
    return electron_1.systemPreferences.getMediaAccessStatus(type);
}
/**
 * Check all permissions and return their current status.
 * Note: This is async because systemAudio check requires calling the Swift binary.
 */
async function checkAllPermissions() {
    const [microphone, screen, systemAudio] = await Promise.all([
        checkPermissionAsync("microphone"),
        checkPermissionAsync("screen"),
        checkPermissionAsync("systemAudio"),
    ]);
    return {
        microphone,
        screen,
        systemAudio,
    };
}
/**
 * Request permission for microphone, screen, or systemAudio
 * Returns true if granted, false otherwise
 * Note: Screen recording permission cannot be requested programmatically, only settings can be opened
 * Note: systemAudio uses TCC private API via Swift binary (macOS 14.2+ only)
 */
async function requestPermission(type) {
    try {
        if (process.platform === "win32") {
            if (type === "microphone") {
                const status = electron_1.systemPreferences.getMediaAccessStatus("microphone");
                if (status === "granted")
                    return true;
                if (status === "denied" || status === "restricted") {
                    electron_log_1.default.warn(`[PERMISSIONS] ${type} permission is ${status}, opening settings`);
                    openPermissionSettings(type);
                    return false;
                }
                // not-determined / unknown — defer to Chromium's getUserMedia prompt.
                return true;
            }
            electron_log_1.default.warn(`[PERMISSIONS] Cannot request ${type} permission on Windows, opening settings`);
            openPermissionSettings(type);
            return false;
        }
        if (process.platform !== "darwin") {
            electron_log_1.default.warn(`[PERMISSIONS] Cannot request ${type} permission on ${process.platform}, opening settings`);
            openPermissionSettings(type);
            return false;
        }
        // Handle systemAudio permission separately (uses TCC private API)
        if (type === "systemAudio") {
            const currentStatus = await audio_monitor_1.audioMonitor.checkSystemAudioPermission();
            if (currentStatus === "granted") {
                return true;
            }
            // For systemAudio, TCCAccessRequest doesn't show a dialog like microphone does.
            // The user must manually enable it in System Settings > Privacy & Security > Screen Recording.
            // We open the settings pane directly for both "denied" and "not-determined" states.
            electron_log_1.default.info(`[PERMISSIONS] systemAudio permission is ${currentStatus}, opening settings. ` +
                `User must manually enable "Fireflies" in Screen & System Audio Recording.`);
            openPermissionSettings(type);
            return false;
        }
        // Handle standard media permissions (microphone, screen)
        const currentStatus = electron_1.systemPreferences.getMediaAccessStatus(type);
        if (currentStatus === "granted") {
            return true;
        }
        if (currentStatus === "denied" || currentStatus === "restricted") {
            electron_log_1.default.warn(`[PERMISSIONS] ${type} permission is ${currentStatus}, opening settings`);
            openPermissionSettings(type);
            return false;
        }
        // Screen recording cannot be requested programmatically, only open settings
        if (type === "screen") {
            electron_log_1.default.info(`[PERMISSIONS] Screen recording permission must be granted manually, opening settings`);
            openPermissionSettings(type);
            return false;
        }
        // Request permission if not determined (microphone only)
        const granted = await electron_1.systemPreferences.askForMediaAccess(type);
        electron_log_1.default.info(`[PERMISSIONS] ${type} permission ${granted ? "granted" : "denied"}`);
        if (!granted) {
            openPermissionSettings(type);
        }
        return granted;
    }
    catch (error) {
        electron_log_1.default.error(`[PERMISSIONS] Error requesting ${type} permission`, error);
        return false;
    }
}
/**
 * Force a macOS Accessibility permission request: if not already trusted,
 * this both registers the app in Privacy & Security > Accessibility and
 * surfaces the system prompt, rather than passively checking status.
 * macOS only — Accessibility isn't a distinct permission on other platforms.
 */
function requestAccessibilityPermission() {
    if (process.platform !== "darwin")
        return false;
    return electron_1.systemPreferences.isTrustedAccessibilityClient(true);
}
/**
 * Auto-grant mic/camera for renderer getUserMedia (dictation, recording, etc.).
 * OS-level privacy toggles still apply on macOS/Windows.
 */
function setupRendererMediaPermissions() {
    const allowed = new Set(["media", "audioCapture", "videoCapture"]);
    const ses = electron_1.session.defaultSession;
    ses.setPermissionCheckHandler((_webContents, permission) => allowed.has(permission));
    ses.setPermissionRequestHandler((_webContents, permission, callback) => {
        callback(allowed.has(permission));
    });
    electron_log_1.default.info("[PERMISSIONS] Renderer media permission handlers registered");
}
/**
 * Open OS settings to the appropriate permission pane
 */
function openPermissionSettings(type) {
    try {
        if (process.platform === "darwin") {
            // Map permission type to macOS privacy pane
            let privacyPane;
            switch (type) {
                case "screen":
                    privacyPane = "Privacy_ScreenCapture";
                    break;
                case "systemAudio":
                    // System audio capture (kTCCServiceAudioCapture) is also under Screen & System Audio Recording
                    // This is available on macOS 14.2+ (Sonoma)
                    privacyPane = "Privacy_ScreenCapture";
                    break;
                case "accessibility":
                    privacyPane = "Privacy_Accessibility";
                    break;
                case "microphone":
                default:
                    privacyPane = "Privacy_Microphone";
                    break;
            }
            const url = `x-apple.systempreferences:com.apple.preference.security?${privacyPane}`;
            // Use spawn with 'open' command for better compatibility with macOS 13+
            (0, child_process_1.spawn)("open", [url]);
            electron_log_1.default.info(`[PERMISSIONS] Opened macOS settings for ${type}`);
        }
        else if (process.platform === "win32") {
            // Windows 10/11 settings deep link
            let settingsUrl;
            switch (type) {
                case "screen":
                    settingsUrl = "ms-settings:privacy-graphicscaptureprogrammatic";
                    break;
                case "systemAudio":
                    // Windows doesn't have a separate system audio permission
                    // Fall back to microphone settings
                    settingsUrl = "ms-settings:privacy-microphone";
                    break;
                case "microphone":
                default:
                    settingsUrl = "ms-settings:privacy-microphone";
                    break;
            }
            void electron_1.shell.openExternal(settingsUrl);
            electron_log_1.default.info(`[PERMISSIONS] Opened Windows settings for ${type}`);
        }
        else {
            electron_log_1.default.warn(`[PERMISSIONS] Opening settings is not implemented for platform: ${process.platform}`);
        }
    }
    catch (error) {
        electron_log_1.default.error(`[PERMISSIONS] Failed to open settings for ${type}`, error);
    }
}
/**
 * Check if all required permissions are granted
 */
async function hasRequiredPermissions() {
    const permissions = await checkAllPermissions();
    return permissions.microphone === "granted";
}
/**
 * Get list of missing permissions
 */
async function getMissingPermissions() {
    const permissions = await checkAllPermissions();
    const missing = [];
    if (permissions.microphone !== "granted") {
        missing.push("microphone");
    }
    return missing;
}
//# sourceMappingURL=permissions.js.map
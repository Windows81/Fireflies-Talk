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
exports.initAudioLoopback = void 0;
exports.getAudioLoopbackConfig = getAudioLoopbackConfig;
const electron_1 = require("electron");
const os = __importStar(require("os"));
const config_1 = require("./config");
const electron_log_1 = __importDefault(require("electron-log"));
const permissions_1 = require("../permissions");
// Store the current audio loopback configuration
let currentConfig = {
    forceCoreAudioTap: false,
};
/**
 * Get the current audio loopback configuration.
 * Used to inform the renderer about which capture method is active.
 */
function getAudioLoopbackConfig() {
    return { ...currentConfig };
}
/**
 * Initialize the audio loopback system.
 * This sets up IPC handlers and Chromium feature flags for system audio capture.
 *
 * IMPORTANT: Call this BEFORE app.ready, as feature flags must be set early.
 */
const initAudioLoopback = (options = {}) => {
    const { forceCoreAudioTap = false, loopbackWithMute = false, sessionOverride, sourcesOptions = config_1.defaultSourcesOptions, } = options;
    // Store the configuration for later retrieval
    currentConfig = {
        forceCoreAudioTap,
    };
    // Get other enabled features from the command line.
    const otherEnabledFeatures = electron_1.app.commandLine
        .getSwitchValue(config_1.featureSwitchKey)
        ?.split(",");
    // Remove the switch if it exists.
    if (electron_1.app.commandLine.hasSwitch(config_1.featureSwitchKey)) {
        electron_1.app.commandLine.removeSwitch(config_1.featureSwitchKey);
    }
    // Add the feature flags to the command line with any other user-enabled features concatenated.
    const currentFeatureFlags = (0, config_1.buildFeatureFlags)({
        otherEnabledFeatures,
        forceCoreAudioTap,
    });
    electron_1.app.commandLine.appendSwitch(config_1.featureSwitchKey, currentFeatureFlags);
    electron_log_1.default.info("[AudioLoopback] Feature flags set:", currentFeatureFlags);
    // Remove any existing handlers to avoid duplicate registration errors on repeated init
    electron_1.ipcMain.removeHandler(config_1.ipcEvents.enableLoopbackAudio);
    electron_1.ipcMain.removeHandler(config_1.ipcEvents.disableLoopbackAudio);
    electron_1.ipcMain.removeHandler(config_1.ipcEvents.getConfig);
    // Handle the enable loopback audio event.
    // Returns: { success: boolean, error?: string, permissionStatus?: string }
    electron_1.ipcMain.handle(config_1.ipcEvents.enableLoopbackAudio, async (_event, options) => {
        const session = sessionOverride || electron_1.session.defaultSession;
        const loopbackAllDevices = options?.loopbackAllDevices === true;
        electron_log_1.default.info("[AudioLoopback] Setting up audio loopback handler", {
            forceCoreAudioTap,
            loopbackAllDevices,
            platform: process.platform,
        });
        // When using CoreAudioTap on macOS, check systemAudio permission status
        // Note: The permission prompt is shown automatically when audio capture is first attempted,
        // triggered by NSAudioCaptureUsageDescription in Info.plist
        if (forceCoreAudioTap && process.platform === "darwin") {
            const permissionStatus = await (0, permissions_1.checkPermissionAsync)("systemAudio");
            electron_log_1.default.info("[AudioLoopback] systemAudio permission status:", permissionStatus);
            if (permissionStatus === "denied") {
                // Permission was explicitly denied - open settings so user can enable it
                electron_log_1.default.warn("[AudioLoopback] systemAudio permission denied, opening settings");
                void (0, permissions_1.requestPermission)("systemAudio"); // This opens settings
                return {
                    success: false,
                    error: "System audio permission denied. Please enable it in System Settings.",
                    permissionStatus,
                };
            }
            // For "not-determined" or "granted", proceed with setup.
            // If "not-determined", macOS will show the permission prompt when capture starts.
            if (permissionStatus === "not-determined") {
                electron_log_1.default.info("[AudioLoopback] systemAudio permission not-determined, will prompt on first capture");
            }
        }
        const release = os.release();
        const audioSource = (0, config_1.selectLoopbackAudioType)({
            loopbackWithMute,
            loopbackAllDevices,
            platform: process.platform,
            release,
        });
        electron_log_1.default.info("[AudioLoopback] Selected loopback audio source", {
            audioSource,
            audioSourceId: typeof audioSource === "string" ? audioSource : audioSource.id,
            loopbackAllDevices,
            platform: process.platform,
            release,
        });
        // Set up the handler for audio-only capture
        session.setDisplayMediaRequestHandler(async (request, callback) => {
            electron_log_1.default.info("[AudioLoopback] Display media requested", {
                videoRequested: request.videoRequested,
                audioRequested: request.audioRequested,
            });
            try {
                // For audio-only requests (video: false), we don't need a video source
                if (!request.videoRequested) {
                    electron_log_1.default.info("[AudioLoopback] Audio-only request, providing loopback audio");
                    // Electron 41.1.1 omits Chromium's loopbackAllDevices source from Streams.
                    // Keep the assertion at this API boundary until Electron exposes it.
                    callback({ audio: audioSource });
                    return;
                }
                // Video was requested - need to get sources (requires screen permission)
                electron_log_1.default.info("[AudioLoopback] Video requested, getting screen sources...");
                const sources = await electron_1.desktopCapturer.getSources(sourcesOptions);
                if (sources.length === 0) {
                    electron_log_1.default.error("[AudioLoopback] No sources found for capture");
                    callback({ video: undefined, audio: undefined });
                    return;
                }
                electron_log_1.default.info("[AudioLoopback] Using source for loopback:", sources[0].name);
                // Electron 41.1.1 omits Chromium's loopbackAllDevices source from Streams.
                // Keep the assertion at this API boundary until Electron exposes it.
                callback({ video: sources[0], audio: audioSource });
            }
            catch (error) {
                electron_log_1.default.error("[AudioLoopback] Error in display media handler:", error);
                callback({ video: undefined, audio: undefined });
            }
        });
        electron_log_1.default.info("[AudioLoopback] Display media request handler set");
        return { success: true };
    });
    // Handle the disable loopback audio event.
    electron_1.ipcMain.handle(config_1.ipcEvents.disableLoopbackAudio, () => {
        const session = sessionOverride || electron_1.session.defaultSession;
        session.setDisplayMediaRequestHandler(null);
        electron_log_1.default.info("[AudioLoopback] Display media request handler cleared");
    });
    // Handle getting the audio loopback config
    electron_1.ipcMain.handle(config_1.ipcEvents.getConfig, () => {
        return getAudioLoopbackConfig();
    });
};
exports.initAudioLoopback = initAudioLoopback;
//# sourceMappingURL=audio-loopback.js.map
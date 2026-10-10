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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFeatureFlags = exports.loopbackAudioTypes = exports.featureSwitchKey = exports.defaultSourcesOptions = exports.ipcEvents = void 0;
exports.shouldUseCoreAudioTap = shouldUseCoreAudioTap;
exports.selectLoopbackAudioType = selectLoopbackAudioType;
const os = __importStar(require("os"));
const utils_1 = require("../utils");
/**
 * Darwin version for macOS Sonoma 14.2.0
 * CoreAudioTap is stable on macOS 14.2+ (Darwin 23.2.0+)
 */
const DARWIN_VERSION_SONOMA_14_2 = "23.2.0";
const WINDOWS_BUILD_ALL_DEVICES_LOOPBACK = 20348;
/**
 * Determines if CoreAudioTap should be used for system audio capture.
 *
 * CoreAudioTap (macOS 14.2+):
 * - Uses kTCCServiceAudioCapture permission
 * - No video capture needed (video: false)
 * - No scary screen recording warning
 *
 * ScreenCaptureKit (older macOS):
 * - Uses screen recording permission
 * - Requires video: true initially
 * - Shows screen recording warning to user
 *
 * @returns true if CoreAudioTap should be used, false for ScreenCaptureKit
 */
function shouldUseCoreAudioTap() {
    if (process.platform !== "darwin") {
        return false;
    }
    return (0, utils_1.semverCompare)(os.release(), DARWIN_VERSION_SONOMA_14_2) >= 0;
}
exports.ipcEvents = {
    enableLoopbackAudio: "enable-loopback-audio",
    disableLoopbackAudio: "disable-loopback-audio",
    getConfig: "audio-loopback:get-config",
};
exports.defaultSourcesOptions = { types: ["screen"] };
exports.featureSwitchKey = "enable-features";
exports.loopbackAudioTypes = {
    loopback: "loopback",
    loopbackWithMute: "loopbackWithMute",
    loopbackAllDevices: {
        id: "loopbackAllDevices",
        name: "System audio (all output devices)",
    },
};
function selectLoopbackAudioType({ loopbackWithMute, loopbackAllDevices, platform, release, }) {
    if (loopbackWithMute) {
        return exports.loopbackAudioTypes.loopbackWithMute;
    }
    if (platform !== "win32") {
        return exports.loopbackAudioTypes.loopback;
    }
    if (!loopbackAllDevices) {
        return exports.loopbackAudioTypes.loopback;
    }
    const windowsBuildComponent = release.split(".")[2];
    if (!windowsBuildComponent || !/^\d+$/.test(windowsBuildComponent)) {
        return exports.loopbackAudioTypes.loopback;
    }
    const windowsBuild = Number(windowsBuildComponent);
    if (!Number.isSafeInteger(windowsBuild) ||
        windowsBuild < WINDOWS_BUILD_ALL_DEVICES_LOOPBACK) {
        return exports.loopbackAudioTypes.loopback;
    }
    return exports.loopbackAudioTypes.loopbackAllDevices;
}
const defaultFeatureFlags = {
    pulseaudioLoopbackForScreenShare: "PulseaudioLoopbackForScreenShare",
    macLoopbackAudioForScreenShare: "MacLoopbackAudioForScreenShare",
    // Lets a getUserMedia request with ALL processing constraints disabled
    // open the Windows capture in RAW mode (AUDCLNT_STREAMOPTIONS_RAW),
    // bypassing driver/OEM enhancement APOs that can gate a healthy mic to
    // silence. Default-enabled in modern Chromium; listed as insurance —
    // unknown feature names are ignored harmlessly.
    wasapiRawAudioCapture: "WASAPIRawAudioCapture",
};
const coreAudioTapFeatureFlags = {
    macCoreAudioTapSystemAudioLoopbackOverride: "MacCatapSystemAudioLoopbackCapture",
};
const screenCaptureKitFeatureFlags = {
    macScreenCaptureKitSystemAudioLoopbackOverride: "MacSckSystemAudioLoopbackOverride",
};
const buildFeatureFlags = ({ otherEnabledFeatures, forceCoreAudioTap, }) => {
    const featureFlags = [
        ...Object.values(defaultFeatureFlags),
        ...(otherEnabledFeatures ?? []),
    ];
    if (forceCoreAudioTap) {
        featureFlags.push(coreAudioTapFeatureFlags.macCoreAudioTapSystemAudioLoopbackOverride);
    }
    else {
        featureFlags.push(screenCaptureKitFeatureFlags.macScreenCaptureKitSystemAudioLoopbackOverride);
    }
    return featureFlags.join(",");
};
exports.buildFeatureFlags = buildFeatureFlags;
//# sourceMappingURL=config.js.map
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
exports.macosBackend = void 0;
const path = __importStar(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const secure_require_1 = require("../secure-require");
/** CMIOExtension floor. */
const MIN_MAJOR = 12;
const MIN_MINOR = 3;
let addon = null;
let loadAttempted = false;
/**
 * CMIOExtension needs macOS 12.3, and macOS only installs system extensions
 * from apps in /Applications.
 */
function unsupportedReason() {
    const version = process.getSystemVersion().split(".");
    const major = parseInt(version[0] ?? "0", 10);
    const minor = parseInt(version[1] ?? "0", 10);
    if (major < MIN_MAJOR || (major === MIN_MAJOR && minor < MIN_MINOR)) {
        return "os-version";
    }
    if (electron_1.app.isPackaged && !electron_1.app.getAppPath().startsWith("/Applications/")) {
        return "not-in-applications";
    }
    return undefined;
}
function loadAddon() {
    if (addon || loadAttempted)
        return addon;
    loadAttempted = true;
    if (unsupportedReason())
        return null;
    try {
        addon = (0, secure_require_1.secureRequire)("native-camera-macos");
        return addon;
    }
    catch (error) {
        electron_log_1.default.error("[VCAM] failed to load native-camera-macos:", error);
        return null;
    }
}
function unavailable(operation) {
    return {
        outcome: "failed",
        installed: false,
        awaitingApproval: false,
        message: `Virtual camera is unavailable on this build (${operation}).`,
        code: -1,
    };
}
function assetsPath() {
    if (electron_1.app.isPackaged) {
        return path.join(process.resourcesPath, "assets", "camera-badge");
    }
    return path.join(__dirname, "..", "..", "..", "assets", "camera-badge");
}
exports.macosBackend = {
    unsupportedReason,
    isAvailable() {
        return loadAddon()?.isAvailable() ?? false;
    },
    activate() {
        const instance = loadAddon();
        return instance
            ? instance.activateExtension()
            : Promise.resolve(unavailable("activate"));
    },
    deactivate() {
        const instance = loadAddon();
        return instance
            ? instance.deactivateExtension()
            : Promise.resolve(unavailable("deactivate"));
    },
    status() {
        const instance = loadAddon();
        return instance
            ? instance.getExtensionStatus()
            : Promise.resolve(unavailable("status"));
    },
    startConsumerObserver(callback) {
        loadAddon()?.startConsumerObserver(callback);
    },
    stopConsumerObserver() {
        addon?.stopConsumerObserver();
    },
    getConsumerCount() {
        return loadAddon()?.getConsumerCount() ?? 0;
    },
    setAppPresent() {
        // Nothing to publish. The macOS extension cannot feed itself when Fireflies
        // is closed — it is sandboxed, holds no camera entitlement, and cannot
        // spawn the relay — so it always falls back to the unavailable-camera card and
        // never needs to know whether the app is running.
    },
    camerasInUse() {
        return loadAddon()?.getCamerasInUse() ?? [];
    },
    relayCommand() {
        const arch = process.arch === "arm64" ? "arm64" : "x86_64";
        const binary = electron_1.app.isPackaged
            ? path.join(process.resourcesPath, "camera-relay-macos", arch, "CameraRelayMacOS")
            : // dist/src/virtual-camera → electron/
                path.join(__dirname, "..", "..", "..", "camera-relay-macos", ".build", `${arch}-apple-macosx`, "release", "CameraRelayMacOS");
        return { binary, args: [assetsPath()] };
    },
};
//# sourceMappingURL=backend-macos.js.map
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
exports.windowsBackend = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const secure_require_1 = require("../secure-require");
/**
 * How often the app refreshes its proof of life, well inside the filter's
 * three-second tolerance. A main-process timer rather than a native thread:
 * one store to shared memory does not need a thread of its own.
 */
const APP_HEARTBEAT_INTERVAL_MS = 1000;
let appHeartbeat = null;
let addon = null;
let loadAttempted = false;
/**
 * Directory holding the per-architecture filter DLLs, the relay, and the badge
 * artwork. The filter resolves its fallback card relative to its own location,
 * so `assets/` must stay a sibling of the architecture directories.
 */
function payloadDirectory() {
    if (electron_1.app.isPackaged) {
        return path.join(process.resourcesPath, "camera-windows");
    }
    // The build stages one tree per installer architecture, and electron-builder
    // copies only the matching one into resources/. A dev build has to reach into
    // the same tree the installer would have taken, or every path below it —
    // the filter DLLs, the relay, the artwork — is off by one directory.
    const installerArch = process.arch === "arm64" ? "win-arm64" : "win-x64";
    // dist/src/virtual-camera → electron/
    return path.join(__dirname, "..", "..", "..", "camera-windows", "dist", installerArch);
}
/**
 * Directory holding binaries this process can execute, best match first.
 *
 * ARM64 falls back to x64 because Windows on ARM emulates it, and the ARM64
 * payload ships the x64 build for exactly that reason.
 */
function relayDirectory(root) {
    const candidates = process.arch === "arm64"
        ? ["arm64", "x64"]
        : [process.arch === "ia32" ? "x86" : "x64"];
    return (candidates
        .map((name) => path.join(root, name))
        .find((candidate) => fs.existsSync(path.join(candidate, "camera-relay-windows.exe"))) ?? null);
}
/**
 * The 64-bit filter this host needs. Checked rather than just the payload
 * directory: an empty or half-built tree would otherwise present a toggle that
 * silently cannot register anything.
 */
function primaryFilterPath(root) {
    const arch = process.arch === "arm64" ? "arm64" : "x64";
    return path.join(root, arch, "FirefliesVirtualCamera.dll");
}
/**
 * Windows needs no OS version gate — every Windows build Electron itself
 * supports has both DirectShow and Media Foundation. What can be missing is the
 * native payload, which a build that skipped the C++ step will not have.
 */
function unsupportedReason() {
    return fs.existsSync(primaryFilterPath(payloadDirectory()))
        ? undefined
        : "payload-missing";
}
function loadAddon() {
    if (addon || loadAttempted)
        return addon;
    loadAttempted = true;
    if (unsupportedReason())
        return null;
    try {
        addon = (0, secure_require_1.secureRequire)("native-camera-windows");
        return addon;
    }
    catch (error) {
        electron_log_1.default.error("[VCAM] failed to load native-camera-windows:", error);
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
exports.windowsBackend = {
    unsupportedReason,
    isAvailable() {
        return loadAddon()?.isAvailable() ?? false;
    },
    activate() {
        const instance = loadAddon();
        return instance
            ? instance.activateExtension(payloadDirectory())
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
    camerasInUse() {
        return loadAddon()?.getCamerasInUse() ?? [];
    },
    setAppPresent(present) {
        const instance = loadAddon();
        if (!instance)
            return;
        if (!present) {
            if (appHeartbeat)
                clearInterval(appHeartbeat);
            appHeartbeat = null;
            instance.clearAppHeartbeat();
            return;
        }
        if (appHeartbeat)
            return;
        instance.touchAppHeartbeat();
        appHeartbeat = setInterval(() => instance.touchAppHeartbeat(), APP_HEARTBEAT_INTERVAL_MS);
    },
    relayCommand() {
        const root = payloadDirectory();
        const directory = relayDirectory(root);
        if (!directory)
            return null;
        return {
            binary: path.join(directory, "camera-relay-windows.exe"),
            args: [path.join(root, "assets")],
        };
    },
};
//# sourceMappingURL=backend-windows.js.map
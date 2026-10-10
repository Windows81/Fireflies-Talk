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
exports.audioMonitor = void 0;
const child_process_1 = require("child_process");
const electron_1 = require("electron");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
const config_1 = require("./config");
const quit_readiness_1 = require("./quit-readiness");
const utils_1 = require("./utils");
/**
 * Securely loads a local module by validating the exact file path
 * to prevent directory hijacking attacks.
 */
function secureRequire(moduleName) {
    let expectedDir;
    if (electron_1.app.isPackaged) {
        expectedDir = path.join(process.resourcesPath, moduleName);
    }
    else {
        expectedDir = path.join(__dirname, `../../${moduleName}`);
    }
    const fullPath = path.join(expectedDir, "index.js");
    const normalizedPath = path.resolve(fullPath);
    const normalizedDir = path.resolve(expectedDir);
    if (!normalizedPath.startsWith(normalizedDir + path.sep)) {
        throw new Error(`Security violation: Resolved path ${normalizedPath} is outside expected directory ${normalizedDir}`);
    }
    if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Module file not found: ${normalizedPath}`);
    }
    const stats = fs.statSync(normalizedPath);
    if (!stats.isFile()) {
        throw new Error(`Expected a regular file but found: ${normalizedPath}`);
    }
    electron_log_1.default.info(`[AUDIO MONITOR] Loading validated module from: ${normalizedPath}`);
    return require(normalizedPath);
}
class AudioMonitor {
    constructor() {
        this.watcherProcess = null;
        this.eventHandlers = [];
        this.isRunning = false;
        this.windowsAddon = undefined;
        this.verbose = config_1.envConfig.micMonitorDebug;
        // Clean up on app exit
        (0, quit_readiness_1.onFinalQuit)(() => {
            this.stop();
        });
    }
    /**
     * Start monitoring audio processes
     * Idempotent - safe to call multiple times
     * @returns Promise<boolean> - true if started successfully, false otherwise
     */
    async start() {
        electron_log_1.default.info("[AUDIO MONITOR] Start requested");
        // Audio monitor is only supported on macOS and Windows
        if (process.platform !== "darwin" && process.platform !== "win32") {
            electron_log_1.default.info(`[AUDIO MONITOR] Skipping audio monitor on ${process.platform} (macOS/Windows only)`);
            return false;
        }
        if (this.isRunning) {
            electron_log_1.default.info("[AUDIO MONITOR] Already running, ignoring start request");
            return true;
        }
        if (process.platform === "win32") {
            return this.startWindows();
        }
        if (this.watcherProcess && !this.watcherProcess.killed) {
            electron_log_1.default.warn("[AUDIO MONITOR] Process exists but not marked as running, cleaning up");
            this.stop();
        }
        electron_log_1.default.info("[AUDIO MONITOR] Initializing audio process monitor...");
        const watcherPath = this.findWatcherBinary();
        if (!watcherPath) {
            electron_log_1.default.error("[AUDIO MONITOR] Could not find Swift watcher binary");
            return false;
        }
        electron_log_1.default.info("[AUDIO MONITOR] Starting audio process monitor with binary:", watcherPath);
        try {
            const spawnResult = await new Promise((resolve) => {
                this.watcherProcess = (0, child_process_1.spawn)(watcherPath, [], {
                    stdio: ["ignore", "pipe", "pipe"],
                });
                const cleanup = () => {
                    this.watcherProcess?.off("spawn", onSpawn);
                    this.watcherProcess?.off("error", onError);
                    this.watcherProcess?.off("exit", onEarlyExit);
                };
                const onSpawn = () => {
                    electron_log_1.default.info("[AUDIO MONITOR] Process spawned successfully");
                    cleanup();
                    this.isRunning = true;
                    resolve(true);
                };
                const onError = (err) => {
                    electron_log_1.default.error("[AUDIO MONITOR] Watcher failed to start:", err);
                    cleanup();
                    this.isRunning = false;
                    this.watcherProcess = null;
                    resolve(false);
                };
                const onEarlyExit = (code) => {
                    electron_log_1.default.error("[AUDIO MONITOR] Watcher exited before spawn with code:", code);
                    cleanup();
                    this.isRunning = false;
                    this.watcherProcess = null;
                    resolve(false);
                };
                this.watcherProcess.once("spawn", onSpawn);
                this.watcherProcess.once("error", onError);
                this.watcherProcess.once("exit", onEarlyExit);
            });
            if (!spawnResult) {
                return false;
            }
            // Set up data handlers after successful spawn
            let buffer = "";
            this.watcherProcess.stdout?.on("data", (chunk) => {
                const str = chunk.toString();
                if (this.verbose) {
                    electron_log_1.default.debug("[AUDIO MONITOR][verbose] stdout chunk:", JSON.stringify(str));
                }
                buffer += str;
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    if (this.verbose) {
                        electron_log_1.default.debug("[AUDIO MONITOR][verbose] parsing line:", line);
                    }
                    try {
                        const event = JSON.parse(line);
                        this.handleEvent(event);
                    }
                    catch (error) {
                        electron_log_1.default.error("[AUDIO MONITOR] Failed to parse event:", line, error);
                    }
                }
            });
            this.watcherProcess.stderr?.on("data", (data) => {
                electron_log_1.default.error("[AUDIO MONITOR] Watcher stderr:", data.toString());
            });
            this.watcherProcess.on("exit", (code) => {
                electron_log_1.default.info("[AUDIO MONITOR] Watcher process exited with code:", code);
                this.isRunning = false;
                this.watcherProcess = null;
            });
            electron_log_1.default.info("[AUDIO MONITOR] Audio process monitor started");
            return true;
        }
        catch (error) {
            electron_log_1.default.error("[AUDIO MONITOR] Unexpected error during start:", error);
            this.isRunning = false;
            this.watcherProcess = null;
            return false;
        }
    }
    /**
     * Stop monitoring audio processes
     * Idempotent - safe to call multiple times
     */
    stop() {
        electron_log_1.default.info("[AUDIO MONITOR] Stop requested");
        if (process.platform === "win32") {
            const addon = this.getWindowsAddon();
            if (addon?.isAvailable()) {
                try {
                    addon.stop();
                }
                catch (error) {
                    electron_log_1.default.warn("[AUDIO MONITOR] Error stopping Windows audio monitor:", error);
                }
            }
            this.isRunning = false;
            electron_log_1.default.info("[AUDIO MONITOR] Audio monitor stopped");
            return;
        }
        if (!this.watcherProcess && !this.isRunning) {
            electron_log_1.default.info("[AUDIO MONITOR] Already stopped, ignoring stop request");
            return;
        }
        if (this.watcherProcess) {
            electron_log_1.default.info("[AUDIO MONITOR] Stopping audio process monitor...");
            try {
                this.watcherProcess.kill("SIGTERM");
            }
            catch (error) {
                electron_log_1.default.warn("[AUDIO MONITOR] Error killing process, forcing cleanup:", error);
            }
            this.watcherProcess = null;
        }
        this.isRunning = false;
        electron_log_1.default.info("[AUDIO MONITOR] Audio monitor stopped");
    }
    /**
     * Add an event handler for audio events
     */
    onAudioEvent(handler) {
        this.eventHandlers.push(handler);
        electron_log_1.default.info("[AUDIO MONITOR] Registered audio event handler. Total handlers:", this.eventHandlers.length);
        return () => this.offAudioEvent(handler);
    }
    /**
     * Remove an event handler
     */
    offAudioEvent(handler) {
        const index = this.eventHandlers.indexOf(handler);
        if (index > -1) {
            this.eventHandlers.splice(index, 1);
            electron_log_1.default.info("[AUDIO MONITOR] Removed audio event handler. Total handlers:", this.eventHandlers.length);
        }
    }
    /**
     * Check if the monitor is currently running
     */
    isActive() {
        if (process.platform === "win32") {
            const addon = this.getWindowsAddon();
            if (!addon || !addon.isAvailable()) {
                return this.isRunning;
            }
            return this.isRunning && addon.isActive();
        }
        return this.isRunning;
    }
    handleEvent(event) {
        const parentInfo = event.parentProcessName
            ? ` [parent: ${event.parentProcessName} (pid ${event.parentProcessID})]`
            : "";
        const summary = `${event.type} from ${event.processName} (pid ${event.processID})${parentInfo} at ${event.timestamp}`;
        if (config_1.envConfig.micMonitorDebug) {
            electron_log_1.default.info("[AUDIO MONITOR] Audio event:", summary);
            const handlerCount = this.eventHandlers.length;
            if (handlerCount === 0) {
                electron_log_1.default.warn("[AUDIO MONITOR] No audio event handlers registered; event will not trigger any UI/notifications.");
            }
            else {
                electron_log_1.default.info(`[AUDIO MONITOR] Dispatching to ${handlerCount} handler(s).`);
            }
        }
        // Notify all registered handlers
        for (const handler of this.eventHandlers) {
            try {
                handler(event);
                if (this.verbose)
                    electron_log_1.default.debug("[AUDIO MONITOR][verbose] Handler executed successfully.");
            }
            catch (error) {
                electron_log_1.default.error("[AUDIO MONITOR] Error in event handler:", error);
            }
        }
    }
    findWatcherBinary() {
        // Audio monitor is only available on macOS
        if (process.platform !== "darwin") {
            return null;
        }
        // The Swift binary uses the Observation framework which requires macOS 14+
        // (Darwin 23.0.0). On older versions, dyld aborts with a missing library crash.
        if ((0, utils_1.semverCompare)(os.release(), "23.0.0") < 0) {
            electron_log_1.default.info("[AUDIO MONITOR] Skipping: macOS 14+ required for Swift Observation framework");
            return null;
        }
        if (electron_1.app.isPackaged) {
            // Detect architecture: 'arm64' or 'x64'
            const arch = process.arch === "arm64" ? "arm64" : "x86_64";
            return path.resolve(process.resourcesPath, `audio-monitor-macos/${arch}/AudioMonitorMacOS`);
        }
        else {
            // Development: Try arch-specific path first, fall back to universal
            const arch = process.arch === "arm64" ? "arm64-apple-macosx" : "x86_64-apple-macosx";
            const archSpecificPath = path.resolve(process.cwd(), `audio-monitor-macos/.build/${arch}/release/AudioMonitorMacOS`);
            // Check if arch-specific binary exists
            if (fs.existsSync(archSpecificPath)) {
                return archSpecificPath;
            }
            // Fall back to universal/default build location
            return path.resolve(process.cwd(), "audio-monitor-macos/.build/release/AudioMonitorMacOS");
        }
    }
    getWindowsAddon() {
        if (this.windowsAddon !== undefined) {
            return this.windowsAddon;
        }
        try {
            this.windowsAddon = secureRequire("audio-monitor-windows");
            return this.windowsAddon;
        }
        catch (error) {
            electron_log_1.default.error("[AUDIO MONITOR] Failed to load Windows addon:", error);
            this.windowsAddon = null;
            return null;
        }
    }
    startWindows() {
        const addon = this.getWindowsAddon();
        if (!addon || !addon.isAvailable()) {
            electron_log_1.default.error("[AUDIO MONITOR] Windows addon not available");
            return false;
        }
        if (this.isRunning) {
            if (addon.isActive()) {
                electron_log_1.default.info("[AUDIO MONITOR] Already running, ignoring start request");
                return true;
            }
            electron_log_1.default.warn("[AUDIO MONITOR] Marked running but addon inactive, restarting");
            this.isRunning = false;
        }
        try {
            if (this.verbose) {
                addon.setDebug(true);
            }
            const started = addon.start((event) => {
                if (event.type === "debug") {
                    electron_log_1.default.info("[AUDIO MONITOR][WASAPI]", event.message);
                    return;
                }
                this.handleEvent(event);
            });
            const active = addon.isActive();
            this.isRunning = started || active;
            if (this.isRunning) {
                electron_log_1.default.info("[AUDIO MONITOR] Windows audio monitor started");
            }
            else {
                electron_log_1.default.error("[AUDIO MONITOR] Failed to start Windows audio monitor");
            }
            return this.isRunning;
        }
        catch (error) {
            electron_log_1.default.error("[AUDIO MONITOR] Windows start failed:", error);
            this.isRunning = false;
            return false;
        }
    }
    /**
     * Check the system audio capture (kTCCServiceAudioCapture) permission status.
     * This is used by CoreAudioTap for system audio loopback on macOS 14.2+.
     * @returns Promise<PermissionStatus> - The current permission status
     */
    async checkSystemAudioPermission() {
        if (process.platform !== "darwin") {
            return "unknown";
        }
        const binaryPath = this.findWatcherBinary();
        if (!binaryPath) {
            electron_log_1.default.error("[AUDIO MONITOR] Could not find binary for permission check");
            return "unknown";
        }
        return new Promise((resolve) => {
            (0, child_process_1.execFile)(binaryPath, ["--check-audio-permission"], { timeout: 5000 }, (error, stdout, stderr) => {
                if (error) {
                    electron_log_1.default.error("[AUDIO MONITOR] Failed to check audio permission:", error, stderr);
                    resolve("unknown");
                    return;
                }
                try {
                    const result = JSON.parse(stdout.trim());
                    electron_log_1.default.info("[AUDIO MONITOR] Audio capture permission status:", result);
                    // Map the status from Swift to our PermissionStatus type
                    switch (result.status) {
                        case "granted":
                            resolve("granted");
                            break;
                        case "denied":
                            resolve("denied");
                            break;
                        case "not-determined":
                            resolve("not-determined");
                            break;
                        default:
                            resolve("unknown");
                    }
                }
                catch (parseError) {
                    electron_log_1.default.error("[AUDIO MONITOR] Failed to parse permission response:", stdout, parseError);
                    resolve("unknown");
                }
            });
        });
    }
    /**
     * Check the screen capture permission status.
     * Uses CGPreflightScreenCaptureAccess to properly distinguish between
     * "not-determined" and "denied" (unlike Electron's systemPreferences).
     * @returns Promise<PermissionStatus> - The current permission status
     */
    async checkScreenPermission() {
        if (process.platform !== "darwin") {
            return "unknown";
        }
        const binaryPath = this.findWatcherBinary();
        if (!binaryPath) {
            electron_log_1.default.error("[AUDIO MONITOR] Could not find binary for screen permission check");
            return "unknown";
        }
        return new Promise((resolve) => {
            (0, child_process_1.execFile)(binaryPath, ["--check-screen-permission"], { timeout: 5000 }, (error, stdout, stderr) => {
                if (error) {
                    electron_log_1.default.error("[AUDIO MONITOR] Failed to check screen permission:", error, stderr);
                    resolve("unknown");
                    return;
                }
                try {
                    const result = JSON.parse(stdout.trim());
                    electron_log_1.default.info("[AUDIO MONITOR] Screen capture permission status:", result);
                    switch (result.status) {
                        case "granted":
                            resolve("granted");
                            break;
                        case "denied":
                            resolve("denied");
                            break;
                        case "not-determined":
                            resolve("not-determined");
                            break;
                        default:
                            resolve("unknown");
                    }
                }
                catch (parseError) {
                    electron_log_1.default.error("[AUDIO MONITOR] Failed to parse screen permission response:", stdout, parseError);
                    resolve("unknown");
                }
            });
        });
    }
    /**
     * Request system audio capture (kTCCServiceAudioCapture) permission.
     * This triggers the macOS permission dialog for audio capture.
     * @returns Promise<boolean> - true if permission was granted, false otherwise
     */
    async requestSystemAudioPermission() {
        if (process.platform !== "darwin") {
            electron_log_1.default.warn("[AUDIO MONITOR] System audio permission request is only available on macOS");
            return false;
        }
        const binaryPath = this.findWatcherBinary();
        if (!binaryPath) {
            electron_log_1.default.error("[AUDIO MONITOR] Could not find binary for permission request");
            return false;
        }
        return new Promise((resolve) => {
            (0, child_process_1.execFile)(binaryPath, ["--request-audio-permission"], { timeout: 60000 }, // 60s timeout for user interaction
            (error, stdout, stderr) => {
                if (error) {
                    electron_log_1.default.error("[AUDIO MONITOR] Failed to request audio permission:", error, stderr);
                    resolve(false);
                    return;
                }
                try {
                    const result = JSON.parse(stdout.trim());
                    electron_log_1.default.info("[AUDIO MONITOR] Audio capture permission request result:", result);
                    resolve(result.granted === true);
                }
                catch (parseError) {
                    electron_log_1.default.error("[AUDIO MONITOR] Failed to parse permission request response:", stdout, parseError);
                    resolve(false);
                }
            });
        });
    }
}
// Export singleton instance
exports.audioMonitor = new AudioMonitor();
//# sourceMappingURL=audio-monitor.js.map
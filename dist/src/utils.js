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
exports.loadURL = void 0;
exports.isDev = isDev;
exports.shouldEnableDevTools = shouldEnableDevTools;
exports.getProductionDistPath = getProductionDistPath;
exports.getUrlToLoad = getUrlToLoad;
exports.setupCommandLineSwitches = setupCommandLineSwitches;
exports.setupProtocolClient = setupProtocolClient;
exports.semverCompare = semverCompare;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
const electron_serve_1 = __importDefault(require("electron-serve"));
const constants_1 = require("./constants");
function isDev() {
    // Check if app is packaged (production) or running from source (development)
    const isPackaged = electron_1.app.isPackaged;
    // Also check NODE_ENV as a fallback
    const nodeEnv = process.env.NODE_ENV;
    // In development if not packaged and NODE_ENV is not explicitly set to production
    return !isPackaged && nodeEnv !== "production";
}
/**
 * Check if dev tools should be enabled
 * Only enabled in development (non-packaged) builds
 */
function shouldEnableDevTools() {
    return isDev();
}
/**
 * Resolves the production dist folder path with defensive fallbacks.
 * Checks multiple possible locations and ensures the path exists.
 * @returns The validated dist folder path or null if not found
 */
function getProductionDistPath() {
    const isProduction = process.env.NODE_ENV === "production";
    // Try process.resourcesPath first (preferred for packaged apps)
    if (process.resourcesPath) {
        const resourcePath = path.join(process.resourcesPath, "dist");
        if (fs.existsSync(resourcePath)) {
            if (isProduction) {
                electron_log_1.default.info("[DIST] Using resources dist");
            }
            else {
                electron_log_1.default.info(`[DIST] Using resourcesPath dist: ${resourcePath}`);
            }
            return resourcePath;
        }
    }
    // Try primary path: relative to __dirname
    const primaryPath = path.join(__dirname, "..", "Resources", "dist");
    if (fs.existsSync(primaryPath)) {
        if (isProduction) {
            electron_log_1.default.info("[DIST] Using primary dist");
        }
        else {
            electron_log_1.default.info(`[DIST] Using primary dist path: ${primaryPath}`);
        }
        return primaryPath;
    }
    // Try alternative path structure (for different packaging layouts)
    const altPath = path.join(__dirname, "..", "..", "dist");
    if (fs.existsSync(altPath)) {
        if (isProduction) {
            electron_log_1.default.info("[DIST] Using alternative dist");
        }
        else {
            electron_log_1.default.info(`[DIST] Using alternative dist path: ${altPath}`);
        }
        return altPath;
    }
    // Log failure with appropriate detail level
    if (isProduction) {
        electron_log_1.default.error("[DIST] Failed to find dist folder");
    }
    else {
        electron_log_1.default.error("[DIST] Failed to find dist folder. Attempted paths:");
        electron_log_1.default.error(`  - Resources: ${process.resourcesPath ? path.join(process.resourcesPath, "dist") : "N/A"}`);
        electron_log_1.default.error(`  - Primary: ${primaryPath}`);
        electron_log_1.default.error(`  - Alternative: ${altPath}`);
    }
    return null;
}
// electron-serve configuration (only for production)
exports.loadURL = !isDev()
    ? (() => {
        const distPath = getProductionDistPath();
        if (!distPath) {
            electron_log_1.default.error("[SERVE] Cannot initialize electron-serve: dist folder not found");
            return null;
        }
        return (0, electron_serve_1.default)({
            directory: distPath,
            scheme: constants_1.APP_SCHEME,
        });
    })()
    : null;
function getUrlToLoad(route) {
    // Ensure a leading slash and preserve hash fragments
    const normalized = route.startsWith("/") ? route : `/${route}`;
    return isDev()
        ? `http://localhost:8081${normalized}`
        : `${constants_1.APP_ORIGIN}${normalized}`;
}
function setupCommandLineSwitches() {
    // macOS specific fixes for permission and process communication issues
    if (process.platform === "darwin") {
        electron_1.app.commandLine.appendSwitch("enable-transparent-visuals");
        electron_1.app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
        // Keep timers and media running when app is hidden/minimized
        electron_1.app.commandLine.appendSwitch("disable-renderer-backgrounding");
        electron_1.app.commandLine.appendSwitch("disable-background-timer-throttling");
    }
}
function setupProtocolClient() {
    // Handle protocol registration for deep links
    electron_log_1.default.info(`[PROTOCOL] Registering protocol handler for ${constants_1.DEEPLINK_SCHEME}://`);
    let success = false;
    if (process.defaultApp || !electron_1.app.isPackaged) {
        // Dev Electron must pass the app path so fireflies:// launches this
        // Fireflies session, not a bare Electron.app from another clone.
        const appPath = electron_1.app.getAppPath();
        success = electron_1.app.setAsDefaultProtocolClient(constants_1.DEEPLINK_SCHEME, process.execPath, [appPath]);
        electron_log_1.default.info(`[PROTOCOL] Dev handler: ${process.execPath} ${appPath}`);
    }
    else {
        success = electron_1.app.setAsDefaultProtocolClient(constants_1.DEEPLINK_SCHEME);
    }
    if (success) {
        electron_log_1.default.info(`[PROTOCOL] Successfully registered ${constants_1.DEEPLINK_SCHEME}:// protocol handler`);
    }
    else {
        electron_log_1.default.error(`[PROTOCOL] Failed to register ${constants_1.DEEPLINK_SCHEME}:// protocol handler`);
    }
}
function semverCompare(a, b) {
    if (a.startsWith(b + "-"))
        return -1;
    if (b.startsWith(a + "-"))
        return 1;
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "case",
        caseFirst: "upper",
    });
}
//# sourceMappingURL=utils.js.map
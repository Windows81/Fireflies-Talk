"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.configureLogger = configureLogger;
exports.sanitizeMetadata = sanitizeMetadata;
exports.startLogFileCleanup = startLogFileCleanup;
exports.getLogDirectory = getLogDirectory;
exports.getLogFiles = getLogFiles;
const electron_1 = require("electron");
const main_1 = __importDefault(require("electron-log/main"));
exports.logger = main_1.default;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Log rotation state
let currentLogFile = null;
let logWriteCounter = 0;
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const CHECK_INTERVAL = 100; // Check file size every 100 writes
/**
 * Get or create the current log file path
 * Creates new file if none exists or current file exceeds size limit
 */
function getCurrentLogFile(logDir) {
    // Check if we need to evaluate file size
    if (currentLogFile && logWriteCounter % CHECK_INTERVAL === 0) {
        try {
            const stats = fs_1.default.statSync(currentLogFile);
            if (stats.size >= MAX_LOG_SIZE) {
                // File exceeded size limit, create new one
                currentLogFile = null;
            }
        }
        catch {
            // File doesn't exist or can't be read, create new one
            currentLogFile = null;
        }
    }
    // Find or create log file if needed
    if (!currentLogFile) {
        // First, check if there's an existing log file we can continue using
        try {
            const existingFiles = fs_1.default
                .readdirSync(logDir)
                .filter((file) => file.endsWith(".log"))
                .map((file) => ({
                name: file,
                path: path_1.default.join(logDir, file),
                time: fs_1.default.statSync(path_1.default.join(logDir, file)).mtime.getTime(),
            }))
                .sort((a, b) => b.time - a.time); // Sort by newest first
            if (existingFiles.length > 0) {
                const newestFile = existingFiles[0];
                try {
                    const stats = fs_1.default.statSync(newestFile.path);
                    if (stats.size < MAX_LOG_SIZE) {
                        // Reuse the existing file since it's under the size limit
                        currentLogFile = newestFile.path;
                        logWriteCounter = 0;
                        return currentLogFile;
                    }
                }
                catch {
                    // Can't read file stats, will create new one
                }
            }
        }
        catch {
            // Directory doesn't exist or can't be read, will create new file
        }
        // Create new log file
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const second = String(now.getSeconds()).padStart(2, "0");
        const filename = `${year}-${month}-${day}_${hour}-${minute}-${second}.log`;
        currentLogFile = path_1.default.join(logDir, filename);
        logWriteCounter = 0; // Reset counter for new file
    }
    logWriteCounter++;
    return currentLogFile;
}
/**
 * Configure electron-log for file-based logging
 * - Logs stored in executable directory/logs
 * - Format: YYYY-MM-DD_HH-mm-ss.log (timestamped files)
 * - Max 5MB per file (checked every 100 writes, auto-rotates when exceeded)
 * - Keep max 10 files, delete oldest
 * - Filter out Apollo GraphQL errors and sanitize credentials
 */
function configureLogger() {
    // Determine log directory based on environment
    let logDir;
    if (electron_1.app.isPackaged) {
        // Production: use Electron's standard logs directory
        logDir = electron_1.app.getPath("logs");
    }
    else {
        // Development: logs in userData/logs
        logDir = path_1.default.join(electron_1.app.getPath("userData"), "logs");
    }
    // Ensure log directory exists
    try {
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true });
        }
    }
    catch (error) {
        console.error("Failed to create log directory:", error);
    }
    // Configure file transport with custom rotation
    main_1.default.transports.file.resolvePathFn = () => {
        return getCurrentLogFile(logDir);
    };
    // Set log level
    main_1.default.transports.file.level = "debug";
    // Set maxSize to a very high number since we handle rotation ourselves
    main_1.default.transports.file.maxSize = 1024 * 1024 * 1024; // 1GB (effectively disabled)
    // Custom format
    main_1.default.transports.file.format =
        "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
    // Console transport (for development)
    main_1.default.transports.console.level =
        process.env.NODE_ENV === "development" ? "debug" : "info";
    main_1.default.transports.console.format = "[{level}] {text}";
    // Hook to filter and manage log files
    setupLogFileManagement(logDir);
    // Filter and sanitize logs using electron-log's hook system
    main_1.default.hooks.push((message, transport) => {
        // Filter for file transport only (still show in console for debugging)
        if (transport !== main_1.default.transports.file) {
            return message;
        }
        // Check message data for filtering
        const messageText = typeof message.data === "string"
            ? message.data
            : message.data?.join(" ") || "";
        const lowerMessageText = messageText.toLowerCase();
        // Skip Apollo GraphQL errors (case-insensitive)
        if (lowerMessageText.includes("graphql error")) {
            return false; // Returning false prevents the log from being written
        }
        // Skip auth-store logs (contains sensitive authentication data)
        if (lowerMessageText.includes("[auth-store]")) {
            return false;
        }
        // Sanitize sensitive data from message
        if (Array.isArray(message.data)) {
            message.data = message.data.map((item) => typeof item === "string" ? sanitizeMessage(item) : item);
        }
        else if (typeof message.data === "string") {
            message.data = [sanitizeMessage(message.data)];
        }
        return message;
    });
    main_1.default.info("[Logger] Configured electron-log", {
        logDir,
        isPackaged: electron_1.app.isPackaged,
        nodeEnv: process.env.NODE_ENV,
    });
}
/**
 * Sanitize sensitive data from log messages
 * Redacts tokens, passwords, API keys, and other credentials
 */
function sanitizeMessage(text) {
    // List of sensitive keywords (case-insensitive)
    const sensitivePatterns = [
        // Tokens and keys
        /\b(token|apikey|api_key|apitoken|api_token|accesstoken|access_token|refreshtoken|refresh_token|bearer)\b[:\s=]+[^\s,}\]]+/gi,
        // Passwords
        /\b(password|passwd|pwd)\b[:\s=]+[^\s,}\]]+/gi,
        // Secrets
        /\b(secret|private_key|privatekey)\b[:\s=]+[^\s,}\]]+/gi,
        // Authorization headers
        /\b(authorization)\b[:\s]+[^\s,}\]]+/gi,
        // Cookie values
        /\b(cookie)\b[:\s=]+[^\s,}\]]+/gi,
        // JWT tokens (looks like xxx.yyy.zzz)
        /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
        // Long hex strings (likely tokens)
        /\b[A-Fa-f0-9]{32,}\b/g,
        // S3 URLs (including pre-signed URLs with credentials)
        /https?:\/\/[^\s]*\.s3[^\s]*\.amazonaws\.com[^\s]*/gi,
        /https?:\/\/s3[^\s]*\.amazonaws\.com[^\s]*/gi,
    ];
    let sanitized = text;
    // Replace sensitive data with [REDACTED]
    for (const pattern of sensitivePatterns) {
        sanitized = sanitized.replace(pattern, (match) => {
            // Keep the key name but redact the value
            const keyMatch = match.match(/^([^:=\s]+)[:\s=]+/);
            if (keyMatch) {
                return `${keyMatch[1]}: [REDACTED]`;
            }
            return "[REDACTED]";
        });
    }
    return sanitized;
}
/**
 * Sanitize metadata object recursively
 */
function sanitizeMetadata(obj) {
    const sensitiveKeys = [
        "token",
        "apikey",
        "api_key",
        "apitoken",
        "api_token",
        "password",
        "passwd",
        "pwd",
        "secret",
        "private_key",
        "privatekey",
        "authorization",
        "auth",
        "bearer",
        "accesstoken",
        "access_token",
        "refreshtoken",
        "refresh_token",
        "cookie",
        "session",
        "sessionid",
        "session_id",
    ];
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        // Check if key contains sensitive keyword
        const isSensitive = sensitiveKeys.some((k) => lowerKey.includes(k));
        if (isSensitive) {
            sanitized[key] = "[REDACTED]";
        }
        else if (value && typeof value === "object" && !Array.isArray(value)) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeMetadata(value);
        }
        else if (typeof value === "string") {
            // Sanitize string values that might contain tokens
            sanitized[key] = sanitizeMessage(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
/**
 * Manage log files: keep only the 10 most recent files
 */
function setupLogFileManagement(logDir) {
    try {
        if (!fs_1.default.existsSync(logDir)) {
            return;
        }
        const files = fs_1.default
            .readdirSync(logDir)
            .filter((file) => file.endsWith(".log"))
            .map((file) => ({
            name: file,
            path: path_1.default.join(logDir, file),
            time: fs_1.default.statSync(path_1.default.join(logDir, file)).mtime.getTime(),
        }))
            .sort((a, b) => b.time - a.time); // Sort by newest first
        // Keep only the 10 most recent files
        const filesToDelete = files.slice(10);
        for (const file of filesToDelete) {
            try {
                fs_1.default.unlinkSync(file.path);
                main_1.default.info(`[Logger] Deleted old log file: ${file.name}`);
            }
            catch (error) {
                main_1.default.error(`[Logger] Failed to delete log file: ${file.name}`, error);
            }
        }
    }
    catch (error) {
        main_1.default.error("[Logger] Failed to manage log files:", error);
    }
}
/**
 * Periodically clean up old log files (run every hour)
 */
function startLogFileCleanup(logDir) {
    const dir = logDir ||
        (electron_1.app.isPackaged
            ? electron_1.app.getPath("logs")
            : path_1.default.join(electron_1.app.getPath("userData"), "logs"));
    // Clean up every hour
    setInterval(() => {
        setupLogFileManagement(dir);
    }, 60 * 60 * 1000);
}
/**
 * Get the current log directory
 */
function getLogDirectory() {
    if (electron_1.app.isPackaged) {
        return electron_1.app.getPath("logs");
    }
    else {
        return path_1.default.join(electron_1.app.getPath("userData"), "logs");
    }
}
/**
 * Get list of all log files
 */
function getLogFiles() {
    const logDir = getLogDirectory();
    try {
        if (!fs_1.default.existsSync(logDir)) {
            return [];
        }
        return fs_1.default
            .readdirSync(logDir)
            .filter((file) => file.endsWith(".log"))
            .map((file) => path_1.default.join(logDir, file))
            .sort()
            .reverse(); // Newest first
    }
    catch (error) {
        main_1.default.error("[Logger] Failed to get log files:", error);
        return [];
    }
}
//# sourceMappingURL=logger.js.map
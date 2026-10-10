"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudLogBuffer = void 0;
exports.cloudLog = cloudLog;
const logger_1 = require("./logger");
const MAX_BUFFER_SIZE = 200;
class CloudLogBuffer {
    constructor() {
        this.buffer = [];
        this.getMainWindow = null;
    }
    start(getMainWindow) {
        this.getMainWindow = getMainWindow;
    }
    add(entry) {
        this.buffer.push(entry);
        while (this.buffer.length > MAX_BUFFER_SIZE) {
            this.buffer.shift();
        }
        this.forward();
    }
    forward() {
        if (this.buffer.length === 0 || !this.getMainWindow)
            return;
        const win = this.getMainWindow();
        if (!win || win.isDestroyed() || win.webContents.isDestroyed())
            return;
        const batch = this.buffer.splice(0);
        try {
            win.webContents.send("cloud-log:flush", batch);
        }
        catch {
            // Renderer unavailable — put entries back
            this.buffer.unshift(...batch);
            while (this.buffer.length > MAX_BUFFER_SIZE) {
                this.buffer.shift();
            }
        }
    }
    stop() {
        this.buffer = [];
    }
}
exports.cloudLogBuffer = new CloudLogBuffer();
/**
 * Log to both electron-log (local file) and forward to renderer for cloud upload.
 */
function cloudLog(level, tag, message, metadata) {
    const formatted = `[${tag}] ${message}`;
    if (metadata) {
        logger_1.logger[level](formatted, metadata);
    }
    else {
        logger_1.logger[level](formatted);
    }
    const logLevel = level === "warn" ? "warning" : level;
    exports.cloudLogBuffer.add({ level: logLevel, tag, message, metadata });
}
//# sourceMappingURL=cloud-log-buffer.js.map
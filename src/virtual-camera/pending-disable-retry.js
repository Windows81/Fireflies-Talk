"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingDisableRetry = void 0;
class PendingDisableRetry {
    constructor(retry, delayMs = 1000, schedule, cancelScheduled, maxDelayMs = 30000) {
        this.retry = retry;
        this.delayMs = delayMs;
        this.maxDelayMs = maxDelayMs;
        this.attempts = 0;
        this.schedule =
            schedule ??
                ((callback, delayMs) => setTimeout(callback, delayMs));
        this.cancelScheduled =
            cancelScheduled ??
                ((handle) => clearTimeout(handle));
    }
    sync(pending) {
        if (!pending) {
            this.cancel();
            return;
        }
        if (this.handle !== undefined)
            return;
        // Growing delay, because the state this waits on is often a System Settings
        // prompt the user may never answer: macOS sends no terminal callback then,
        // so a fixed one-second retry would poll for the life of the process. The
        // backoff keeps the eventual recovery and drops the churn.
        const delay = Math.min(this.delayMs * 2 ** this.attempts, this.maxDelayMs);
        this.attempts += 1;
        this.handle = this.schedule(() => {
            this.handle = undefined;
            this.retry();
        }, delay);
    }
    cancel() {
        this.attempts = 0;
        if (this.handle === undefined)
            return;
        const handle = this.handle;
        this.handle = undefined;
        this.cancelScheduled(handle);
    }
}
exports.PendingDisableRetry = PendingDisableRetry;
//# sourceMappingURL=pending-disable-retry.js.map
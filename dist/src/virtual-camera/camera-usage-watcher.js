"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraUsageWatcher = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * How often the OS is asked which cameras are in use.
 *
 * A poll rather than a subscription because neither platform offers one: the
 * Windows privacy ledger is registry state and macOS exposes only a property.
 * Two seconds is fast enough that a camera switched mid-recording is caught
 * before more than a sentence is lost, and slow enough to be free.
 */
const POLL_INTERVAL_MS = 2000;
/**
 * Watches which cameras are in use by anything other than the Fireflies Camera.
 *
 * Runs only while it can change a decision — that is, while a recording is
 * active and the camera notice is on. The rest of the time nothing is polled at
 * all, so a user who never enables the feature pays nothing for it.
 */
class CameraUsageWatcher {
    /**
     * @param probe Asks the platform which cameras are in use.
     * @param onChange Called only when the set of cameras actually changes, so a
     *   caller can push status without re-broadcasting an unchanged value twice a
     *   second for the length of a meeting.
     */
    constructor(probe, onChange) {
        this.probe = probe;
        this.onChange = onChange;
        this.timer = null;
        this.labels = [];
    }
    /** Cameras seen at the last poll; empty while the watcher is off. */
    current() {
        return this.labels;
    }
    setActive(active) {
        if (active === Boolean(this.timer))
            return;
        if (!active) {
            clearInterval(this.timer);
            this.timer = null;
            // Anything observed while watching is stale the moment we stop, and
            // leaving it set would keep a recording muted after the reason is gone.
            this.publish([]);
            return;
        }
        this.poll();
        this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    }
    /**
     * Takes one reading. Driven by the timer; public so the assertions can step
     * it deterministically instead of waiting out real intervals.
     */
    poll() {
        let labels;
        try {
            labels = this.probe();
        }
        catch (error) {
            // A probe that throws must not be read as "no camera in use": this gates
            // a consent decision, so an unknown answer stays at the last known one.
            electron_log_1.default.error("[VCAM] camera usage probe failed:", error);
            return;
        }
        this.publish(labels);
    }
    publish(labels) {
        if (sameLabels(labels, this.labels))
            return;
        electron_log_1.default.info("[VCAM] cameras in use changed:", labels);
        this.labels = labels;
        this.onChange(labels);
    }
}
exports.CameraUsageWatcher = CameraUsageWatcher;
function sameLabels(left, right) {
    return (left.length === right.length && left.every((item, i) => item === right[i]));
}
//# sourceMappingURL=camera-usage-watcher.js.map
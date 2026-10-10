"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRecordingPowerPolicy = setRecordingPowerPolicy;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const system_native_windows_1 = require("./system-native-windows");
/**
 * Windows power throttling (EcoQoS) for the processes a recording runs in.
 *
 * On battery, Windows moves processes it takes for background work onto
 * efficiency cores at lower clocks, and a minimized recorder qualifies: its
 * audio then renders below real time, which the heartbeats show as an
 * audioClockRatio under 1 far more often on battery than on mains power.
 * powerSaveBlocker keeps the app from being suspended but says nothing about
 * EcoQoS, so the recording opts its processes out explicitly for as long as
 * it runs. Re-applied from every heartbeat because Chromium restarts the
 * audio service, under a new pid, whenever it crashes.
 */
/** Chromium's audio service, which owns the capture and render streams. */
const AUDIO_SERVICE = "audio.mojom.AudioService";
const UNSUPPORTED = {
    main: "unsupported",
    renderer: "unsupported",
    audioService: "unsupported",
};
let lastLogged = "";
function audioServicePids() {
    return electron_1.app
        .getAppMetrics()
        .filter((m) => m.type === "Utility" && m.serviceName === AUDIO_SERVICE)
        .map((m) => m.pid);
}
function setRecordingPowerPolicy(renderer, mode) {
    if (process.platform !== "win32")
        return null;
    const native = (0, system_native_windows_1.getWindowsSystemNative)();
    if (!native?.setProcessPowerThrottling)
        return UNSUPPORTED;
    const apply = (pid, pidMode = mode) => {
        const result = native.setProcessPowerThrottling(pid, pidMode);
        if ("error" in result) {
            electron_log_1.default.warn("[POWER] Could not set power throttling", {
                pid,
                mode: pidMode,
                error: result.error,
            });
            return "error";
        }
        return result.executionSpeed;
    };
    // Chromium starts the audio service with timer resolution already pinned,
    // and "default" would clear that along with the opt-out, so handing back
    // leaves the audio service as it is.
    const audioServiceMode = mode === "default" ? "query" : mode;
    const policy = {
        main: apply(process.pid),
        renderer: apply(renderer.getOSProcessId()),
        // There is one audio service; apply to every match in case a replaced
        // one is still exiting, and report the live one that comes last.
        audioService: audioServicePids()
            .map((pid) => apply(pid, audioServiceMode))
            .pop() ?? "absent",
    };
    // Called every heartbeat; log only when the outcome changes.
    const summary = `${mode}: ${JSON.stringify(policy)}`;
    if (summary !== lastLogged) {
        lastLogged = summary;
        electron_log_1.default.info("[POWER] Recording power policy", { mode, ...policy });
    }
    return policy;
}
//# sourceMappingURL=recording-power-policy.js.map
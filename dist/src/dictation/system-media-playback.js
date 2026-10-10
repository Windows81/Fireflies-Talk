"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDictationCaptureReleased = exports.onDictationShortcutReleased = exports.onDictationShortcutPressed = exports.setPauseMediaEnabled = void 0;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_dev_log_1 = require("./dictation-dev-log");
const resource_bin_1 = require("./resource-bin");
const system_media_playback_parse_1 = require("./system-media-playback-parse");
const system_media_resume_gate_1 = require("./system-media-resume-gate");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const ADAPTER_SCRIPT = "mediaremote-adapter.pl";
const ADAPTER_FRAMEWORK = "MediaRemoteAdapter.framework";
// Native helper (see native-media-control-windows/) so no PowerShell is spawned.
const WINDOWS_MEDIA_CONTROL_BINARY = "windows-media-control.exe";
const MR_PAUSE = "1";
const MR_PLAY = "0";
// If the renderer never reports that the microphone closed, resume anyway.
const CAPTURE_RELEASE_FALLBACK_MS = 2000;
/** True when we paused system media for the current dictation session. */
let mediaPausedForShortcut = false;
let mediaOpChain = Promise.resolve();
let windowsPausedSources = [];
// Synced from useLocalSettings' `dictationPauseMediaEnabled` (default on) once settings rehydrate.
let pauseMediaEnabled = false;
const enqueueMediaOp = (operation) => {
    mediaOpChain = mediaOpChain.then(operation).catch(() => {
        mediaPausedForShortcut = false;
        windowsPausedSources = [];
    });
};
const elapsedMs = (startedAt) => Math.round(performance.now() - startedAt);
const runWindowsMediaAction = async (action) => {
    const args = action === "pause" ? ["pause"] : ["resume", ...windowsPausedSources];
    const { stdout } = await execFileAsync(node_path_1.default.join((0, resource_bin_1.resourcesBinDir)(), WINDOWS_MEDIA_CONTROL_BINARY), args, { timeout: 8000, windowsHide: true });
    if (action === "pause") {
        windowsPausedSources = (0, system_media_playback_parse_1.parseWindowsPausedSources)(stdout);
    }
    return (0, system_media_playback_parse_1.parseMediaActionToken)(stdout, action);
};
const getAdapterPaths = () => {
    const dir = (0, resource_bin_1.resourcesBinDir)();
    const script = node_path_1.default.join(dir, ADAPTER_SCRIPT);
    const framework = node_path_1.default.join(dir, ADAPTER_FRAMEWORK);
    if (!(0, node_fs_1.existsSync)(script) || !(0, node_fs_1.existsSync)(framework)) {
        electron_log_1.default.warn("[Dictation] MediaRemote adapter missing", { script, framework });
        return null;
    }
    return { script, framework };
};
const runMediaRemoteAdapter = async (args) => {
    const paths = getAdapterPaths();
    if (!paths) {
        throw new Error("MediaRemote adapter is not available");
    }
    const { stdout } = await execFileAsync("/usr/bin/perl", [paths.script, paths.framework, ...args], { timeout: 8000 });
    return stdout;
};
const runDarwinMediaAction = async (action) => {
    try {
        if (action === "pause") {
            const playing = (0, system_media_playback_parse_1.parseAdapterPlaying)(await runMediaRemoteAdapter(["get", "--no-artwork"]));
            if (playing !== true) {
                (0, dictation_dev_log_1.logDictationDev)("[Dictation] Now Playing idle — not pausing media");
                return false;
            }
            const pauseStartedAt = performance.now();
            await runMediaRemoteAdapter(["send", MR_PAUSE]);
            (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Paused Now Playing media (adapter ${elapsedMs(pauseStartedAt)}ms)`);
            return true;
        }
        const resumeStartedAt = performance.now();
        await runMediaRemoteAdapter(["send", MR_PLAY]);
        (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Resumed Now Playing media (adapter ${elapsedMs(resumeStartedAt)}ms)`);
        return true;
    }
    catch (error) {
        electron_log_1.default.warn("[Dictation] Now Playing adapter failed:", error);
        return false;
    }
};
const runLinuxMediaAction = async (action) => {
    try {
        if (action === "pause") {
            const { stdout: status } = await execFileAsync("playerctl", ["-a", "status"], { timeout: 3000 });
            if (!status.includes("Playing")) {
                return false;
            }
            await execFileAsync("playerctl", ["-a", "pause"], { timeout: 3000 });
            return true;
        }
        await execFileAsync("playerctl", ["-a", "play"], { timeout: 3000 });
        return true;
    }
    catch {
        return false;
    }
};
const pauseSystemMediaIfPlaying = async () => {
    if (process.platform === "win32") {
        return runWindowsMediaAction("pause");
    }
    if (process.platform === "darwin") {
        return runDarwinMediaAction("pause");
    }
    if (process.platform === "linux") {
        return runLinuxMediaAction("pause");
    }
    return false;
};
const resumeSystemMediaIfPausedByDictation = async () => {
    if (process.platform === "win32") {
        await runWindowsMediaAction("resume");
        return;
    }
    if (process.platform === "darwin") {
        await runDarwinMediaAction("resume");
        return;
    }
    if (process.platform === "linux") {
        await runLinuxMediaAction("resume");
    }
};
const setPauseMediaEnabled = (enabled) => {
    pauseMediaEnabled = enabled;
};
exports.setPauseMediaEnabled = setPauseMediaEnabled;
// Queued behind the pause so a cancel that lands before the pause finished
// (Fn turned out to be a modifier) still resumes instead of leaving media off.
const resumeMediaPausedForShortcut = (reason) => {
    enqueueMediaOp(async () => {
        if (!mediaPausedForShortcut)
            return;
        (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Resuming media — ${reason}`);
        await resumeSystemMediaIfPausedByDictation();
        mediaPausedForShortcut = false;
    });
};
const resumeGate = (0, system_media_resume_gate_1.createMediaResumeGate)((trigger, waitedMs) => resumeMediaPausedForShortcut(`${trigger} ${waitedMs}ms after release`), CAPTURE_RELEASE_FALLBACK_MS, {
    clearTimer: (handle) => clearTimeout(handle),
    now: () => performance.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
});
/** Pause system Now Playing when dictation starts (apps and browser media). */
const onDictationShortcutPressed = () => {
    if (!pauseMediaEnabled) {
        return;
    }
    resumeGate.onPressed();
    enqueueMediaOp(async () => {
        if (mediaPausedForShortcut)
            return;
        const paused = await pauseSystemMediaIfPlaying();
        if (paused) {
            mediaPausedForShortcut = true;
        }
    });
};
exports.onDictationShortcutPressed = onDictationShortcutPressed;
/** Dictation ended; media resumes once the microphone has been released. */
const onDictationShortcutReleased = () => {
    resumeGate.onReleased();
};
exports.onDictationShortcutReleased = onDictationShortcutReleased;
/** The renderer stopped its microphone tracks. */
const onDictationCaptureReleased = () => {
    resumeGate.onCaptureReleased();
};
exports.onDictationCaptureReleased = onDictationCaptureReleased;
//# sourceMappingURL=system-media-playback.js.map
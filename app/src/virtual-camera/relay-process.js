"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayProcess = void 0;
const child_process_1 = require("child_process");
const electron_log_1 = __importDefault(require("electron-log"));
const MAX_RESPAWNS = 3;
const RESPAWN_BACKOFF_MS = [500, 2000, 5000];
const SHUTDOWN_GRACE_MS = 1000;
/**
 * Owns the platform's camera relay child process.
 *
 * Runs out of process so a capture crash cannot take down Electron. While this
 * relay is down — and Fireflies is running, which the device can tell — the
 * device falls back to its unavailable-camera card, so a recording never silently
 * degrades to a clean, unbadged feed, which for a consent surface would be the
 * worst possible failure. (With Fireflies closed the Windows device feeds itself
 * instead; there is no recording to badge then.)
 *
 * Exactly one relay may be alive at a time. Two would both hold the webcam and
 * both publish into the same shared frame section, and the one the lifecycle
 * is not driving would overwrite badged frames with unbadged ones.
 */
class RelayProcess {
    /**
     * @param resolveCommand Supplies the platform's relay binary and arguments.
     *   Resolved per spawn rather than once, because it depends on packaging
     *   state that is not settled when this class is constructed.
     * @param spawnRelay Launches the relay. Injectable so the process-ownership
     *   rules can be asserted without launching real capture processes.
     */
    constructor(resolveCommand, spawnRelay = (command) => (0, child_process_1.spawn)(command.binary, command.args, { stdio: ["pipe", "pipe", "pipe"] })) {
        this.resolveCommand = resolveCommand;
        this.spawnRelay = spawnRelay;
        this.child = null;
        this.respawns = 0;
        this.recording = false;
        this.stdoutBuffer = "";
        this.listeners = [];
        this.respawnTimer = null;
    }
    onEvent(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index >= 0)
                this.listeners.splice(index, 1);
        };
    }
    isHealthy() {
        return this.child !== null && this.respawns < MAX_RESPAWNS;
    }
    ensureRunning() {
        if (this.child)
            return;
        if (this.respawns >= MAX_RESPAWNS)
            return;
        const command = this.resolveCommand();
        if (!command) {
            this.emit({ event: "error", message: "relay-unavailable" });
            return;
        }
        let child;
        try {
            child = this.spawnRelay(command);
        }
        catch (error) {
            electron_log_1.default.error("[VCAM] failed to spawn relay:", error);
            this.emit({ event: "error", message: "relay-spawn-failed" });
            return;
        }
        this.child = child;
        child.stdout?.on("data", (chunk) => this.handleStdout(String(chunk)));
        child.stderr?.on("data", (chunk) => electron_log_1.default.warn("[VCAM] relay stderr:", String(chunk).trim()));
        child.on("error", (error) => electron_log_1.default.error("[VCAM] relay error:", error));
        // The child is captured rather than read back off `this`, so the handler
        // can tell whether the process that exited is still the one we own.
        child.on("exit", (code) => this.handleExit(child, code));
        electron_log_1.default.info("[VCAM] relay started, pid:", child.pid);
        this.send({ cmd: "setRecording", value: this.recording });
    }
    ensureStopped() {
        // A scheduled respawn counts as the relay just as much as a live one. Left
        // armed, it reopens the webcam after the last consumer has gone — and with
        // nothing consuming the camera, nothing comes along to stop it again, so
        // the privacy light stays on for as long as the app runs.
        if (this.respawnTimer) {
            clearTimeout(this.respawnTimer);
            this.respawnTimer = null;
        }
        const child = this.child;
        if (!child)
            return;
        this.child = null;
        this.respawns = 0;
        electron_log_1.default.info("[VCAM] stopping relay, pid:", child.pid);
        this.send({ cmd: "shutdown" }, child);
        setTimeout(() => {
            if (!child.killed)
                child.kill("SIGKILL");
        }, SHUTDOWN_GRACE_MS);
    }
    setRecording(value) {
        if (this.recording === value)
            return;
        this.recording = value;
        this.send({ cmd: "setRecording", value });
    }
    send(message, target) {
        const child = target ?? this.child;
        child?.stdin?.write(`${JSON.stringify(message)}\n`);
    }
    handleStdout(chunk) {
        this.stdoutBuffer += chunk;
        const lines = this.stdoutBuffer.split("\n");
        this.stdoutBuffer = lines.pop() ?? "";
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const parsed = JSON.parse(line);
                // A clean start resets the budget, so intermittent faults over a long
                // session don't eventually exhaust the respawn allowance.
                if (parsed.event === "ready")
                    this.respawns = 0;
                this.emit(parsed);
            }
            catch {
                electron_log_1.default.warn("[VCAM] unparseable relay output:", line);
            }
        }
    }
    handleExit(child, code) {
        // Only an exit from the relay we currently own means anything. One we asked
        // to stop, or one already superseded by a newer spawn, must not clear the
        // reference to the live relay: that orphans it, and an orphan goes on
        // publishing unbadged frames into the same shared section, overwriting the
        // frames of the relay we think we control — which is how a recording ends
        // up with no notice chip on it.
        if (this.child !== child)
            return;
        this.child = null;
        electron_log_1.default.warn("[VCAM] relay exited unexpectedly, pid:", child.pid, "code:", code);
        if (this.respawns >= MAX_RESPAWNS) {
            electron_log_1.default.error("[VCAM] relay exceeded respawn limit, giving up");
            this.emit({ event: "error", message: "relay-respawn-exhausted" });
            return;
        }
        const delay = RESPAWN_BACKOFF_MS[this.respawns];
        this.respawns++;
        this.respawnTimer = setTimeout(() => {
            this.respawnTimer = null;
            this.ensureRunning();
        }, delay);
    }
    emit(event) {
        this.listeners.forEach((listener) => listener(event));
    }
}
exports.RelayProcess = RelayProcess;
//# sourceMappingURL=relay-process.js.map
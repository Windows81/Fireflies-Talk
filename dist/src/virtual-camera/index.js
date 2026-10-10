"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initVirtualCamera = initVirtualCamera;
exports.getVirtualCameraStatus = getVirtualCameraStatus;
exports.enableVirtualCamera = enableVirtualCamera;
exports.disableVirtualCamera = disableVirtualCamera;
exports.onVirtualCameraStatusChanged = onVirtualCameraStatusChanged;
exports.notifyRecordingStateChanged = notifyRecordingStateChanged;
exports.shutdownVirtualCamera = shutdownVirtualCamera;
const electron_log_1 = __importDefault(require("electron-log"));
const recording_context_store_1 = require("../recording-context-store");
const backend_index_1 = require("./backend-index");
const camera_usage_watcher_1 = require("./camera-usage-watcher");
const lifecycle_1 = require("./lifecycle");
const installation_operations_1 = require("./installation-operations");
const observer_session_1 = require("./observer-session");
const pending_disable_controller_1 = require("./pending-disable-controller");
const pending_disable_retry_1 = require("./pending-disable-retry");
const relay_process_1 = require("./relay-process");
const backend = (0, backend_index_1.resolveBackend)();
let consumers = 0;
let installed = false;
let awaitingApproval = false;
let observing = false;
/** Last OS-reported installation failure, surfaced in Settings. */
let lastError;
let lifecycleQueue = Promise.resolve();
const pendingDisable = new pending_disable_controller_1.PendingDisableController();
const observerSession = new observer_session_1.ObserverSession();
const pendingDisableRetry = new pending_disable_retry_1.PendingDisableRetry(() => {
    void getVirtualCameraStatus().catch((error) => {
        electron_log_1.default.warn("[VCAM] pending deactivation retry failed:", error);
        pendingDisableRetry.sync(pendingDisable.isPending());
    });
});
const relay = new relay_process_1.RelayProcess(() => backend?.relayCommand() ?? null);
const cameraUsage = new camera_usage_watcher_1.CameraUsageWatcher(() => backend?.camerasInUse() ?? [], () => emitStatus());
const statusListeners = [];
function serializeLifecycle(operation) {
    // Serialize JS submissions from startup and Settings. A native approval
    // request can outlive its resolved Promise, so the addon gates that interval.
    const result = lifecycleQueue.then(operation);
    lifecycleQueue = result.then(() => undefined, () => undefined);
    return result;
}
function currentInstallationState() {
    return { installed, awaitingApproval };
}
function applyInstallationState(state) {
    installed = state.installed;
    awaitingApproval = state.awaitingApproval;
}
function buildStatus() {
    // No backend at all means a platform with no virtual camera, which the UI
    // reports the same way as an OS that is too old to run one.
    const reason = backend ? backend.unsupportedReason() : "os-version";
    return {
        supported: Boolean(backend) && !reason,
        installed,
        awaitingApproval,
        consumers,
        relayHealthy: relay.isHealthy(),
        camerasInUse: cameraUsage.current(),
        ...(reason ? { unsupportedReason: reason } : {}),
        ...(lastError ? { lastError } : {}),
    };
}
function emitStatus() {
    const status = buildStatus();
    statusListeners.forEach((listener) => listener(status));
}
/** Brings the relay in line with whatever the lifecycle rules currently demand. */
function reconcile() {
    const recordingState = (0, recording_context_store_1.getRecordingContextSnapshot)()?.state ?? "inactive";
    // A live consumer is proof the device exists, even when the status query says
    // otherwise. On macOS that query only succeeds from the app bundle containing
    // the extension, which `npm run dev` is not; this fallback is what lets dev
    // builds drive the relay against an extension a signed build activated.
    const deviceInstalled = installed || consumers > 0;
    const desired = (0, lifecycle_1.computeRelayState)({
        consumers,
        installed: deviceInstalled,
        recordingState,
    });
    // Which cameras are in use only matters while the notice is enabled and a
    // recording is running — that is the only combination the policy can act on.
    cameraUsage.setActive(deviceInstalled && recordingState !== "inactive");
    if (desired === "stopped") {
        relay.ensureStopped();
    }
    else {
        relay.ensureRunning();
        relay.setRecording(desired === "badged");
    }
    emitStatus();
}
function startObserving(instance) {
    if (observing)
        return;
    observing = true;
    consumers = instance.getConsumerCount();
    instance.startConsumerObserver(observerSession.begin((count) => {
        consumers = count;
        reconcile();
    }));
}
function stopCameraRuntime() {
    relay.ensureStopped();
    cameraUsage.setActive(false);
    observerSession.invalidate();
    backend?.stopConsumerObserver();
    observing = false;
    consumers = 0;
}
async function initVirtualCamera() {
    return serializeLifecycle(async () => {
        if (!backend?.isAvailable())
            return;
        // Published for the whole app lifetime, independent of whether the camera is
        // installed: a device that read "Fireflies is closed" while it is merely
        // switched off would start feeding a camera the user just turned off.
        backend.setAppPresent(true);
        const status = await (0, installation_operations_1.reconcileExtensionInstallation)(backend);
        applyInstallationState(status);
        lastError = status.outcome === "failed" ? status.message : undefined;
        electron_log_1.default.info("[VCAM] initial camera status:", status);
        // Observe unconditionally: registration is cheap, and in macOS dev builds the
        // status query above cannot see the extension (see reconcile) — the consumer
        // signal is the only reliable trigger there.
        startObserving(backend);
        relay.onEvent((event) => {
            if (event.event !== "ready")
                electron_log_1.default.warn("[VCAM] relay event:", event);
            emitStatus();
        });
        reconcile();
    });
}
async function getVirtualCameraStatus() {
    return serializeLifecycle(async () => {
        if (backend?.isAvailable()) {
            const wasPendingDisable = pendingDisable.isPending();
            const previousState = currentInstallationState();
            const status = await backend.status();
            const continuation = await pendingDisable.continueAfterStatus(backend, status, stopCameraRuntime);
            const result = continuation.result;
            applyInstallationState(continuation.processedAuthoritativeStatus
                ? (0, installation_operations_1.installationStateAfterStatusMutation)(previousState, status, result)
                : (0, installation_operations_1.installationStateFromStatus)(previousState, result));
            lastError = result.outcome === "failed" ? result.message : undefined;
            pendingDisableRetry.sync(pendingDisable.isPending());
            const runtimeAction = (0, pending_disable_controller_1.pendingDisableRuntimeAction)({
                wasPending: wasPendingDisable,
                isPending: pendingDisable.isPending(),
                usedMutationResult: continuation.usedMutationResult,
                previousInstalled: previousState.installed,
                installed,
                authoritative: result.outcome === "properties" ||
                    continuation.processedAuthoritativeStatus,
            });
            if (runtimeAction === "restore") {
                startObserving(backend);
                reconcile();
            }
            else if (runtimeAction === "stop") {
                if (!continuation.usedMutationResult)
                    stopCameraRuntime();
                emitStatus();
            }
            else {
                startObserving(backend);
                // A retry has no IPC caller to consume its return value, so publish its
                // terminal failure or unchanged installed state here.
                if (wasPendingDisable && !pendingDisable.isPending())
                    emitStatus();
            }
        }
        return buildStatus();
    });
}
async function enableVirtualCamera() {
    return serializeLifecycle(async () => {
        pendingDisable.cancel();
        pendingDisableRetry.cancel();
        if (!backend) {
            lastError = "Virtual camera is unavailable on this build.";
            return buildStatus();
        }
        // Await the verdict rather than polling status immediately after submitting:
        // installation is asynchronous on macOS, so an immediate query always reports
        // "not installed, not awaiting approval" and the UI would show nothing.
        const result = await backend.activate();
        electron_log_1.default.info("[VCAM] activation result:", result);
        applyInstallationState((0, installation_operations_1.installationStateFromMutation)(currentInstallationState(), result));
        lastError = result.outcome === "failed" ? result.message : undefined;
        // Reconcile, not just emit: enabling during a live recording has to arm
        // camera-usage polling and start the relay for a consumer that is already
        // attached, the way the disable path does for the symmetric case.
        if (installed) {
            startObserving(backend);
            reconcile();
        }
        else {
            emitStatus();
        }
        return buildStatus();
    });
}
async function disableVirtualCamera() {
    return serializeLifecycle(async () => {
        const previousState = currentInstallationState();
        // Stop feeding before the device disappears, so the relay isn't left writing
        // into a sink that no longer exists.
        stopCameraRuntime();
        if (!backend) {
            installed = false;
            awaitingApproval = false;
            lastError = undefined;
            emitStatus();
            return buildStatus();
        }
        const result = await (0, installation_operations_1.deactivateExtensionInstallation)(backend);
        electron_log_1.default.info("[VCAM] deactivation result:", result);
        pendingDisable.recordDisableResult(result);
        pendingDisableRetry.sync(pendingDisable.isPending());
        // Pending and failed requests cannot prove removal, so keep the prior state
        // and restore observation until macOS provides an authoritative verdict.
        applyInstallationState((0, installation_operations_1.installationStateFromMutation)(previousState, result));
        lastError = result.outcome === "failed" ? result.message : undefined;
        if (installed) {
            startObserving(backend);
            reconcile();
        }
        else {
            emitStatus();
        }
        return buildStatus();
    });
}
function onVirtualCameraStatusChanged(callback) {
    statusListeners.push(callback);
    return () => {
        const index = statusListeners.indexOf(callback);
        if (index >= 0)
            statusListeners.splice(index, 1);
    };
}
/**
 * Called when the renderer syncs recording state, so the chip and the tray's
 * active icon are driven by the same signal and can never disagree.
 */
function notifyRecordingStateChanged() {
    reconcile();
}
function shutdownVirtualCamera() {
    pendingDisable.cancel();
    pendingDisableRetry.cancel();
    stopCameraRuntime();
    // Last, and after the relay is down: this is what releases the camera to feed
    // itself, and it must not happen while our own relay still holds the webcam.
    backend?.setAppPresent(false);
}
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installationStateFromStatus = installationStateFromStatus;
exports.installationStateFromMutation = installationStateFromMutation;
exports.installationStateAfterStatusMutation = installationStateAfterStatusMutation;
exports.reconcileExtensionInstallation = reconcileExtensionInstallation;
exports.deactivateExtensionInstallation = deactivateExtensionInstallation;
const installation_version_1 = require("./installation-version");
const REPLACEMENT_PENDING_MESSAGE = "The camera extension replacement is still pending in macOS.";
function isSuccessfulStatus(result) {
    return result.outcome === "properties";
}
function resultState(result) {
    return {
        installed: result.installed,
        awaitingApproval: result.awaitingApproval,
    };
}
function preserveKnownState(previous, result) {
    return {
        installed: previous.installed || result.installed,
        awaitingApproval: previous.awaitingApproval || result.awaitingApproval,
    };
}
function installationStateFromStatus(previous, result) {
    return result.outcome === "properties"
        ? resultState(result)
        : preserveKnownState(previous, result);
}
function installationStateFromMutation(previous, result) {
    return result.outcome === "completed" || result.outcome === "properties"
        ? resultState(result)
        : preserveKnownState(previous, result);
}
function installationStateAfterStatusMutation(previous, status, mutation) {
    return installationStateFromMutation(installationStateFromStatus(previous, status), mutation);
}
function withKnownState(verdict, known) {
    return {
        ...verdict,
        installed: known.installed,
        awaitingApproval: known.awaitingApproval || verdict.awaitingApproval,
        ...(known.macosSystemExtension
            ? { macosSystemExtension: known.macosSystemExtension }
            : {}),
    };
}
function replacementPending(status) {
    return {
        ...status,
        outcome: "failed",
        message: REPLACEMENT_PENDING_MESSAGE,
        code: 0,
    };
}
/** Refreshes and replaces an enabled stale macOS extension when necessary. */
async function reconcileExtensionInstallation(operations) {
    const initial = await operations.status();
    if (!isSuccessfulStatus(initial) || !(0, installation_version_1.needsReplacement)(initial)) {
        return initial;
    }
    const activation = await operations.activate();
    if (activation.outcome === "needsApproval") {
        return withKnownState(activation, initial);
    }
    const refreshed = await operations.status();
    if (!isSuccessfulStatus(refreshed)) {
        const failure = activation.outcome === "failed" ? activation : refreshed;
        return withKnownState(failure, initial);
    }
    if (activation.outcome === "failed") {
        return withKnownState(activation, refreshed);
    }
    return refreshed;
}
/**
 * Deactivates only the extension version embedded in the running macOS app.
 * Windows has no version metadata and keeps its direct registration flow.
 */
async function deactivateExtensionInstallation(operations, initialStatus, beforeDeactivation, forceDeactivation = false) {
    let current = initialStatus ?? (await operations.status());
    if (!isSuccessfulStatus(current))
        return current;
    if (!current.macosSystemExtension) {
        return forceDeactivation
            ? replacementPending(current)
            : operations.deactivate();
    }
    let activatedCurrent = false;
    if (!forceDeactivation && (0, installation_version_1.needsReplacement)(current)) {
        const activation = await operations.activate();
        if (activation.outcome === "needsApproval") {
            return withKnownState(activation, current);
        }
        const refreshed = await operations.status();
        if (!isSuccessfulStatus(refreshed)) {
            if (activation.outcome === "failed") {
                return withKnownState(activation, current);
            }
            return {
                ...withKnownState(refreshed, current),
                retryDeactivation: true,
            };
        }
        if (activation.outcome === "failed") {
            return withKnownState(activation, refreshed);
        }
        current = refreshed;
        activatedCurrent = true;
    }
    const canForceWithoutCurrent = forceDeactivation && (0, installation_version_1.allowsForcedDeactivation)(current);
    if (!activatedCurrent &&
        !(0, installation_version_1.hasCurrentRegistration)(current) &&
        !canForceWithoutCurrent) {
        if (!forceDeactivation && !current.installed)
            return current;
        return replacementPending(current);
    }
    beforeDeactivation?.();
    const deactivation = await operations.deactivate();
    if (deactivation.outcome === "needsApproval") {
        return withKnownState(deactivation, current);
    }
    const refreshed = await operations.status();
    if (!isSuccessfulStatus(refreshed)) {
        const failure = deactivation.outcome === "failed" ? deactivation : refreshed;
        return withKnownState(failure, current);
    }
    if (deactivation.outcome === "failed") {
        return withKnownState(deactivation, refreshed);
    }
    return refreshed;
}
//# sourceMappingURL=installation-operations.js.map
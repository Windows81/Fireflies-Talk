"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingDisableController = void 0;
exports.pendingDisableRuntimeAction = pendingDisableRuntimeAction;
const installation_operations_1 = require("./installation-operations");
function pendingDisableRuntimeAction({ wasPending, isPending, usedMutationResult, previousInstalled, installed, authoritative, }) {
    if (usedMutationResult)
        return installed ? "restore" : "stop";
    if (authoritative && previousInstalled !== installed) {
        return installed ? "restore" : "stop";
    }
    if (wasPending && !isPending && !installed)
        return "stop";
    return "unchanged";
}
function shouldRemainPending(result) {
    return (result.outcome === "needsApproval" ||
        result.awaitingApproval ||
        result.retryDeactivation === true);
}
class PendingDisableController {
    constructor() {
        this.pending = false;
        this.forceDeactivation = false;
    }
    recordDisableResult(result) {
        this.captureResult(result);
    }
    cancel() {
        this.pending = false;
        this.forceDeactivation = false;
    }
    isPending() {
        return this.pending;
    }
    async continueAfterStatus(operations, status, beforeMutation) {
        if (!this.pending) {
            return {
                result: status,
                usedMutationResult: false,
                processedAuthoritativeStatus: false,
            };
        }
        if (status.outcome !== "properties") {
            return {
                result: status,
                usedMutationResult: false,
                processedAuthoritativeStatus: false,
            };
        }
        let usedMutationResult = false;
        const result = await (0, installation_operations_1.deactivateExtensionInstallation)(operations, status, () => {
            usedMutationResult = true;
            beforeMutation?.();
        }, this.forceDeactivation);
        this.captureResult(result);
        return {
            result,
            usedMutationResult,
            processedAuthoritativeStatus: true,
        };
    }
    captureResult(result) {
        this.pending = shouldRemainPending(result);
        this.forceDeactivation = result.retryDeactivation === true;
    }
}
exports.PendingDisableController = PendingDisableController;
//# sourceMappingURL=pending-disable-controller.js.map
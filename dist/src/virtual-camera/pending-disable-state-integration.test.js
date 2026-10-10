"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const installation_operations_1 = require("./installation-operations");
const installation_operations_test_helpers_1 = require("./installation-operations.test-helpers");
const pending_disable_controller_1 = require("./pending-disable-controller");
function recordPendingApproval(controller) {
    controller.recordDisableResult((0, installation_operations_test_helpers_1.result)({
        outcome: "needsApproval",
        awaitingApproval: true,
        message: "Awaiting user approval in System Settings",
    }));
}
function stateAfterContinuation(previous, status, continuation) {
    return continuation.processedAuthoritativeStatus
        ? (0, installation_operations_1.installationStateAfterStatusMutation)(previous, status, continuation.result)
        : (0, installation_operations_1.installationStateFromStatus)(previous, continuation.result);
}
(0, node_test_1.test)("an activation failure retains the authoritative pending status baseline", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const approvedOldVersion = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [approvedOldVersion],
        activation: (0, installation_operations_test_helpers_1.result)({
            outcome: "failed",
            message: "replacement failed",
            code: 4,
        }),
    });
    const previous = { installed: false, awaitingApproval: true };
    recordPendingApproval(controller);
    const continuation = await controller.continueAfterStatus(fixture.operations, approvedOldVersion);
    const state = stateAfterContinuation(previous, approvedOldVersion, continuation);
    strict_1.default.deepEqual(state, { installed: true, awaitingApproval: false });
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: true,
        isPending: controller.isPending(),
        usedMutationResult: continuation.usedMutationResult,
        previousInstalled: previous.installed,
        installed: state.installed,
        authoritative: continuation.processedAuthoritativeStatus,
    }), "restore");
    strict_1.default.deepEqual(fixture.calls, ["activate", "status"]);
});
(0, node_test_1.test)("an unsafe early return retains the authoritative pending status baseline", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    controller.recordDisableResult({
        ...(0, installation_operations_test_helpers_1.result)({ outcome: "failed", installed: true }),
        retryDeactivation: true,
    });
    const unsafeStatus = (0, installation_operations_test_helpers_1.macStatus)([
        {
            ...installation_operations_test_helpers_1.oldRegistration,
            bundleVersion: "2",
            bundleShortVersion: "2.0.0",
            enabled: false,
        },
    ]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({ statuses: [] });
    const previous = { installed: true, awaitingApproval: true };
    const continuation = await controller.continueAfterStatus(fixture.operations, unsafeStatus);
    const state = stateAfterContinuation(previous, unsafeStatus, continuation);
    strict_1.default.equal(continuation.result.outcome, "failed");
    strict_1.default.equal(continuation.usedMutationResult, false);
    strict_1.default.deepEqual(state, { installed: false, awaitingApproval: false });
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: true,
        isPending: controller.isPending(),
        usedMutationResult: continuation.usedMutationResult,
        previousInstalled: previous.installed,
        installed: state.installed,
        authoritative: continuation.processedAuthoritativeStatus,
    }), "stop");
    strict_1.default.deepEqual(fixture.calls, []);
});
//# sourceMappingURL=pending-disable-state-integration.test.js.map
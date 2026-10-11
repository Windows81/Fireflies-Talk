"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const installation_operations_1 = require("./installation-operations");
const pending_disable_controller_1 = require("./pending-disable-controller");
const installation_operations_test_helpers_1 = require("./installation-operations.test-helpers");
function recordPendingDisable(controller) {
    controller.recordDisableResult((0, installation_operations_test_helpers_1.result)({
        outcome: "needsApproval",
        awaitingApproval: true,
        message: "Awaiting user approval in System Settings",
    }));
}
(0, node_test_1.test)("a gated approval status submits no mutation", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({ statuses: [] });
    const gated = (0, installation_operations_test_helpers_1.result)({
        outcome: "needsApproval",
        awaitingApproval: true,
        message: "Awaiting user approval in System Settings",
    });
    recordPendingDisable(controller);
    strict_1.default.equal(controller.isPending(), true);
    strict_1.default.deepEqual(await controller.continueAfterStatus(fixture.operations, gated), {
        result: gated,
        usedMutationResult: false,
        processedAuthoritativeStatus: false,
    });
    strict_1.default.deepEqual(fixture.calls, []);
    strict_1.default.equal(controller.isPending(), true);
});
(0, node_test_1.test)("a failed status preserves OFF intent until properties arrive", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const approved = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const failedStatus = (0, installation_operations_test_helpers_1.result)({
        outcome: "failed",
        installed: true,
        message: "status unavailable",
        code: 4,
    });
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    recordPendingDisable(controller);
    strict_1.default.deepEqual(await controller.continueAfterStatus(fixture.operations, failedStatus), {
        result: failedStatus,
        usedMutationResult: false,
        processedAuthoritativeStatus: false,
    });
    strict_1.default.deepEqual(fixture.calls, []);
    strict_1.default.deepEqual(await controller.continueAfterStatus(fixture.operations, approved), {
        result: disabled,
        usedMutationResult: true,
        processedAuthoritativeStatus: true,
    });
    strict_1.default.deepEqual(fixture.calls, ["deactivate", "status"]);
    strict_1.default.equal(controller.isPending(), false);
});
(0, node_test_1.test)("a successful replacement with a failed refresh retains OFF intent", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const failedRefresh = (0, installation_operations_test_helpers_1.result)({
        outcome: "failed",
        installed: true,
        message: "status refresh failed",
        code: 4,
    });
    const replacement = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]), failedRefresh],
        activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
    });
    const first = await (0, installation_operations_1.deactivateExtensionInstallation)(replacement.operations);
    strict_1.default.equal(first.retryDeactivation, true);
    controller.recordDisableResult(first);
    strict_1.default.equal(controller.isPending(), true);
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const continuation = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    strict_1.default.deepEqual(await controller.continueAfterStatus(continuation.operations, (0, installation_operations_test_helpers_1.macStatus)([])), {
        result: disabled,
        usedMutationResult: true,
        processedAuthoritativeStatus: true,
    });
    strict_1.default.deepEqual(replacement.calls, ["status", "activate", "status"]);
    strict_1.default.deepEqual(continuation.calls, ["deactivate", "status"]);
    strict_1.default.equal(controller.isPending(), false);
});
(0, node_test_1.test)("runtime follows pending and authoritative installation transitions", () => {
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: true,
        isPending: false,
        usedMutationResult: false,
        previousInstalled: true,
        installed: false,
        authoritative: true,
    }), "stop");
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: true,
        isPending: false,
        usedMutationResult: true,
        previousInstalled: true,
        installed: true,
        authoritative: true,
    }), "restore");
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: false,
        isPending: false,
        usedMutationResult: false,
        previousInstalled: false,
        installed: false,
        authoritative: true,
    }), "unchanged");
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: false,
        isPending: false,
        usedMutationResult: false,
        previousInstalled: false,
        installed: true,
        authoritative: true,
    }), "restore");
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: false,
        isPending: false,
        usedMutationResult: false,
        previousInstalled: true,
        installed: false,
        authoritative: false,
    }), "unchanged");
});
(0, node_test_1.test)("an authoritative disabled status stops runtime after a failed refresh", async () => {
    const initial = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const failedRefresh = (0, installation_operations_test_helpers_1.result)({
        outcome: "failed",
        installed: false,
        message: "status refresh failed",
        code: 4,
    });
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [initial, failedRefresh],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    const failed = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations);
    const conservative = (0, installation_operations_1.installationStateFromMutation)({ installed: true, awaitingApproval: false }, failed);
    const disabledStatus = (0, installation_operations_test_helpers_1.macStatus)([]);
    const authoritative = (0, installation_operations_1.installationStateFromStatus)(conservative, disabledStatus);
    strict_1.default.equal(conservative.installed, true);
    strict_1.default.equal(authoritative.installed, false);
    strict_1.default.equal((0, pending_disable_controller_1.pendingDisableRuntimeAction)({
        wasPending: false,
        isPending: false,
        usedMutationResult: false,
        previousInstalled: conservative.installed,
        installed: authoritative.installed,
        authoritative: true,
    }), "stop");
});
(0, node_test_1.test)("approved current extension is deactivated exactly once", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const approved = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    recordPendingDisable(controller);
    strict_1.default.deepEqual(await controller.continueAfterStatus(fixture.operations, approved), {
        result: disabled,
        usedMutationResult: true,
        processedAuthoritativeStatus: true,
    });
    strict_1.default.deepEqual(fixture.calls, ["deactivate", "status"]);
    strict_1.default.deepEqual(await controller.continueAfterStatus(fixture.operations, approved), {
        result: approved,
        usedMutationResult: false,
        processedAuthoritativeStatus: false,
    });
    strict_1.default.deepEqual(fixture.calls, ["deactivate", "status"]);
});
(0, node_test_1.test)("a later enable cancels the pending OFF intent", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const approved = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({ statuses: [] });
    recordPendingDisable(controller);
    controller.cancel();
    strict_1.default.deepEqual(await controller.continueAfterStatus(fixture.operations, approved), {
        result: approved,
        usedMutationResult: false,
        processedAuthoritativeStatus: false,
    });
    strict_1.default.deepEqual(fixture.calls, []);
});
(0, node_test_1.test)("the runtime stop hook fires exactly once only before mutation", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const noCurrentController = new pending_disable_controller_1.PendingDisableController();
    const gated = (0, installation_operations_test_helpers_1.result)({
        outcome: "needsApproval",
        awaitingApproval: true,
    });
    const approved = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    let runtimeStops = 0;
    const stopRuntime = () => {
        runtimeStops++;
    };
    recordPendingDisable(controller);
    recordPendingDisable(noCurrentController);
    await noCurrentController.continueAfterStatus(fixture.operations, disabled, stopRuntime);
    strict_1.default.equal(runtimeStops, 0);
    await controller.continueAfterStatus(fixture.operations, gated, stopRuntime);
    strict_1.default.equal(runtimeStops, 0);
    await controller.continueAfterStatus(fixture.operations, approved, stopRuntime);
    strict_1.default.equal(runtimeStops, 1);
    await controller.continueAfterStatus(fixture.operations, approved, stopRuntime);
    strict_1.default.equal(runtimeStops, 1);
});
(0, node_test_1.test)("a non-approval failure clears OFF intent and does not loop", async () => {
    const controller = new pending_disable_controller_1.PendingDisableController();
    const approved = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [approved],
        deactivation: (0, installation_operations_test_helpers_1.result)({
            outcome: "failed",
            installed: true,
            message: "deactivation failed",
            code: 4,
        }),
    });
    recordPendingDisable(controller);
    const first = await controller.continueAfterStatus(fixture.operations, approved);
    strict_1.default.equal(first.result.outcome, "failed");
    strict_1.default.equal(first.usedMutationResult, true);
    strict_1.default.deepEqual(fixture.calls, ["deactivate", "status"]);
    strict_1.default.deepEqual(await controller.continueAfterStatus(fixture.operations, approved), {
        result: approved,
        usedMutationResult: false,
        processedAuthoritativeStatus: false,
    });
    strict_1.default.deepEqual(fixture.calls, ["deactivate", "status"]);
});
//# sourceMappingURL=pending-disable-controller.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const installation_operations_1 = require("./installation-operations");
const installation_operations_test_helpers_1 = require("./installation-operations.test-helpers");
(0, node_test_1.test)("a failed deactivation and failed refresh retain the last installed state", async () => {
    const initial = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [
            initial,
            (0, installation_operations_test_helpers_1.result)({
                outcome: "failed",
                installed: false,
                message: "status refresh failed",
                code: 4,
            }),
        ],
        deactivation: (0, installation_operations_test_helpers_1.result)({
            outcome: "failed",
            installed: false,
            message: "authorization failed",
            code: 13,
        }),
    });
    const actual = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations);
    strict_1.default.equal(actual.outcome, "failed");
    strict_1.default.equal(actual.installed, true);
    strict_1.default.equal(actual.message, "authorization failed");
    strict_1.default.deepEqual(actual.macosSystemExtension, initial.macosSystemExtension);
    strict_1.default.deepEqual(fixture.calls, ["status", "deactivate", "status"]);
});
(0, node_test_1.test)("an initial status failure submits no activation or deactivation", async () => {
    const failedStatus = (0, installation_operations_test_helpers_1.result)({
        outcome: "failed",
        message: "status unavailable",
        code: 4,
    });
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({ statuses: [failedStatus] });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations), failedStatus);
    strict_1.default.deepEqual(fixture.calls, ["status"]);
});
(0, node_test_1.test)("an inactive exact current registration does not mask an enabled old version", async (t) => {
    const inactiveCurrent = { ...installation_operations_test_helpers_1.currentRegistration, enabled: false };
    const orders = [
        {
            name: "old registration first",
            registrations: [installation_operations_test_helpers_1.oldRegistration, inactiveCurrent],
        },
        {
            name: "current registration first",
            registrations: [inactiveCurrent, installation_operations_test_helpers_1.oldRegistration],
        },
    ];
    for (const order of orders) {
        await t.test(order.name, async () => {
            const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
            const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
                statuses: [(0, installation_operations_test_helpers_1.macStatus)(order.registrations), refreshed],
                activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
            });
            strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), refreshed);
            strict_1.default.deepEqual(fixture.calls, ["status", "activate", "status"]);
        });
    }
});
(0, node_test_1.test)("activation needing approval preserves old installed state without refreshing", async () => {
    const initial = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [initial],
        activation: (0, installation_operations_test_helpers_1.result)({
            outcome: "needsApproval",
            awaitingApproval: true,
            message: "Awaiting user approval in System Settings",
        }),
    });
    const actual = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations);
    strict_1.default.equal(actual.outcome, "needsApproval");
    strict_1.default.equal(actual.installed, true);
    strict_1.default.equal(actual.awaitingApproval, true);
    strict_1.default.deepEqual(actual.macosSystemExtension, initial.macosSystemExtension);
    strict_1.default.deepEqual(fixture.calls, ["status", "activate"]);
});
(0, node_test_1.test)("an exact current registration awaiting approval submits guarded deactivation", async () => {
    const pendingCurrent = {
        ...installation_operations_test_helpers_1.currentRegistration,
        enabled: false,
        awaitingApproval: true,
    };
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration, pendingCurrent])],
        deactivation: (0, installation_operations_test_helpers_1.result)({
            outcome: "needsApproval",
            awaitingApproval: true,
            message: "Awaiting user approval in System Settings",
        }),
    });
    const actual = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations);
    strict_1.default.equal(actual.outcome, "needsApproval");
    strict_1.default.equal(actual.installed, true);
    strict_1.default.equal(actual.awaitingApproval, true);
    strict_1.default.deepEqual(fixture.calls, ["status", "deactivate"]);
});
(0, node_test_1.test)("activation completing after reboot is followed by deactivation", async () => {
    const inactiveCurrent = { ...installation_operations_test_helpers_1.currentRegistration, enabled: false };
    const finalStatus = (0, installation_operations_test_helpers_1.macStatus)([
        { ...installation_operations_test_helpers_1.oldRegistration, isUninstalling: true },
        { ...inactiveCurrent, isUninstalling: true },
    ]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [
            (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]),
            (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration, inactiveCurrent]),
            finalStatus,
        ],
        activation: (0, installation_operations_test_helpers_1.result)({
            installed: true,
            message: "Will complete after reboot",
            code: 1,
        }),
        deactivation: (0, installation_operations_test_helpers_1.result)({
            installed: true,
            message: "Will complete after reboot",
            code: 1,
        }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations), finalStatus);
    strict_1.default.deepEqual(fixture.calls, [
        "status",
        "activate",
        "status",
        "deactivate",
        "status",
    ]);
    strict_1.default.deepEqual(finalStatus.macosSystemExtension?.embedded, installation_operations_test_helpers_1.embedded);
});
(0, node_test_1.test)("disable deactivates an exact current registration scheduled after reboot", async () => {
    const inactiveCurrent = { ...installation_operations_test_helpers_1.currentRegistration, enabled: false };
    const uninstallingOld = { ...installation_operations_test_helpers_1.oldRegistration, isUninstalling: true };
    const initial = (0, installation_operations_test_helpers_1.macStatus)([uninstallingOld, inactiveCurrent]);
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([
        uninstallingOld,
        { ...inactiveCurrent, isUninstalling: true },
    ]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [initial, disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({
            installed: false,
            message: "Will complete after reboot",
            code: 1,
        }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations), disabled);
    strict_1.default.deepEqual(fixture.calls, ["status", "deactivate", "status"]);
});
(0, node_test_1.test)("disable does not mutate when no current registration is installed", async () => {
    const initial = (0, installation_operations_test_helpers_1.macStatus)([]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({ statuses: [initial] });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations), initial);
    strict_1.default.deepEqual(fixture.calls, ["status"]);
});
(0, node_test_1.test)("disable accepts a prefetched status without a redundant query", async () => {
    const initial = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations, initial), disabled);
    strict_1.default.deepEqual(fixture.calls, ["deactivate", "status"]);
});
//# sourceMappingURL=installation-operations.edge-cases.test.js.map
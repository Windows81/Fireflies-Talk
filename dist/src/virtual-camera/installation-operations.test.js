"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const installation_operations_1 = require("./installation-operations");
const installation_operations_test_helpers_1 = require("./installation-operations.test-helpers");
(0, node_test_1.test)("startup leaves an enabled current extension alone", async () => {
    const status = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({ statuses: [status] });
    strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), status);
    strict_1.default.deepEqual(fixture.calls, ["status"]);
});
(0, node_test_1.test)("startup replaces an enabled extension when either version is older", async (t) => {
    const olderVersions = [
        {
            name: "bundle version differs",
            registration: {
                ...installation_operations_test_helpers_1.currentRegistration,
                bundleVersion: "0",
            },
        },
        {
            name: "short version differs",
            registration: {
                ...installation_operations_test_helpers_1.currentRegistration,
                bundleShortVersion: "0.9.0",
            },
        },
    ];
    for (const version of olderVersions) {
        await t.test(version.name, async () => {
            const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
            const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
                statuses: [(0, installation_operations_test_helpers_1.macStatus)([version.registration]), refreshed],
                activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
            });
            strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), refreshed);
            strict_1.default.deepEqual(fixture.calls, ["status", "activate", "status"]);
        });
    }
});
(0, node_test_1.test)("an uninstalling current tombstone does not prevent replacement", async () => {
    const tombstone = {
        ...installation_operations_test_helpers_1.currentRegistration,
        enabled: true,
        isUninstalling: true,
    };
    const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration, tombstone]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration, tombstone]), refreshed],
        activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), refreshed);
    strict_1.default.deepEqual(fixture.calls, ["status", "activate", "status"]);
});
(0, node_test_1.test)("a failed startup replacement keeps the refreshed installed state", async () => {
    const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]), refreshed],
        activation: (0, installation_operations_test_helpers_1.result)({
            outcome: "failed",
            message: "replacement refused",
            code: 9,
        }),
    });
    const actual = await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations);
    strict_1.default.equal(actual.outcome, "failed");
    strict_1.default.equal(actual.installed, true);
    strict_1.default.equal(actual.message, "replacement refused");
    strict_1.default.equal(actual.code, 9);
    strict_1.default.deepEqual(fixture.calls, ["status", "activate", "status"]);
});
(0, node_test_1.test)("disable replaces an old version before deactivating the current one", async () => {
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [
            (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]),
            (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]),
            disabled,
        ],
        activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations), disabled);
    strict_1.default.deepEqual(fixture.calls, [
        "status",
        "activate",
        "status",
        "deactivate",
        "status",
    ]);
});
(0, node_test_1.test)("disable does not deactivate the old version when activation fails", async () => {
    const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration]), refreshed],
        activation: (0, installation_operations_test_helpers_1.result)({
            outcome: "failed",
            message: "replacement refused",
            code: 9,
        }),
    });
    const actual = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations);
    strict_1.default.equal(actual.outcome, "failed");
    strict_1.default.equal(actual.installed, true);
    strict_1.default.equal(actual.message, "replacement refused");
    strict_1.default.deepEqual(fixture.calls, ["status", "activate", "status"]);
});
(0, node_test_1.test)("a failed deactivation keeps the refreshed installed state", async () => {
    const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]), refreshed],
        deactivation: (0, installation_operations_test_helpers_1.result)({
            outcome: "failed",
            message: "authorization failed",
            code: 13,
        }),
    });
    const actual = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations);
    strict_1.default.equal(actual.outcome, "failed");
    strict_1.default.equal(actual.installed, true);
    strict_1.default.equal(actual.message, "authorization failed");
    strict_1.default.equal(actual.code, 13);
    strict_1.default.deepEqual(fixture.calls, ["status", "deactivate", "status"]);
});
(0, node_test_1.test)("a successful deactivation returns the refreshed disabled state", async () => {
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]), disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations), disabled);
    strict_1.default.deepEqual(fixture.calls, ["status", "deactivate", "status"]);
});
(0, node_test_1.test)("metadata-absent Windows disable stays a direct deactivation", async () => {
    const deactivated = (0, installation_operations_test_helpers_1.result)({ installed: false });
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.result)({ outcome: "properties", installed: true })],
        deactivation: deactivated,
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations), deactivated);
    strict_1.default.deepEqual(fixture.calls, ["status", "deactivate"]);
});
//# sourceMappingURL=installation-operations.test.js.map
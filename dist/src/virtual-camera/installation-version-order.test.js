"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const installation_operations_1 = require("./installation-operations");
const installation_operations_test_helpers_1 = require("./installation-operations.test-helpers");
const release040 = {
    ...installation_operations_test_helpers_1.currentRegistration,
    bundleVersion: "0.1.40",
    bundleShortVersion: "0.1.40",
};
const newerRelease = {
    ...installation_operations_test_helpers_1.currentRegistration,
    bundleVersion: "2",
    bundleShortVersion: "2.0.0",
};
(0, node_test_1.test)("embedded version 1 replaces enabled extension version 0.1.40", async () => {
    const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([release040]), refreshed],
        activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), refreshed);
    strict_1.default.deepEqual(fixture.calls, ["status", "activate", "status"]);
});
(0, node_test_1.test)("an older app does not replace a newer enabled extension", async (t) => {
    const newerVersions = [
        { name: "newer bundle version", registration: newerRelease },
        {
            name: "newer short version after equal bundle version",
            registration: {
                ...installation_operations_test_helpers_1.currentRegistration,
                bundleShortVersion: "2.0.0",
            },
        },
    ];
    for (const version of newerVersions) {
        await t.test(version.name, async () => {
            const initial = (0, installation_operations_test_helpers_1.macStatus)([version.registration]);
            const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
                statuses: [initial, initial],
                activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
            });
            strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), initial);
            strict_1.default.deepEqual(fixture.calls, ["status"]);
        });
    }
});
(0, node_test_1.test)("an older app does not deactivate a newer enabled extension", async () => {
    const initial = (0, installation_operations_test_helpers_1.macStatus)([newerRelease]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [initial, initial, initial],
        activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    const actual = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations);
    strict_1.default.equal(actual.outcome, "failed");
    strict_1.default.equal(actual.installed, true);
    strict_1.default.deepEqual(fixture.calls, ["status"]);
});
(0, node_test_1.test)("any newer or malformed registration prevents replacement", async (t) => {
    const malformed = {
        ...installation_operations_test_helpers_1.currentRegistration,
        bundleVersion: "unknown",
        bundleShortVersion: "beta",
    };
    const cases = [
        [installation_operations_test_helpers_1.oldRegistration, newerRelease],
        [newerRelease, installation_operations_test_helpers_1.oldRegistration],
        [installation_operations_test_helpers_1.oldRegistration, malformed],
        [malformed, installation_operations_test_helpers_1.oldRegistration],
        [installation_operations_test_helpers_1.oldRegistration, { ...newerRelease, enabled: false }],
        [installation_operations_test_helpers_1.oldRegistration, { ...malformed, enabled: false }],
    ];
    for (const registrations of cases) {
        await t.test(registrations.map(({ bundleVersion }) => bundleVersion).join(", "), async () => {
            const initial = (0, installation_operations_test_helpers_1.macStatus)(registrations);
            const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
                statuses: [initial, initial],
                activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
            });
            strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), initial);
            strict_1.default.deepEqual(fixture.calls, ["status"]);
        });
    }
});
(0, node_test_1.test)("an uninstalling newer tombstone does not block replacement", async () => {
    const newerTombstone = { ...newerRelease, isUninstalling: true };
    const refreshed = (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.currentRegistration, newerTombstone]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [(0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration, newerTombstone]), refreshed],
        activation: (0, installation_operations_test_helpers_1.result)({ installed: true }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.reconcileExtensionInstallation)(fixture.operations), refreshed);
    strict_1.default.deepEqual(fixture.calls, ["status", "activate", "status"]);
});
(0, node_test_1.test)("forced deactivation refuses unsafe registrations", async (t) => {
    const unsafeRegistrations = [
        {
            name: "newer",
            registration: newerRelease,
            expectedOutcome: "failed",
            expectedInstalled: true,
        },
        {
            name: "numerically equal but non-current",
            registration: { ...installation_operations_test_helpers_1.currentRegistration, bundleVersion: "01" },
            expectedOutcome: "failed",
            expectedInstalled: true,
        },
        {
            name: "malformed",
            registration: {
                ...installation_operations_test_helpers_1.currentRegistration,
                bundleVersion: "unknown",
                bundleShortVersion: "beta",
            },
            expectedOutcome: "failed",
            expectedInstalled: true,
        },
        {
            name: "inactive newer",
            registration: { ...newerRelease, enabled: false },
            expectedOutcome: "failed",
            expectedInstalled: false,
        },
        {
            name: "inactive malformed",
            registration: {
                ...installation_operations_test_helpers_1.currentRegistration,
                bundleVersion: "unknown",
                bundleShortVersion: "beta",
                enabled: false,
            },
            expectedOutcome: "failed",
            expectedInstalled: false,
        },
    ];
    for (const unsafe of unsafeRegistrations) {
        await t.test(unsafe.name, async () => {
            const initial = (0, installation_operations_test_helpers_1.macStatus)([unsafe.registration]);
            const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
                statuses: [(0, installation_operations_test_helpers_1.macStatus)([])],
                deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
            });
            const actual = await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations, initial, undefined, true);
            strict_1.default.equal(actual.outcome, unsafe.expectedOutcome);
            strict_1.default.equal(actual.installed, unsafe.expectedInstalled);
            strict_1.default.deepEqual(fixture.calls, []);
        });
    }
});
(0, node_test_1.test)("forced deactivation proceeds with only known older registrations", async () => {
    const disabled = (0, installation_operations_test_helpers_1.macStatus)([]);
    const fixture = (0, installation_operations_test_helpers_1.fakeOperations)({
        statuses: [disabled],
        deactivation: (0, installation_operations_test_helpers_1.result)({ installed: false }),
    });
    strict_1.default.deepEqual(await (0, installation_operations_1.deactivateExtensionInstallation)(fixture.operations, (0, installation_operations_test_helpers_1.macStatus)([installation_operations_test_helpers_1.oldRegistration, { ...newerRelease, isUninstalling: true }]), undefined, true), disabled);
    strict_1.default.deepEqual(fixture.calls, ["deactivate", "status"]);
});
//# sourceMappingURL=installation-version-order.test.js.map
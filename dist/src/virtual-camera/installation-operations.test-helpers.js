"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oldRegistration = exports.currentRegistration = exports.embedded = void 0;
exports.result = result;
exports.macStatus = macStatus;
exports.fakeOperations = fakeOperations;
const strict_1 = __importDefault(require("node:assert/strict"));
exports.embedded = {
    bundleVersion: "1",
    bundleShortVersion: "1.0.0",
};
exports.currentRegistration = {
    ...exports.embedded,
    enabled: true,
    awaitingApproval: false,
    isUninstalling: false,
};
exports.oldRegistration = {
    bundleVersion: "0.1.39",
    bundleShortVersion: "0.1.39",
    enabled: true,
    awaitingApproval: false,
    isUninstalling: false,
};
function result(overrides = {}) {
    return {
        outcome: "completed",
        installed: false,
        awaitingApproval: false,
        message: "",
        code: 0,
        ...overrides,
    };
}
function macStatus(registrations) {
    return result({
        outcome: "properties",
        installed: registrations.some((registration) => registration.enabled && !registration.isUninstalling),
        awaitingApproval: registrations.some((registration) => registration.awaitingApproval),
        message: `${registrations.length} version(s) known`,
        code: registrations.length,
        macosSystemExtension: { embedded: exports.embedded, registrations },
    });
}
function fakeOperations(options) {
    const calls = [];
    const statuses = [...options.statuses];
    return {
        calls,
        operations: {
            async status() {
                calls.push("status");
                const next = statuses.shift();
                strict_1.default.ok(next, "test fixture supplied too few status responses");
                return next;
            },
            async activate() {
                calls.push("activate");
                strict_1.default.ok(options.activation, "unexpected activation request");
                return options.activation;
            },
            async deactivate() {
                calls.push("deactivate");
                strict_1.default.ok(options.deactivation, "unexpected deactivation request");
                return options.deactivation;
            },
        },
    };
}
//# sourceMappingURL=installation-operations.test-helpers.js.map
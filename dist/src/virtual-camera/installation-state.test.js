"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const installation_operations_1 = require("./installation-operations");
const installation_operations_test_helpers_1 = require("./installation-operations.test-helpers");
(0, node_test_1.test)("status approval and failure results preserve known installation state", () => {
    strict_1.default.deepEqual((0, installation_operations_1.installationStateFromStatus)({ installed: true, awaitingApproval: false }, (0, installation_operations_test_helpers_1.result)({
        outcome: "needsApproval",
        installed: false,
        awaitingApproval: true,
    })), { installed: true, awaitingApproval: true });
    strict_1.default.deepEqual((0, installation_operations_1.installationStateFromStatus)({ installed: true, awaitingApproval: true }, (0, installation_operations_test_helpers_1.result)({ outcome: "failed", installed: false })), { installed: true, awaitingApproval: true });
});
(0, node_test_1.test)("only a properties status replaces cached installation state", () => {
    const previous = { installed: true, awaitingApproval: true };
    strict_1.default.deepEqual((0, installation_operations_1.installationStateFromStatus)(previous, (0, installation_operations_test_helpers_1.result)({ outcome: "completed" })), previous);
    strict_1.default.deepEqual((0, installation_operations_1.installationStateFromStatus)(previous, (0, installation_operations_test_helpers_1.result)({ outcome: "properties" })), { installed: false, awaitingApproval: false });
});
(0, node_test_1.test)("mutation approval and failure results preserve known installation state", () => {
    for (const outcome of ["needsApproval", "failed"]) {
        strict_1.default.deepEqual((0, installation_operations_1.installationStateFromMutation)({ installed: true, awaitingApproval: false }, (0, installation_operations_test_helpers_1.result)({
            outcome,
            installed: false,
            awaitingApproval: true,
        })), { installed: true, awaitingApproval: true });
    }
});
(0, node_test_1.test)("a failed mutation retains positive installed evidence from its result", () => {
    strict_1.default.deepEqual((0, installation_operations_1.installationStateFromMutation)({ installed: false, awaitingApproval: false }, (0, installation_operations_test_helpers_1.result)({ outcome: "failed", installed: true })), { installed: true, awaitingApproval: false });
});
(0, node_test_1.test)("a failed status retains positive installed evidence from its result", () => {
    strict_1.default.deepEqual((0, installation_operations_1.installationStateFromStatus)({ installed: false, awaitingApproval: false }, (0, installation_operations_test_helpers_1.result)({ outcome: "failed", installed: true })), { installed: true, awaitingApproval: false });
});
(0, node_test_1.test)("completed and properties mutation results replace cached state", () => {
    const previous = { installed: true, awaitingApproval: true };
    for (const outcome of ["completed", "properties"]) {
        strict_1.default.deepEqual((0, installation_operations_1.installationStateFromMutation)(previous, (0, installation_operations_test_helpers_1.result)({ outcome })), { installed: false, awaitingApproval: false });
    }
});
(0, node_test_1.test)("an authoritative status clears stale approval before a failed mutation", () => {
    strict_1.default.deepEqual((0, installation_operations_1.installationStateAfterStatusMutation)({ installed: true, awaitingApproval: true }, (0, installation_operations_test_helpers_1.result)({
        outcome: "properties",
        installed: true,
        awaitingApproval: false,
    }), (0, installation_operations_test_helpers_1.result)({
        outcome: "failed",
        installed: false,
        awaitingApproval: false,
    })), { installed: true, awaitingApproval: false });
});
//# sourceMappingURL=installation-state.test.js.map
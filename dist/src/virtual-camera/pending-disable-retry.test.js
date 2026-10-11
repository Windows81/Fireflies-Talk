"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const pending_disable_retry_1 = require("./pending-disable-retry");
(0, node_test_1.test)("pending OFF retries are single-flight and stop when cleared", () => {
    const callbacks = [];
    const delays = [];
    const cancelled = [];
    let retries = 0;
    const retry = new pending_disable_retry_1.PendingDisableRetry(() => retries++, 250, (callback, delayMs) => {
        delays.push(delayMs);
        callbacks.push(callback);
        return callbacks.length;
    }, (handle) => cancelled.push(handle), 1000);
    retry.sync(false);
    retry.sync(true);
    retry.sync(true);
    strict_1.default.equal(callbacks.length, 1);
    callbacks[0]();
    strict_1.default.equal(retries, 1);
    retry.sync(true);
    strict_1.default.equal(callbacks.length, 2);
    retry.sync(false);
    retry.sync(false);
    strict_1.default.deepEqual(cancelled, [2]);
    // Each attempt waits longer, capped, and cancelling starts over.
    strict_1.default.deepEqual(delays, [250, 500]);
    retry.sync(true);
    strict_1.default.deepEqual(delays, [250, 500, 250]);
});
//# sourceMappingURL=pending-disable-retry.test.js.map
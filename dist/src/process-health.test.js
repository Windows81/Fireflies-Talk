"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
node_test_1.mock.module("electron", {
    namedExports: {
        app: { getAppMetrics: () => [] },
    },
});
const load = () => import("./process-health.js");
function metric(fields) {
    return {
        pid: fields.pid,
        type: fields.type,
        creationTime: 0,
        serviceName: fields.serviceName,
        name: fields.name,
        cpu: { percentCPUUsage: fields.percentCPUUsage, idleWakeupsPerSecond: 0 },
        memory: {
            workingSetSize: fields.workingSetKB,
            peakWorkingSetSize: fields.workingSetKB,
            privateBytes: fields.privateKB,
        },
    };
}
const fourCores = Array.from({ length: 4 }, () => ({ model: "Intel i5" }));
(0, node_test_1.test)("names utilities by service, prefers private bytes and sums the app", async () => {
    const { summarizeProcessHealth } = await load();
    const health = summarizeProcessHealth({
        metrics: [
            metric({
                pid: 10,
                type: "Browser",
                percentCPUUsage: 4.26,
                workingSetKB: 140000,
                privateKB: 135000,
            }),
            metric({
                pid: 20,
                type: "Utility",
                serviceName: "audio.mojom.AudioService",
                percentCPUUsage: 3.9,
                workingSetKB: 85000,
            }),
            metric({
                pid: 30,
                type: "Tab",
                percentCPUUsage: 29.44,
                workingSetKB: 340000,
                privateKB: 262000,
            }),
        ],
        memory: {
            total: 8388608,
            free: 786432,
            swapTotal: 4194304,
            swapFree: 2936012,
        },
        rendererPid: 30,
        osRelease: "10.0.26100",
        osVersion: "10.0.26100",
        arch: "x64",
        cpus: fourCores,
    });
    strict_1.default.deepEqual(health.processes, [
        { type: "Browser", pid: 10, cpuPercent: 4.3, memoryMB: 132 },
        {
            type: "Utility:audio.mojom.AudioService",
            pid: 20,
            cpuPercent: 3.9,
            memoryMB: 83,
        },
        { type: "Tab", pid: 30, cpuPercent: 29.4, memoryMB: 256 },
    ]);
    strict_1.default.equal(health.appCpuPercent, 37.6);
    strict_1.default.equal(health.appMemoryMB, 471);
    strict_1.default.equal(health.processCount, 3);
    strict_1.default.equal(health.rendererCpuPercent, 29.4, "the asking renderer");
    strict_1.default.equal(health.rendererMemoryMB, 256);
    strict_1.default.equal(health.memoryTotalMB, 8192);
    strict_1.default.equal(health.memoryAvailableMB, 768);
    strict_1.default.equal(health.swapUsedMB, 1229);
    strict_1.default.equal(health.cpuCount, 4);
    strict_1.default.equal(health.cpuModel, "Intel i5");
    strict_1.default.equal(health.osRelease, "10.0.26100");
    strict_1.default.equal(health.arch, "x64");
});
(0, node_test_1.test)("an unknown renderer reads as null, and a machine without swap as zero", async () => {
    const { summarizeProcessHealth } = await load();
    const health = summarizeProcessHealth({
        metrics: [
            metric({
                pid: 10,
                type: "Browser",
                percentCPUUsage: 1,
                workingSetKB: 1024,
            }),
        ],
        // macOS leaves the swap fields out entirely.
        memory: { total: 16777216, free: 4194304 },
        rendererPid: 999,
        osRelease: "24.3.0",
        osVersion: "15.3.1",
        arch: "arm64",
        cpus: [],
    });
    strict_1.default.equal(health.rendererCpuPercent, null);
    strict_1.default.equal(health.rendererMemoryMB, null);
    strict_1.default.equal(health.swapUsedMB, 0);
    strict_1.default.equal(health.cpuCount, 0);
    strict_1.default.equal(health.cpuModel, "");
    strict_1.default.equal(health.processes[0].memoryMB, 1, "working set stands in");
});
//# sourceMappingURL=process-health.test.js.map
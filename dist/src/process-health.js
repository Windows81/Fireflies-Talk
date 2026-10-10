"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeProcessHealth = summarizeProcessHealth;
exports.primeProcessMetrics = primeProcessMetrics;
exports.getProcessHealth = getProcessHealth;
const os = __importStar(require("os"));
const electron_1 = require("electron");
/**
 * CPU, memory and OS build around a recording, read on every heartbeat beside
 * the audio clock ratio. A render loop that falls behind real time on a
 * starved laptop looks exactly like one slowed by a coarse timer; these
 * numbers are what tell the two apart.
 */
const KB_PER_MB = 1024;
function toMB(kb) {
    return Math.round(kb / KB_PER_MB);
}
function round1(value) {
    return Math.round(value * 10) / 10;
}
/** "Utility:audio.mojom.AudioService" rather than a bare "Utility". */
function describeProcess(metric) {
    const service = metric.serviceName ?? metric.name;
    return service ? `${metric.type}:${service}` : metric.type;
}
function summarizeProcessHealth(input) {
    const processes = input.metrics.map((metric) => ({
        type: describeProcess(metric),
        pid: metric.pid,
        cpuPercent: round1(metric.cpu.percentCPUUsage),
        // Private bytes are reported on Windows only; the working set stands in.
        memoryMB: toMB(metric.memory.privateBytes ?? metric.memory.workingSetSize),
    }));
    const renderer = processes.find((p) => p.pid === input.rendererPid);
    // macOS reports no swap fields at all.
    const swapUsedKB = (input.memory.swapTotal || 0) - (input.memory.swapFree || 0);
    return {
        osRelease: input.osRelease,
        osVersion: input.osVersion,
        arch: input.arch,
        cpuCount: input.cpus.length,
        cpuModel: input.cpus[0]?.model ?? "",
        memoryTotalMB: toMB(input.memory.total),
        memoryAvailableMB: toMB(input.memory.free),
        swapUsedMB: toMB(Math.max(0, swapUsedKB)),
        appCpuPercent: round1(processes.reduce((sum, p) => sum + p.cpuPercent, 0)),
        appMemoryMB: processes.reduce((sum, p) => sum + p.memoryMB, 0),
        processCount: processes.length,
        rendererCpuPercent: renderer?.cpuPercent ?? null,
        rendererMemoryMB: renderer?.memoryMB ?? null,
        processes,
    };
}
/**
 * percentCPUUsage covers the time since the previous getAppMetrics() call and
 * the first call reads 0, so read once at startup: the first heartbeat then
 * measures from launch and each later one measures its own interval.
 */
function primeProcessMetrics() {
    electron_1.app.getAppMetrics();
}
function getProcessHealth(rendererPid) {
    return summarizeProcessHealth({
        metrics: electron_1.app.getAppMetrics(),
        memory: process.getSystemMemoryInfo(),
        rendererPid,
        osRelease: os.release(),
        osVersion: process.getSystemVersion(),
        arch: process.arch,
        cpus: os.cpus(),
    });
}
//# sourceMappingURL=process-health.js.map
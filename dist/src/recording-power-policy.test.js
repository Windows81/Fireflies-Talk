"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = require("node:test");
const node_url_1 = require("node:url");
// A file URL matches the resolved specifier on every platform (a Windows
// path would not).
const systemNativeModule = (0, node_url_1.pathToFileURL)(node_path_1.default.resolve(process.cwd(), "src", "system-native-windows.ts")).href;
const RENDERER_PID = 200;
const AUDIO_SERVICE_PID = 300;
/** Every addon call the policy made, as "pid:mode". */
const calls = [];
node_test_1.mock.module("electron", {
    namedExports: {
        app: {
            getAppMetrics: () => [
                {
                    type: "Utility",
                    serviceName: "audio.mojom.AudioService",
                    pid: AUDIO_SERVICE_PID,
                },
            ],
        },
    },
});
node_test_1.mock.module("electron-log", {
    defaultExport: { info() { }, warn() { }, error() { }, debug() { } },
});
node_test_1.mock.module(systemNativeModule, {
    namedExports: {
        getWindowsSystemNative: () => ({
            setProcessPowerThrottling: (pid, mode) => {
                calls.push(`${pid}:${mode}`);
                return {
                    executionSpeed: mode === "default" ? "system" : "unthrottled",
                    timerResolutionHonored: mode !== "default",
                };
            },
        }),
    },
});
const load = () => import("./recording-power-policy.js");
const renderer = {
    getOSProcessId: () => RENDERER_PID,
};
(0, node_test_1.test)("handing back resets main and renderer but leaves the audio service as Chromium set it", async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, "platform", { value: "win32" });
    try {
        const { setRecordingPowerPolicy } = await load();
        setRecordingPowerPolicy(renderer, "unthrottled");
        const released = setRecordingPowerPolicy(renderer, "default");
        strict_1.default.deepEqual(calls, [
            `${process.pid}:unthrottled`,
            `${RENDERER_PID}:unthrottled`,
            `${AUDIO_SERVICE_PID}:unthrottled`,
            `${process.pid}:default`,
            `${RENDERER_PID}:default`,
            `${AUDIO_SERVICE_PID}:query`,
        ]);
        strict_1.default.deepEqual(released, {
            main: "system",
            renderer: "system",
            audioService: "unthrottled",
        });
    }
    finally {
        Object.defineProperty(process, "platform", { value: originalPlatform });
    }
});
//# sourceMappingURL=recording-power-policy.test.js.map
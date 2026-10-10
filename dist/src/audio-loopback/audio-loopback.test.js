"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const ipcHandlers = new Map();
let displayMediaHandler = null;
let windowsRelease = "10.0.26200";
let desktopSources = [];
const commandLine = {
    getSwitchValue: () => "",
    hasSwitch: () => false,
    removeSwitch: () => { },
    appendSwitch: () => { },
};
function mockModule(specifier, exports) {
    // Node 24 uses `exports`; the repo's older @types/node still declares the
    // deprecated namedExports/defaultExport shape.
    node_test_1.mock.module(specifier, {
        exports,
    });
}
mockModule("electron", {
    app: { commandLine, isPackaged: false, on: () => { } },
    session: { defaultSession: null },
    systemPreferences: {},
    shell: {},
    desktopCapturer: {
        getSources: async () => desktopSources,
    },
    ipcMain: {
        handle: (channel, handler) => {
            ipcHandlers.set(channel, handler);
        },
        removeHandler: (channel) => {
            ipcHandlers.delete(channel);
        },
    },
});
mockModule("electron-log", {
    default: {
        info: () => { },
        warn: () => { },
        error: () => { },
    },
});
mockModule("os", {
    release: () => windowsRelease,
});
const originalPlatform = process.platform;
(0, node_test_1.after)(() => {
    Object.defineProperty(process, "platform", {
        configurable: true,
        value: originalPlatform,
    });
});
function setPlatform(platform) {
    Object.defineProperty(process, "platform", {
        configurable: true,
        value: platform,
    });
}
async function enableLoopback({ platform, release, loopbackWithMute = false, loopbackAllDevices, }) {
    setPlatform(platform);
    windowsRelease = release;
    ipcHandlers.clear();
    displayMediaHandler = null;
    const { initAudioLoopback } = await import("./audio-loopback.js");
    const sessionOverride = {
        setDisplayMediaRequestHandler: (handler) => {
            displayMediaHandler = handler;
        },
    };
    initAudioLoopback({ sessionOverride, loopbackWithMute });
    const enableHandler = ipcHandlers.get("enable-loopback-audio");
    strict_1.default.ok(enableHandler, "enable IPC handler must be registered");
    await enableHandler(undefined, { loopbackAllDevices });
    strict_1.default.ok(displayMediaHandler, "display media handler must be registered");
}
async function requestStreams(videoRequested) {
    strict_1.default.ok(displayMediaHandler);
    let grantedStreams;
    await displayMediaHandler({ videoRequested, audioRequested: true }, (streams) => {
        grantedStreams = streams;
    });
    strict_1.default.ok(grantedStreams, "display media request must invoke its callback");
    return grantedStreams;
}
(0, node_test_1.test)("audio-only capture includes every output device on Windows build 20348 and newer", async () => {
    await enableLoopback({
        platform: "win32",
        release: "10.0.20348",
        loopbackAllDevices: true,
    });
    const streams = await requestStreams(false);
    strict_1.default.deepEqual(streams.audio, {
        id: "loopbackAllDevices",
        name: "System audio (all output devices)",
    });
    strict_1.default.equal(streams.video, undefined);
});
(0, node_test_1.test)("video capture includes every output device on supported Windows", async () => {
    const screen = { id: "screen:1", name: "Screen 1" };
    desktopSources = [screen];
    await enableLoopback({
        platform: "win32",
        release: "10.0.26200",
        loopbackAllDevices: true,
    });
    const streams = await requestStreams(true);
    strict_1.default.deepEqual(streams.audio, {
        id: "loopbackAllDevices",
        name: "System audio (all output devices)",
    });
    strict_1.default.equal(streams.video, screen);
});
(0, node_test_1.test)("muted capture always keeps loopbackWithMute", async (t) => {
    const platforms = [
        { platform: "win32", release: "10.0.26200" },
        { platform: "win32", release: "10.0.20347" },
        { platform: "darwin", release: "23.2.0" },
    ];
    for (const current of platforms) {
        await t.test(`${current.platform} ${current.release}`, async () => {
            await enableLoopback({
                ...current,
                loopbackWithMute: true,
                loopbackAllDevices: true,
            });
            const streams = await requestStreams(false);
            strict_1.default.equal(streams.audio, "loopbackWithMute");
        });
    }
});
(0, node_test_1.test)("Windows builds older than 20348 keep endpoint loopback", async () => {
    await enableLoopback({ platform: "win32", release: "10.0.20347" });
    const streams = await requestStreams(false);
    strict_1.default.equal(streams.audio, "loopback");
});
(0, node_test_1.test)("Windows build 20348 defaults to endpoint loopback", async () => {
    const screen = { id: "screen:1", name: "Screen 1" };
    desktopSources = [screen];
    await enableLoopback({ platform: "win32", release: "10.0.20348" });
    const audioOnlyStreams = await requestStreams(false);
    strict_1.default.equal(audioOnlyStreams.audio, "loopback");
    const videoStreams = await requestStreams(true);
    strict_1.default.equal(videoStreams.audio, "loopback");
    strict_1.default.equal(videoStreams.video, screen);
});
(0, node_test_1.test)("all-devices loopback stays endpoint loopback on unsupported Windows", async () => {
    await enableLoopback({
        platform: "win32",
        release: "10.0.20347",
        loopbackAllDevices: true,
    });
    const streams = await requestStreams(false);
    strict_1.default.equal(streams.audio, "loopback");
});
(0, node_test_1.test)("all-devices loopback stays endpoint loopback on darwin", async () => {
    await enableLoopback({
        platform: "darwin",
        release: "23.2.0",
        loopbackAllDevices: true,
    });
    const streams = await requestStreams(false);
    strict_1.default.equal(streams.audio, "loopback");
});
(0, node_test_1.test)("loopbackWithMute takes precedence over all-devices loopback", async () => {
    await enableLoopback({
        platform: "win32",
        release: "10.0.26200",
        loopbackWithMute: true,
        loopbackAllDevices: true,
    });
    const streams = await requestStreams(false);
    strict_1.default.equal(streams.audio, "loopbackWithMute");
});
(0, node_test_1.test)("malformed Windows releases safely keep endpoint loopback", async (t) => {
    for (const release of ["", "10.0", "10.0.not-a-build", "10.0.20348beta"]) {
        await t.test(release || "empty release", async () => {
            await enableLoopback({ platform: "win32", release });
            const streams = await requestStreams(false);
            strict_1.default.equal(streams.audio, "loopback");
        });
    }
});
(0, node_test_1.test)("non-Windows platforms keep endpoint loopback", async (t) => {
    for (const platform of ["darwin", "linux"]) {
        await t.test(platform, async () => {
            await enableLoopback({ platform, release: "23.2.0" });
            const streams = await requestStreams(false);
            strict_1.default.equal(streams.audio, "loopback");
        });
    }
});
//# sourceMappingURL=audio-loopback.test.js.map
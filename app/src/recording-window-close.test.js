"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const recording_shutdown_1 = require("./recording-shutdown");
(0, node_test_1.test)("a prepared shutdown allows application-menu quit to close the window", async () => {
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => "idle",
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
    });
    await shutdown.prepare();
    const closeHandler = (0, recording_shutdown_1.createRecordingAwareWindowCloseHandler)({
        // The before-quit wiring in main.ts sets the quit flag on every quit path,
        // app menu included, so quit-time closes always see it as true.
        isAppQuitting: () => true,
        getShutdownCoordinator: () => shutdown,
        closeAfterShutdown: () => strict_1.default.fail(),
        hideWindow: () => strict_1.default.fail(),
    });
    closeHandler({
        preventDefault: () => strict_1.default.fail(),
    });
});
(0, node_test_1.test)("a prepared shutdown outside a quit still hides the window", async () => {
    const shutdown = (0, recording_shutdown_1.createRecordingShutdownCoordinator)({
        requestRecordingStop: async () => "idle",
        quit: () => { },
        cleanup: () => { },
        onError: () => { },
    });
    await shutdown.prepare();
    let hidden = false;
    const closeHandler = (0, recording_shutdown_1.createRecordingAwareWindowCloseHandler)({
        isAppQuitting: () => false,
        getShutdownCoordinator: () => shutdown,
        closeAfterShutdown: () => strict_1.default.fail(),
        hideWindow: () => {
            hidden = true;
        },
    });
    let prevented = false;
    closeHandler({
        preventDefault: () => {
            prevented = true;
        },
    });
    strict_1.default.equal(prevented, true);
    strict_1.default.equal(hidden, true);
});
//# sourceMappingURL=recording-window-close.test.js.map
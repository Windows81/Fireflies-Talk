"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setQuitReadinessCheck = setQuitReadinessCheck;
exports.onFinalQuit = onFinalQuit;
const electron_1 = require("electron");
let isReadyToQuit = () => true;
function setQuitReadinessCheck(check) {
    isReadyToQuit = check;
}
/**
 * Recording finalization prevents the first `before-quit` pass, so teardown
 * registered here runs only on the pass that is allowed to proceed.
 */
function onFinalQuit(handler) {
    electron_1.app.on("before-quit", () => {
        if (isReadyToQuit())
            handler();
    });
}
//# sourceMappingURL=quit-readiness.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.electronNetRequester = void 0;
const electron_1 = require("electron");
/**
 * Proxy-aware HTTPS probe built on Electron's `net` module (the Chromium network
 * stack), which honors system/enterprise proxy configuration and PAC scripts and
 * validates TLS — unlike Node's `net`/`https`, which bypass the OS proxy entirely
 * and would fail in the corporate/proxy environments this probe must work in.
 *
 * Resolves with the HTTP status code on any response; rejects on connection
 * error, TLS failure, timeout, or abort. The caller (isReachable) treats any
 * resolved status as reachable.
 */
const electronNetRequester = (url, timeoutMs) => new Promise((resolve, reject) => {
    const request = electron_1.net.request({ method: "GET", url });
    let settled = false;
    const settle = (fn) => {
        if (settled)
            return;
        settled = true;
        clearTimeout(timer);
        fn();
    };
    const timer = setTimeout(() => {
        settle(() => reject(new Error("reachability probe timed out")));
        request.abort();
    }, timeoutMs);
    request.on("response", (response) => {
        const statusCode = response.statusCode;
        // Drain the body so the underlying socket is released promptly.
        response.on("data", () => { });
        response.on("end", () => { });
        settle(() => resolve(statusCode));
    });
    request.on("error", (error) => settle(() => reject(error)));
    request.on("abort", () => settle(() => reject(new Error("reachability probe aborted"))));
    request.end();
});
exports.electronNetRequester = electronNetRequester;
//# sourceMappingURL=network-reachability-requester.js.map
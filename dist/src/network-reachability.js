"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReachable = exports.REACHABILITY_TIMEOUT_MS = exports.DEFAULT_TARGETS = exports.CLOUDFLARE_ANCHOR_URL = exports.DEFAULT_HEALTH_URL = void 0;
// Fireflies health endpoint. Enterprise networks whitelist *.fireflies.ai, so
// reaching it reflects whether we can actually talk to Fireflies — the signal
// that matters for resuming. Hardcoded to prod: it's a stable public anchor
// reachable from any environment (we only check connectivity, not data).
exports.DEFAULT_HEALTH_URL = "https://m.fireflies.ai/health";
// Cloudflare anycast anchor addressed by IP, so it needs no DNS. It answers
// "is any route out alive?" and guards against a network that blocks one host
// but is otherwise up. Reached over HTTPS so it traverses enterprise proxies.
exports.CLOUDFLARE_ANCHOR_URL = "https://1.1.1.1/";
// Raced together: reachable if either responds.
exports.DEFAULT_TARGETS = [exports.DEFAULT_HEALTH_URL, exports.CLOUDFLARE_ANCHOR_URL];
exports.REACHABILITY_TIMEOUT_MS = 3000;
/**
 * Resolves true as soon as ANY target returns an HTTP response, false if every
 * target fails or times out.
 *
 * Any HTTP status (2xx/3xx/4xx/5xx) counts as reachable: a response received
 * over validated TLS proves we actually reached that host (a captive portal
 * cannot forge a valid TLS response for these hosts). Only a connection error,
 * TLS failure, or timeout — surfaced as a rejected requester promise — counts
 * as a failed target.
 *
 * The probe is transport-agnostic: the caller injects `request`. In the main
 * process that is a proxy-aware Electron `net` requester; tests inject a fake.
 * Node's own net/https are unsuitable because they bypass the OS proxy.
 */
const isReachable = (opts) => {
    const { request } = opts;
    const urls = opts.urls ?? exports.DEFAULT_TARGETS;
    const timeoutMs = opts.timeoutMs ?? exports.REACHABILITY_TIMEOUT_MS;
    if (urls.length === 0)
        return Promise.resolve(false);
    return new Promise((resolve) => {
        let failures = 0;
        let settled = false;
        const settle = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        // Reachable on the first target that responds; unreachable only once every
        // target has failed.
        for (const url of urls) {
            request(url, timeoutMs).then(() => settle(true), () => {
                failures += 1;
                if (failures === urls.length)
                    settle(false);
            });
        }
    });
};
exports.isReachable = isReachable;
//# sourceMappingURL=network-reachability.js.map
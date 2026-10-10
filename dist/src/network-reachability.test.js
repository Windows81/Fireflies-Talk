"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const network_reachability_1 = require("./network-reachability");
const alwaysOk = async () => 200;
const alwaysFail = async () => {
    throw new Error("connect failed");
};
(0, node_test_1.test)("reachable when the only target responds", async () => {
    const result = await (0, network_reachability_1.isReachable)({
        urls: ["https://x/health"],
        request: alwaysOk,
    });
    strict_1.default.equal(result, true);
});
(0, node_test_1.test)("reachable when one of several targets responds, others fail", async () => {
    const request = async (url) => {
        if (url === "https://up/")
            return 200;
        throw new Error("blocked");
    };
    const result = await (0, network_reachability_1.isReachable)({
        urls: ["https://blocked/health", "https://up/"],
        request,
    });
    strict_1.default.equal(result, true);
});
(0, node_test_1.test)("a non-2xx response still counts as reachable (redirect / unhealthy)", async () => {
    const redirect = async () => 301;
    const unhealthy = async () => 503;
    strict_1.default.equal(await (0, network_reachability_1.isReachable)({ urls: ["https://x/"], request: redirect }), true);
    strict_1.default.equal(await (0, network_reachability_1.isReachable)({ urls: ["https://x/health"], request: unhealthy }), true);
});
(0, node_test_1.test)("not reachable when all targets fail", async () => {
    const result = await (0, network_reachability_1.isReachable)({
        urls: ["https://a/health", "https://b/"],
        request: alwaysFail,
    });
    strict_1.default.equal(result, false);
});
(0, node_test_1.test)("not reachable for an empty target list", async () => {
    const result = await (0, network_reachability_1.isReachable)({ urls: [], request: alwaysOk });
    strict_1.default.equal(result, false);
});
(0, node_test_1.test)("passes each provided url and the timeout to the requester", async () => {
    const seen = [];
    const request = async (url, timeoutMs) => {
        seen.push({ url, timeoutMs });
        throw new Error("no");
    };
    await (0, network_reachability_1.isReachable)({
        urls: [network_reachability_1.DEFAULT_HEALTH_URL, network_reachability_1.CLOUDFLARE_ANCHOR_URL],
        timeoutMs: 1234,
        request,
    });
    strict_1.default.deepEqual(seen.map((s) => s.url).sort(), [network_reachability_1.CLOUDFLARE_ANCHOR_URL, network_reachability_1.DEFAULT_HEALTH_URL].sort());
    strict_1.default.ok(seen.every((s) => s.timeoutMs === 1234));
});
(0, node_test_1.test)("defaults the timeout to REACHABILITY_TIMEOUT_MS when omitted", async () => {
    let seenTimeout = -1;
    const request = async (_url, timeoutMs) => {
        seenTimeout = timeoutMs;
        return 200;
    };
    await (0, network_reachability_1.isReachable)({ urls: [network_reachability_1.DEFAULT_HEALTH_URL], request });
    strict_1.default.equal(seenTimeout, network_reachability_1.REACHABILITY_TIMEOUT_MS);
});
(0, node_test_1.test)("defaults to the Fireflies health + Cloudflare anchors when urls omitted", async () => {
    const seen = [];
    const request = async (url) => {
        seen.push(url);
        throw new Error("no");
    };
    await (0, network_reachability_1.isReachable)({ request });
    strict_1.default.deepEqual(seen.sort(), [...network_reachability_1.DEFAULT_TARGETS].sort());
    strict_1.default.ok(seen.includes(network_reachability_1.DEFAULT_HEALTH_URL));
    strict_1.default.ok(seen.includes(network_reachability_1.CLOUDFLARE_ANCHOR_URL));
});
//# sourceMappingURL=network-reachability.test.js.map
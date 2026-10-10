"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProxyAuthToken = getProxyAuthToken;
exports.getProxyPort = getProxyPort;
exports.installSystemCATrust = installSystemCATrust;
exports.startCorsProxy = startCorsProxy;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const tls_1 = __importDefault(require("tls"));
const crypto_1 = require("crypto");
const constants_1 = require("./constants");
const electron_log_1 = __importDefault(require("electron-log"));
const ca_trust_1 = require("./ca-trust");
const ALLOWED_HEADERS = "content-type, authorization, x-refresh-token, x-requested-with, x-request-id, x-client-name, x-client-version, apollographql-client-name, apollographql-client-version, x-proxy-auth, x-service, ff_recorder_type, ff_recorder_version";
// Security and performance limits
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_UPLOAD_BYTES = 1000 * 1024 * 1024; // 1GB (for file uploads)
const MAX_DOWNLOAD_BYTES = 1000 * 1024 * 1024; // 1GB (for responses)
// Generate a secure random token on startup that only the Electron app knows
const PROXY_AUTH_TOKEN = (0, crypto_1.randomBytes)(32).toString("hex");
// Store the actual port the proxy is running on (may differ from requested if port is taken)
let actualProxyPort = null;
function getProxyAuthToken() {
    return PROXY_AUTH_TOKEN;
}
function getProxyPort() {
    return actualProxyPort;
}
let cachedAgent;
let systemCATrustInstalled = false;
// Once the bundle is the TLS default, an agent that also passes it as `ca`
// makes every new connection parse the whole bundle again.
let tlsDefaultsHoldBundle = false;
// Node's global agent drops a connection after 5s idle, and a new connection
// through Cloudflare often costs ~300ms more while it reopens its link to our
// origin. The ingress closes that link after 75s idle anyway, so holding ours
// for 70s keeps, for example, a dictation's format request on the connection
// its token request opened when recording started (95% of recordings are
// shorter than that; longer ones are kept warm by the dictation heartbeat).
const PROXY_AGENT_OPTIONS = {
    keepAlive: true,
    timeout: 70000,
};
function getProxyAgent() {
    if (cachedAgent)
        return cachedAgent;
    if (tlsDefaultsHoldBundle) {
        cachedAgent = new https_1.default.Agent(PROXY_AGENT_OPTIONS);
        return cachedAgent;
    }
    const bundle = (0, ca_trust_1.getMergedTrustedCAs)();
    const mergedCAs = bundle.certs;
    if (mergedCAs.length > 0) {
        // Use Node's effective defaults + explicit system/extra certs so local
        // proxy requests stay aligned with process-level CA configuration.
        cachedAgent = new https_1.default.Agent({ ca: mergedCAs, ...PROXY_AGENT_OPTIONS });
        electron_log_1.default.info(`[PROXY] Built HTTPS agent with CA bundle (default=${bundle.counts.default}, system=${bundle.counts.system}, extra=${bundle.counts.extra}, darwinKeychain=${bundle.counts.darwinKeychain}, total=${bundle.counts.total})`);
    }
    else {
        // Fallback for older runtimes where getCACertificates isn't available.
        cachedAgent = new https_1.default.Agent(PROXY_AGENT_OPTIONS);
    }
    return cachedAgent;
}
// Install the system-CA-trusting agent as the default for all outgoing
// Node TLS connections (including the ws-based realtime streaming client).
// Without this, libraries like `ws` that don't expose an agent option fail
// handshakes behind corporate SSL inspection proxies.
function installSystemCATrust() {
    if (systemCATrustInstalled)
        return;
    const bundle = (0, ca_trust_1.getMergedTrustedCAs)();
    const setDefaultCAs = tls_1.default
        .setDefaultCACertificates;
    if (typeof setDefaultCAs === "function" && bundle.certs.length > 0) {
        setDefaultCAs(bundle.certs);
        tlsDefaultsHoldBundle = true;
        cachedAgent = undefined;
        electron_log_1.default.info(`[PROXY] Installed CA bundle into TLS defaults (default=${bundle.counts.default}, system=${bundle.counts.system}, extra=${bundle.counts.extra}, darwinKeychain=${bundle.counts.darwinKeychain}, total=${bundle.counts.total})`);
        systemCATrustInstalled = true;
        return;
    }
    // Fallback for runtimes that lack tls.setDefaultCACertificates.
    https_1.default.globalAgent = getProxyAgent();
    electron_log_1.default.info("[PROXY] tls.setDefaultCACertificates unavailable, using https.globalAgent fallback");
    systemCATrustInstalled = true;
}
// chromium engine in the electron is not allowing custom origins
// engine forcing to use custom-protocol-scheme as the http origin
// in this case, desktop-ff://-/ has to be whitelisted on the backend side
// or this proxy makes requests like desktop.fireflies.ai to prevent CORS errors
async function tryStartProxy(port) {
    return new Promise((resolve, reject) => {
        const server = http_1.default.createServer((req, res) => {
            // Strict origin check as defense-in-depth (exact match only)
            const origin = req.headers.origin || req.headers.referer;
            // Extract origin without path for comparison
            let originToCheck = origin;
            if (origin) {
                try {
                    const originUrl = new URL(origin);
                    originToCheck = `${originUrl.protocol}//${originUrl.host}`;
                }
                catch {
                    // If origin is not a valid URL, use as-is for comparison
                }
            }
            const isValidOrigin = originToCheck === constants_1.APP_ORIGIN;
            if (!isValidOrigin) {
                electron_log_1.default.error(`[PROXY] Rejected request from invalid origin: ${origin} (expected: ${constants_1.APP_ORIGIN})`);
                res.writeHead(403);
                res.end("Forbidden: Invalid origin");
                return;
            }
            // Handle OPTIONS preflight BEFORE auth check (preflight doesn't include custom headers)
            if (req.method === "OPTIONS") {
                res.writeHead(200, {
                    "access-control-allow-origin": constants_1.APP_ORIGIN,
                    "access-control-allow-credentials": "true",
                    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
                    "access-control-allow-headers": ALLOWED_HEADERS,
                });
                res.end();
                return;
            }
            // Security: Verify auth token that only our Electron app knows (after OPTIONS handling)
            const authToken = req.headers["x-proxy-auth"];
            if (authToken !== PROXY_AUTH_TOKEN) {
                electron_log_1.default.error(`[PROXY] Rejected request with invalid auth token from origin: ${req.headers.origin}`);
                res.writeHead(403);
                res.end("Forbidden: Invalid authentication");
                return;
            }
            if (!req.url) {
                res.writeHead(400);
                res.end("Missing request URL");
                return;
            }
            // Extract target URL from query param: http://localhost:3033?url=https://...
            const rawTargetUrl = new URL(req.url, `http://localhost:${port}`).searchParams.get("url");
            if (!rawTargetUrl) {
                res.writeHead(400);
                res.end("Missing url parameter");
                return;
            }
            // Validate and sanitize the target URL
            let target;
            try {
                target = new URL(rawTargetUrl);
            }
            catch (error) {
                electron_log_1.default.error(`[PROXY] Invalid URL format: ${error.message}`);
                res.writeHead(400);
                res.end("Invalid URL format");
                return;
            }
            // Whitelist: only allow HTTPS requests to trusted domains
            const allowedDomains = [
                ".fireflies.ai",
                ".fireflies.dev",
                ".firefliesapp.com",
                "api.segment.io",
                "cdn.segment.com",
            ];
            const isAllowedDomain = allowedDomains.some((domain) => target.hostname.endsWith(domain) || target.hostname === domain);
            if (!isAllowedDomain) {
                electron_log_1.default.error(`[PROXY] Rejected request to untrusted domain: ${target.hostname}`);
                res.writeHead(403);
                res.end("Forbidden: Untrusted domain");
                return;
            }
            if (target.protocol !== "https:") {
                electron_log_1.default.error(`[PROXY] Rejected request with non-HTTPS protocol: ${target.protocol}`);
                res.writeHead(403);
                res.end("Forbidden: Only HTTPS is allowed");
                return;
            }
            // Track upload size to prevent memory exhaustion
            let uploadBytes = 0;
            let uploadAborted = false;
            // Track download size
            let downloadBytes = 0;
            let downloadAborted = false;
            let responseWritten = false;
            // Forward request with WEB_ORIGIN as origin
            // Filter out x-proxy-auth header before forwarding
            const forwardHeaders = {};
            for (const [key, value] of Object.entries(req.headers)) {
                if (key.toLowerCase() !== "x-proxy-auth") {
                    forwardHeaders[key] = value;
                }
            }
            const proxyReq = https_1.default.request({
                hostname: target.hostname,
                port: target.port || 443,
                path: target.pathname + target.search,
                method: req.method,
                agent: getProxyAgent(),
                timeout: REQUEST_TIMEOUT_MS,
                headers: {
                    ...forwardHeaders,
                    host: target.hostname,
                    origin: constants_1.WEB_ORIGIN,
                    referer: `${constants_1.WEB_ORIGIN}/`,
                },
            }, (proxyRes) => {
                if (responseWritten || uploadAborted)
                    return;
                // Set CORS headers for our Electron app
                res.writeHead(proxyRes.statusCode, {
                    ...proxyRes.headers,
                    "access-control-allow-origin": constants_1.APP_ORIGIN,
                    "access-control-allow-credentials": "true",
                    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
                    "access-control-allow-headers": ALLOWED_HEADERS,
                });
                responseWritten = true;
                // Track download size to prevent memory exhaustion
                proxyRes.on("data", (chunk) => {
                    downloadBytes += chunk.length;
                    if (downloadBytes > MAX_DOWNLOAD_BYTES && !downloadAborted) {
                        downloadAborted = true;
                        electron_log_1.default.error(`[PROXY] Download size exceeded ${MAX_DOWNLOAD_BYTES} bytes`);
                        proxyRes.destroy();
                        req.destroy();
                        if (!res.writableEnded) {
                            res.end();
                        }
                    }
                });
                proxyRes.pipe(res);
            });
            // Handle request timeout
            proxyReq.on("timeout", () => {
                electron_log_1.default.error(`[PROXY] Request timeout after ${REQUEST_TIMEOUT_MS}ms`);
                proxyReq.destroy();
                if (!responseWritten && !res.writableEnded) {
                    res.writeHead(504);
                    res.end("Gateway Timeout");
                    responseWritten = true;
                }
            });
            // Handle proxy request errors
            proxyReq.on("error", (err) => {
                electron_log_1.default.error(`[PROXY] Proxy request error: ${err.message}`);
                if (!responseWritten && !res.writableEnded) {
                    res.writeHead(502);
                    res.end(`Bad Gateway: ${err.message}`);
                    responseWritten = true;
                }
            });
            // Track upload size and forward request body
            req.on("data", (chunk) => {
                uploadBytes += chunk.length;
                if (uploadBytes > MAX_UPLOAD_BYTES && !uploadAborted) {
                    uploadAborted = true;
                    electron_log_1.default.error(`[PROXY] Upload size exceeded ${MAX_UPLOAD_BYTES} bytes`);
                    req.destroy();
                    proxyReq.destroy();
                    if (!responseWritten && !res.writableEnded) {
                        res.writeHead(413);
                        res.end("Payload Too Large");
                        responseWritten = true;
                    }
                }
            });
            req.pipe(proxyReq);
        });
        server.listen(port, "127.0.0.1", () => {
            actualProxyPort = port;
            electron_log_1.default.info(`[PROXY] CORS proxy listening on http://localhost:${port}`);
            resolve(server);
        });
        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                reject(new Error(`Port ${port} is already in use by another application`));
            }
            else {
                reject(err);
            }
        });
    });
}
async function startCorsProxy(preferredPort = constants_1.CORS_PROXY_PORT) {
    // Try the preferred port first, then try alternatives if it's taken
    const portsToTry = [
        preferredPort,
        preferredPort + 1,
        preferredPort + 2,
        0, // Let OS assign any available port as last resort
    ];
    let lastError = null;
    for (const port of portsToTry) {
        try {
            const server = await tryStartProxy(port);
            electron_log_1.default.info(`[PROXY] Successfully started on port ${actualProxyPort} ${port !== preferredPort ? `(preferred port ${preferredPort} was in use)` : ""}`);
            return server;
        }
        catch (error) {
            lastError = error;
            electron_log_1.default.warn(`[PROXY] Port ${port === 0 ? "auto" : port} failed: ${error.message}`);
        }
    }
    // All ports failed
    throw new Error(`Failed to start CORS proxy after trying multiple ports. Last error: ${lastError?.message}`);
}
//# sourceMappingURL=proxy.js.map
import { isDesktop } from "./device";
import { materializeRequestBody } from "./proxy-fetch-body";

/**
 * Setup global fetch override for Electron desktop app to use CORS proxy
 * Call this once at app initialization (app.tsx)
 */
export function setupProxyFetch() {
  // Skip proxy setup in dev (webSecurity is disabled) or non-desktop
  if (!isDesktop || __DEV__) {
    return;
  }

  const originalFetch = window.fetch;

  // Get the secure auth token and actual port from the Electron API
  const authToken = window.electron?.proxyAuthToken;
  const proxyPort = window.electron?.proxyPort;

  if (!authToken) {
    console.error("[PROXY-FETCH] No auth token available, proxy will not work");
    return;
  }

  if (!proxyPort) {
    console.error(
      "[PROXY-FETCH] Proxy port not available, proxy may not have started",
    );
    return;
  }

  const PROXY_URL = `http://localhost:${proxyPort}`;
  console.log(`[PROXY-FETCH] Using CORS proxy at ${PROXY_URL}`);

  function isAllowedProxyHost(hostname: string): boolean {
    const host = hostname.toLowerCase();

    const isFirefliesAi =
      host === "fireflies.ai" || host.endsWith(".fireflies.ai");
    const isFirefliesDev =
      host === "fireflies.dev" || host.endsWith(".fireflies.dev");
    const isFirefliesApp =
      host === "firefliesapp.com" || host.endsWith(".firefliesapp.com");

    const isSegmentApi = host === "api.segment.io";
    const isSegmentCdn = host === "cdn.segment.com";

    return (
      isFirefliesAi ||
      isFirefliesDev ||
      isFirefliesApp ||
      isSegmentApi ||
      isSegmentCdn
    );
  }

  window.fetch = function (
    request: string | URL | Request,
    requestInit?: RequestInit,
  ): Promise<Response> {
    // Handle Request objects - extract URL but preserve the Request for pass-through
    let targetUrl: string;
    let originalRequest: Request | undefined;

    if (request instanceof Request) {
      targetUrl = request.url;
      originalRequest = request;
    } else {
      targetUrl = typeof request === "string" ? request : request.toString();
    }

    const mergedHeaders = new Headers(originalRequest?.headers || {});
    if (requestInit?.headers) {
      new Headers(requestInit.headers).forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    }
    const acceptHeader = mergedHeaders.get("accept") || "";
    const isEventStream = acceptHeader
      .toLowerCase()
      .includes("text/event-stream");

    let shouldProxy = false;
    if (!isEventStream) {
      try {
        const urlObj = new URL(targetUrl);
        if (
          urlObj.protocol === "https:" &&
          isAllowedProxyHost(urlObj.hostname)
        ) {
          shouldProxy = true;
        }
      } catch {
        // If the URL is invalid, fall through and do a normal fetch
      }
    }

    // Only proxy external HTTPS requests to fireflies and segment domains
    if (shouldProxy) {
      const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
      const headers = new Headers(mergedHeaders);
      headers.set("x-proxy-auth", authToken);
      const method = requestInit?.method ?? originalRequest?.method ?? "GET";

      return (async () => {
        const body = await materializeRequestBody(
          originalRequest,
          requestInit,
          method,
        );

        const init: RequestInit = {
          ...requestInit,
          method,
          headers,
        };
        if (body != null) {
          init.body = body;
        }

        return originalFetch(proxyUrl, init);
      })();
    }

    // Pass through all other requests
    return originalFetch(request, requestInit);
  };
}

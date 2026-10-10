"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingTokenBroker = void 0;
/**
 * Asks the renderer for a fresh access token over the preload bridge, since the
 * main process has no refresh token of its own.
 */
class StreamingTokenBroker {
    constructor(request, isTargetAlive) {
        this.request = request;
        this.isTargetAlive = isTargetAlive;
        this.pending = new Map();
        this.counter = 0;
    }
    requestToken() {
        if (!this.isTargetAlive()) {
            return Promise.reject(new Error("renderer unavailable for token request"));
        }
        const requestId = `token-${++this.counter}`;
        return new Promise((resolve, reject) => {
            this.pending.set(requestId, { resolve, reject });
            this.request(requestId);
        });
    }
    /** Unknown ids belong to a request that was already settled and are ignored. */
    resolveResponse(response) {
        const pending = this.pending.get(response.requestId);
        if (!pending)
            return;
        this.pending.delete(response.requestId);
        if (response.error) {
            pending.reject(new Error(response.error));
            return;
        }
        if (!response.token) {
            pending.reject(new Error("renderer returned no access token"));
            return;
        }
        pending.resolve(response.token);
    }
    rejectAll(reason) {
        for (const [, pending] of this.pending) {
            pending.reject(new Error(reason));
        }
        this.pending.clear();
    }
}
exports.StreamingTokenBroker = StreamingTokenBroker;
//# sourceMappingURL=streaming-token-broker.js.map
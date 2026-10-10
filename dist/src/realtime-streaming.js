"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeStreamingManager = void 0;
const realtime_ff_streaming_client_1 = require("@firefliesai/realtime-ff-streaming-client");
const logger_1 = require("./logger");
const cloud_log_buffer_1 = require("./cloud-log-buffer");
const streaming_token_broker_1 = require("./streaming-token-broker");
/** Stable code the streaming client attaches to a terminal auth rejection. */
const STREAMING_AUTH_FAILED = "STREAMING_AUTH_FAILED";
/** Streaming client codes that mean streaming is over for this session. */
const TERMINAL_ERROR_CODES = new Set([
    STREAMING_AUTH_FAILED,
    "STREAMING_RECONNECT_EXHAUSTED",
]);
class RealtimeStreamingManager {
    constructor() {
        this.client = null;
        /** Incremented per start(); identifies who owns the shared client state. */
        this.sessionSequence = 0;
        this.target = null;
        this.senderId = null;
        this.activeMeetingId = null;
        this.transcriptSubscribers = new Set();
        this.tokenBroker = new streaming_token_broker_1.StreamingTokenBroker((requestId) => this.emitToRenderer("streaming:token-request", requestId), () => !!this.target && !this.target.isDestroyed());
        // Health metrics
        this.bytesSent = 0;
        this.chunksSent = 0;
        this.chunksFailed = 0;
        this.bytesDropped = 0;
        // Transcript production: the proof that streamed audio became text. A
        // sentence is re-sent as it grows, under the same parseId, so segments and
        // characters count each sentence once, at its latest length.
        this.transcriptEvents = 0;
        this.transcriptSegments = 0;
        this.committedTranscriptChars = 0;
        this.currentSegment = null;
        this.lastTranscriptAt = 0;
    }
    async start(config, sender) {
        // Claim ownership BEFORE the await, not after: a stop arriving while the
        // previous client is still disconnecting has to be able to cancel this
        // start, and a start that has claimed nothing yet cannot be cancelled —
        // it would resume afterwards and connect a stream nobody is listening to.
        const sequence = ++this.sessionSequence;
        await this.stopInternal("restart");
        if (!this.owns(sequence)) {
            logger_1.logger.info("[Streaming] Abandoning a superseded start", {
                sequence,
                current: this.sessionSequence,
            });
            return;
        }
        this.target = sender;
        this.senderId = sender.id;
        this.activeMeetingId = config.meetingId;
        this.bytesSent = 0;
        this.chunksSent = 0;
        this.chunksFailed = 0;
        this.bytesDropped = 0;
        this.resetTranscriptCounters();
        const baseUrl = this.normalizeBaseUrl(config.baseUrl);
        (0, cloud_log_buffer_1.cloudLog)("info", "Streaming", "streaming requested", {
            meetingId: config.meetingId,
        });
        this.client = new realtime_ff_streaming_client_1.RealtimeStreamingClient({
            baseUrl,
            // The renderer owns auth state, so every connect and reconnect asks it for
            // a token instead of reusing the one this session started with.
            getAccessToken: () => this.tokenBroker.requestToken(),
            meetingId: config.meetingId,
            source: config.source ?? "mobile-ff",
            intentions: config.intentions ?? ["transcription"],
            language: config.language ?? "english",
            emitTranscripts: config.emitTranscripts ?? false,
            userId: config.userId,
            platform: config.platform ?? "electron",
            reconnect: {
                enabled: true,
                maxAttempts: 50,
                initialInterval: 1000,
                maxInterval: 30000,
                backoffMultiplier: 2,
                timeout: 10000,
            },
        });
        // Every callback below closes over the manager, not over the client that
        // raised it, so a late event from a replaced client would act on whatever
        // session is current — emitting its transcripts to the live meeting, or
        // tearing the live stream down on its own completion. Each one therefore
        // proves it still owns the manager before touching anything.
        this.client.onConnectionStateChange((state) => {
            if (!this.owns(sequence))
                return;
            this.emitState(state);
        });
        this.client.onStreamStart((data) => {
            if (!this.owns(sequence))
                return;
            logger_1.logger.info("streaming connected", { data });
            (0, cloud_log_buffer_1.cloudLog)("info", "Streaming", "streaming connected", {
                meetingId: this.activeMeetingId,
            });
            this.emitState(realtime_ff_streaming_client_1.ConnectionState.CONNECTED);
            this.emitToRenderer("streaming:stream-start", data);
        });
        this.client.onStreamComplete((data) => {
            if (!this.owns(sequence))
                return;
            this.emitToRenderer("streaming:complete", data);
            void this.stopInternal("complete");
        });
        this.client.onTranscript((data) => {
            if (!this.owns(sequence))
                return;
            this.noteTranscript(data);
            this.emitToRenderer("streaming:transcript", data);
            this.notifyTranscriptSubscribers(data);
        });
        this.client.onError((error) => {
            if (!this.owns(sequence))
                return;
            const payload = this.toErrorPayload(error);
            logger_1.logger.info("streaming onError");
            (0, cloud_log_buffer_1.cloudLog)("error", "Streaming", "streaming onError", {
                meetingId: this.activeMeetingId,
                error: payload.message,
                code: payload.code,
                terminal: payload.terminal,
            });
            this.emitToRenderer("streaming:error", payload);
            // Terminal means the client is done retrying (credential rejected, or
            // reconnects exhausted), so tear down instead of holding a dead session.
            if (payload.terminal) {
                void this.stopInternal("manual");
            }
        });
        this.client.onReconnect((attempt, reason) => {
            if (!this.owns(sequence))
                return;
            logger_1.logger.info("streaming onReconnect");
            (0, cloud_log_buffer_1.cloudLog)("info", "Streaming", "streaming onReconnect", {
                meetingId: this.activeMeetingId,
                attempt,
                reason,
            });
            this.emitToRenderer("streaming:reconnect", { attempt, reason });
        });
        this.emitState(realtime_ff_streaming_client_1.ConnectionState.CONNECTING);
        try {
            await this.client.connect();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            // Any HTTP 4xx upgrade failure (bad token, auth, validation) is TERMINAL —
            // the client flags it (upgradeFailedWithClientError) and suppresses retries
            // for ALL 4xx, so we tear down and surface the failure.
            //
            // This classification MUST match the client's: it keys off any 4xx, not
            // just auth statuses. Narrowing this to 401/403 would desync the two — on a
            // 400/404/429 the client would refuse to reconnect while we kept it alive
            // in RECONNECTING, stranding the session forever with no attempts firing.
            //
            // Any other connect-phase error (DNS ENOTFOUND, ECONNREFUSED, connection
            // timeout, code 1006) is TRANSIENT. The client schedules an auto-reconnect
            // off the socket close that follows the failed attempt, so we must NOT call
            // stopInternal() here — that runs client.disconnect(), which sets
            // isManualDisconnect and cancels the pending reconnect, killing streaming
            // for the rest of the session over a momentary blip. Instead, keep the
            // client alive and let it reconnect; surface RECONNECTING, not a hard
            // failure.
            const isTerminalClientError = /Unexpected server response: 4\d{2}/.test(message);
            if (isTerminalClientError) {
                logger_1.logger.error("connection failed with terminal client error (4xx)", {
                    error: message,
                });
                await this.stopInternal("manual");
                // Tag the rejection so the renderer can tell the user to sign in again
                // rather than blame their connection.
                if (error instanceof Error &&
                    /Unexpected server response: 40[13]/.test(message)) {
                    error.code = STREAMING_AUTH_FAILED;
                }
                throw error;
            }
            logger_1.logger.warn("initial connect failed; auto-reconnect will continue", {
                error: message,
            });
            (0, cloud_log_buffer_1.cloudLog)("warn", "Streaming", "initial connect failed; reconnecting", {
                meetingId: this.activeMeetingId,
                error: message,
            });
            this.emitState(realtime_ff_streaming_client_1.ConnectionState.RECONNECTING);
        }
    }
    sendChunk(chunk, sender) {
        if (!this.client || !this.isFromActiveSender(sender))
            return;
        try {
            const payload = Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk instanceof ArrayBuffer ? chunk : chunk.buffer, chunk instanceof ArrayBuffer ? 0 : chunk.byteOffset, chunk instanceof ArrayBuffer ? undefined : chunk.byteLength);
            this.client.sendAudioData(payload);
            this.bytesSent += payload.length;
            this.chunksSent += 1;
        }
        catch (error) {
            this.chunksFailed += 1;
            this.bytesDropped += Buffer.isBuffer(chunk)
                ? chunk.length
                : chunk instanceof ArrayBuffer
                    ? chunk.byteLength
                    : chunk.byteLength;
            logger_1.logger.error("[Streaming] Failed to send chunk:", error);
            (0, cloud_log_buffer_1.cloudLog)("error", "Streaming", "streaming chunk failed", {
                meetingId: this.activeMeetingId,
                error: error instanceof Error ? error.message : String(error),
            });
            this.emitToRenderer("streaming:error", {
                message: "Failed to send audio chunk",
                terminal: false,
            });
        }
    }
    sendMicActivity(micActivity, sender) {
        if (!this.client || !this.isFromActiveSender(sender))
            return;
        try {
            this.client.sendMicActivity(micActivity);
        }
        catch (error) {
            logger_1.logger.error("[Streaming] Failed to send mic activity:", error);
        }
    }
    sendEnd(sender) {
        if (!this.client || !this.isFromActiveSender(sender))
            return;
        logger_1.logger.info("streaming end-sending chunk");
        (0, cloud_log_buffer_1.cloudLog)("info", "Streaming", "streaming end-sending chunk", {
            meetingId: this.activeMeetingId,
        });
        try {
            this.client.sendMediaStreamEnd();
        }
        catch (error) {
            logger_1.logger.error("[Streaming] Failed to send media end:", error);
        }
    }
    /** True while `sequence` is still the session that owns the shared client. */
    owns(sequence) {
        return sequence === this.sessionSequence;
    }
    async stop(sender) {
        logger_1.logger.info("streaming stop requested");
        if (sender && !this.isFromActiveSender(sender))
            return;
        // An explicit stop supersedes a start that is still waiting on the
        // previous client's disconnect, so that start abandons itself instead of
        // connecting after the user asked to stop.
        this.sessionSequence++;
        (0, cloud_log_buffer_1.cloudLog)("info", "Streaming", "streaming stop", {
            meetingId: this.activeMeetingId,
        });
        await this.stopInternal("manual");
    }
    onTranscript(callback) {
        this.transcriptSubscribers.add(callback);
        return () => {
            this.transcriptSubscribers.delete(callback);
        };
    }
    getActiveMeetingId() {
        return this.activeMeetingId;
    }
    getActiveSenderId() {
        return this.senderId;
    }
    getHealth() {
        if (!this.client)
            return null;
        return {
            wsState: this.client.getConnectionState(),
            wsBytesSent: this.bytesSent,
            wsChunksSent: this.chunksSent,
            wsChunksFailed: this.chunksFailed,
            wsBytesDropped: this.bytesDropped,
            wsReconnectAttempts: this.client.getReconnectAttempts(),
            transcriptEvents: this.transcriptEvents,
            transcriptSegments: this.transcriptSegments,
            transcriptChars: this.committedTranscriptChars + (this.currentSegment?.chars ?? 0),
            transcriptAgeMs: this.lastTranscriptAt > 0 ? Date.now() - this.lastTranscriptAt : null,
        };
    }
    noteTranscript(data) {
        this.transcriptEvents++;
        this.lastTranscriptAt = Date.now();
        const chars = data.sentence?.length ?? 0;
        if (this.currentSegment?.parseId === data.parseId) {
            this.currentSegment.chars = chars;
            return;
        }
        if (this.currentSegment) {
            this.committedTranscriptChars += this.currentSegment.chars;
        }
        this.transcriptSegments++;
        this.currentSegment = { parseId: data.parseId, chars };
    }
    resetTranscriptCounters() {
        this.transcriptEvents = 0;
        this.transcriptSegments = 0;
        this.committedTranscriptChars = 0;
        this.currentSegment = null;
        this.lastTranscriptAt = 0;
    }
    /** Only the renderer that owns the session may answer a token request. */
    handleTokenResponse(response, sender) {
        if (!this.isFromActiveSender(sender))
            return;
        this.tokenBroker.resolveResponse(response);
    }
    toErrorPayload(error) {
        const code = error.code;
        return {
            message: error?.message ?? String(error),
            ...(code ? { code } : {}),
            terminal: !!code && TERMINAL_ERROR_CODES.has(code),
        };
    }
    async stopInternal(reason) {
        // The state below is shared by every session this process serves, and
        // disconnect() is awaited — long enough for the renderer to stop one
        // recording and start the next. Whoever installed the current client owns
        // the right to clear it; a stop that lost that ownership while it was
        // disconnecting would otherwise null out the live session's client, and
        // sendChunk() would silently drop every chunk from then on.
        const sequence = this.sessionSequence;
        this.tokenBroker.rejectAll("streaming stopped");
        if (this.client) {
            try {
                await this.client.disconnect();
            }
            catch (error) {
                logger_1.logger.warn("[Streaming] Disconnect error:", error);
            }
        }
        if (!this.owns(sequence)) {
            logger_1.logger.info("[Streaming] Skipping teardown for a superseded session", {
                sequence,
                current: this.sessionSequence,
            });
            return;
        }
        if (reason !== "complete") {
            this.emitState(realtime_ff_streaming_client_1.ConnectionState.DISCONNECTED);
        }
        this.client = null;
        this.target = null;
        this.senderId = null;
        this.activeMeetingId = null;
    }
    emitState(state) {
        logger_1.logger.info("streaming state", { state });
        (0, cloud_log_buffer_1.cloudLog)("info", "Streaming", "streaming state", {
            meetingId: this.activeMeetingId,
            state,
        });
        this.emitToRenderer("streaming:state", state);
    }
    emitToRenderer(channel, payload) {
        if (!this.target || this.target.isDestroyed())
            return;
        try {
            this.target.send(channel, payload);
        }
        catch (error) {
            logger_1.logger.error(`[Streaming] Failed to emit ${channel}:`, error);
        }
    }
    notifyTranscriptSubscribers(data) {
        for (const subscriber of this.transcriptSubscribers) {
            try {
                subscriber(data);
            }
            catch (error) {
                logger_1.logger.warn("[Streaming] transcript subscriber failed", { error });
            }
        }
    }
    isFromActiveSender(sender) {
        return !!this.senderId && sender.id === this.senderId;
    }
    normalizeBaseUrl(url) {
        try {
            const parsed = new URL(url);
            // Remove trailing /ingest if provided to avoid double path
            parsed.pathname = parsed.pathname.replace(/\/ingest\/?$/, "") || "";
            return parsed.toString();
        }
        catch {
            // Fallback to raw URL
            return url.replace(/\\/g, "");
        }
    }
}
exports.RealtimeStreamingManager = RealtimeStreamingManager;
//# sourceMappingURL=realtime-streaming.js.map
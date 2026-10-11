"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startIgnoreMouseEventsByAlpha = startIgnoreMouseEventsByAlpha;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
// One sampler per window: re-entering an overlay replaces the previous one
// rather than stacking another interval and listener onto the same window.
const stopByWindow = new WeakMap();
function startIgnoreMouseEventsByAlpha(win, contentWebContents, intervalMs = 250, focusOnInteract = true, isPaused) {
    const noopHandle = {
        restoreClickThrough: () => undefined,
    };
    try {
        stopByWindow.get(win)?.();
        let inProgress = false;
        // Set by stop(): a capture already in flight may resolve after the next
        // sampler has taken over, and its stale result must not write state.
        let stopped = false;
        // Moves landing mid-capture coalesce into a single re-sample at the end.
        let pending;
        // The first sample always applies; after that only a change in the
        // click-through state does — per-pixel alpha deltas must not re-fire
        // setIgnoreMouseEvents (or win.focus) on every move.
        let sampled = false;
        let clickThrough = !focusOnInteract;
        // Overlays that must not steal focus start click-through. Live starts
        // capturing so the first click on opaque chrome is not dropped.
        if (!focusOnInteract) {
            win.setIgnoreMouseEvents(true, { forward: true });
        }
        const captureContents = contentWebContents || win.webContents;
        const restoreClickThrough = () => {
            sampled = false;
            if (clickThrough)
                return;
            clickThrough = true;
            if (win.isDestroyed())
                return;
            win.setIgnoreMouseEvents(true, { forward: true });
        };
        const updateIgnoreMouseEvents = async (x, y) => {
            if (inProgress) {
                pending = { x, y };
                return;
            }
            inProgress = true;
            try {
                if (isPaused?.())
                    return;
                if (!win.isVisible() || win.isDestroyed())
                    return;
                const image = await captureContents.capturePage({
                    x,
                    y,
                    width: 1,
                    height: 1,
                });
                if (stopped || isPaused?.())
                    return;
                const buffer = image.toBitmap();
                const nextClickThrough = buffer?.[3] === 0;
                if (sampled && nextClickThrough === clickThrough)
                    return;
                sampled = true;
                clickThrough = nextClickThrough;
                if (clickThrough) {
                    win.setIgnoreMouseEvents(true, { forward: true });
                    return;
                }
                if (focusOnInteract)
                    win.focus();
                win.setIgnoreMouseEvents(false, { forward: false });
            }
            catch (error) {
                if (stopped || win.isDestroyed())
                    return;
                electron_log_1.default.warn("[MOUSE] capturePage failed:", error);
                // Live: stay interactive so chrome is not dead. Overlays: stay
                // click-through so a failed capture cannot eat the cursor.
                if (focusOnInteract) {
                    sampled = false;
                    clickThrough = false;
                    win.setIgnoreMouseEvents(false, { forward: true });
                }
                else {
                    restoreClickThrough();
                }
            }
            finally {
                inProgress = false;
                const queued = pending;
                pending = undefined;
                if (queued && !stopped)
                    void updateIgnoreMouseEvents(queued.x, queued.y);
            }
        };
        const onInputEvent = (_event, input) => {
            // Only input that places a cursor — the mouse events — carries x/y.
            const point = input;
            if (typeof point.x !== "number" || typeof point.y !== "number")
                return;
            if (isPaused?.())
                return;
            void updateIgnoreMouseEvents(point.x, point.y);
        };
        const pointInterval = setInterval(() => {
            try {
                if (isPaused?.()) {
                    sampled = false;
                    clickThrough = false;
                    return;
                }
                if (win.isDestroyed())
                    return;
                const point = electron_1.screen.getCursorScreenPoint();
                const [x, y] = win.getPosition();
                const [w, h] = win.getSize();
                if (point.x > x && point.x < x + w && point.y > y && point.y < y + h) {
                    void updateIgnoreMouseEvents(point.x - x, point.y - y);
                    return;
                }
                if (!focusOnInteract)
                    restoreClickThrough();
            }
            catch (error) {
                electron_log_1.default.warn("[MOUSE] interval failed:", error);
            }
        }, intervalMs);
        // Only the bounds-exit fallback now; it must not keep the process (or a
        // test) alive on its own.
        pointInterval.unref();
        const stop = () => {
            stopped = true;
            clearInterval(pointInterval);
            captureContents.removeListener("input-event", onInputEvent);
            win.removeListener("closed", cleanup);
            win.removeListener("close", cleanup);
            // Delete the registry entry only while it still names this sampler —
            // an older stop running late must not unregister its replacement.
            if (stopByWindow.get(win) === stop)
                stopByWindow.delete(win);
            pending = undefined;
            inProgress = false;
            sampled = false;
        };
        const cleanup = () => {
            try {
                stop();
                // Ensure window regains interactivity on teardown
                if (!win.isDestroyed())
                    win.setIgnoreMouseEvents(false, { forward: true });
            }
            catch (error) {
                electron_log_1.default.warn("[MOUSE] cleanup failed:", error);
            }
        };
        captureContents.on("input-event", onInputEvent);
        win.on("closed", cleanup);
        win.on("close", cleanup);
        stopByWindow.set(win, stop);
        return { restoreClickThrough };
    }
    catch (error) {
        electron_log_1.default.error("[MOUSE] Failed to initialize alpha-based ignoreMouseEvents:", error);
        return noopHandle;
    }
}
//# sourceMappingURL=mouse.js.map
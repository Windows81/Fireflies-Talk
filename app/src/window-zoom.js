"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_ZOOM = exports.MIN_ZOOM = void 0;
exports.attachZoomControl = attachZoomControl;
exports.MIN_ZOOM = 0.8;
exports.MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;
function attachZoomControl(webContents, getBounds, onApply) {
    if (!webContents || webContents.isDestroyed())
        return;
    const applyZoom = (next) => {
        if (webContents.isDestroyed())
            return;
        const [min, max] = getBounds();
        const clamped = Math.min(Math.max(next, min), max);
        // Skip redundant writes — also avoids a feedback loop with our own handlers.
        if (Math.abs(webContents.getZoomFactor() - clamped) > 0.001) {
            webContents.setZoomFactor(clamped);
        }
        onApply?.(clamped);
        // Notify the renderer so zoom-dependent layout (e.g. the macOS traffic-light
        // clearance) can recompensate. The preload bridges this to onZoomFactorChanged.
        webContents.send("window-zoom-factor-changed", clamped);
    };
    // Ctrl/Cmd + zoom listener
    const onZoomChanged = () => applyZoom(webContents.getZoomFactor());
    // Cmd/Ctrl +/-/0 on press listener
    const onKeyDown = (event, input) => {
        if (webContents.isDestroyed())
            return;
        const isMod = process.platform === "darwin" ? input.meta : input.control;
        if (!isMod || input.type !== "keyDown")
            return;
        const current = webContents.getZoomFactor();
        if (input.key === "=" || input.key === "+") {
            event.preventDefault();
            applyZoom(current + ZOOM_STEP);
        }
        else if (input.key === "-") {
            event.preventDefault();
            applyZoom(current - ZOOM_STEP);
        }
        else if (input.key === "0") {
            event.preventDefault();
            applyZoom(1.0);
        }
    };
    // Heal persisted / out-of-range zoom after each navigation or reload.
    const onLoad = () => applyZoom(webContents.getZoomFactor());
    webContents.on("zoom-changed", onZoomChanged);
    webContents.on("before-input-event", onKeyDown);
    webContents.on("did-finish-load", onLoad);
    // Clamp immediately in case the page is already loaded when we attach.
    applyZoom(webContents.getZoomFactor());
    return () => {
        if (webContents.isDestroyed())
            return;
        webContents.off("zoom-changed", onZoomChanged);
        webContents.off("before-input-event", onKeyDown);
        webContents.off("did-finish-load", onLoad);
    };
}
//# sourceMappingURL=window-zoom.js.map
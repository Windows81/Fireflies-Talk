"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.abortDetachedActionRunsInRenderer = abortDetachedActionRunsInRenderer;
exports.setupDictationActionOrbIpc = setupDictationActionOrbIpc;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const windowing_1 = require("../windowing");
const dictation_action_orb_window_1 = require("./dictation-action-orb-window");
const dictation_action_orb_paste_policy_1 = require("./dictation-action-orb-paste-policy");
/**
 * The channels the detached-action overlay speaks over.
 *
 * Kept apart from the dictation session's own channels: these belong to runs
 * that have left the pill, and piling them into the session handler made one
 * broad function out of two unrelated jobs.
 */
/** Model output decides these, so anything but the web and mail is refused. */
const SAFE_LINK_SCHEMES = ["http:", "https:", "mailto:"];
const MAX_PUBLISHED_RUNS = 32;
const MAX_LINK_CHARS = 2048;
const RUN_ID = /^run-\d{1,10}$/;
function fromOwner(event) {
    return (0, windowing_1.isDictationRendererSender)(event.sender);
}
function fromOrb(event) {
    return (0, dictation_action_orb_window_1.isActionOrbSender)(event.sender);
}
function fromTrustedWindow(event) {
    return fromOwner(event) || fromOrb(event);
}
function parseExternalUrl(url) {
    try {
        return new URL(url);
    }
    catch {
        return null;
    }
}
/** Set at registration so the disable path can reach the owning renderer. */
let requestAbort = null;
/** Ends every detached run, for sign-out or dictation being switched off. */
function abortDetachedActionRunsInRenderer() {
    requestAbort?.();
}
function setupDictationActionOrbIpc(params) {
    requestAbort = params.abortRuns;
    // The overlay hears only future snapshots, so on load it asks for the
    // current set rather than showing nothing until a run happens to change.
    electron_1.ipcMain.on("dictation:action-runs-request", (event) => {
        if (!fromOrb(event))
            return;
        params.requestRuns();
    });
    electron_1.ipcMain.on("dictation:orb-drag-start", (event) => {
        if (!fromOrb(event))
            return;
        (0, dictation_action_orb_window_1.startDictationActionOrbDrag)();
    });
    electron_1.ipcMain.on("dictation:orb-drag-end", (event) => {
        if (!fromOrb(event))
            return;
        (0, dictation_action_orb_window_1.endDictationActionOrbDrag)();
    });
    // The app renderer owns the runs; the overlay only draws them.
    electron_1.ipcMain.on("dictation:action-runs", (event, runs) => {
        if (!fromOwner(event))
            return;
        if (!Array.isArray(runs))
            return;
        (0, dictation_action_orb_window_1.sendActionRunsToOrbs)(runs.length > MAX_PUBLISHED_RUNS ? runs.slice(-MAX_PUBLISHED_RUNS) : runs);
    });
    // And back the other way, so clearing an orb clears the run behind it.
    electron_1.ipcMain.on("dictation:action-run-dismiss", (event, id) => {
        if (!fromOrb(event))
            return;
        if (!RUN_ID.test(id))
            return;
        params.dismissRun(id);
    });
    // Driven by the owner renderer, which pastes a detached run's result as it
    // completes, and by the overlay's Paste button.
    electron_1.ipcMain.handle("dictation:orb-paste", async (event, text) => {
        const allowed = (0, dictation_action_orb_paste_policy_1.canPasteFromSender)({
            isOwner: fromOwner(event),
            isOrb: fromOrb(event),
            textLength: text.length,
        });
        if (!allowed)
            return { success: false };
        return params.paste(text);
    });
    // Reported relative to the orb window, which is the only frame its renderer
    // can position anything in.
    electron_1.ipcMain.handle("dictation:orb-spawn-point", (event) => {
        if (!fromOwner(event))
            return null;
        const pill = (0, windowing_1.getDictationPillCenter)();
        const overlay = (0, dictation_action_orb_window_1.getDictationActionOrbWindowBounds)();
        if (!pill || !overlay)
            return null;
        return { x: pill.x - overlay.x, y: pill.y - overlay.y };
    });
    // The scheme is checked here rather than trusted from the renderer that
    // asked, because the address came out of model output.
    electron_1.ipcMain.handle("dictation:open-link", async (event, url) => {
        if (!fromTrustedWindow(event))
            return false;
        if (typeof url !== "string")
            return false;
        if (url.length > MAX_LINK_CHARS)
            return false;
        if ([...url].some((ch) => ch.charCodeAt(0) < 32))
            return false;
        const parsed = parseExternalUrl(url);
        if (!parsed)
            return false;
        if (!SAFE_LINK_SCHEMES.includes(parsed.protocol)) {
            electron_log_1.default.warn(`[ActionOrbs] Refusing to open ${parsed.protocol} link`);
            return false;
        }
        await electron_1.shell.openExternal(parsed.href);
        return true;
    });
}
//# sourceMappingURL=dictation-action-orb-ipc.js.map
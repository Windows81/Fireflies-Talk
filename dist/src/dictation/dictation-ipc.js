"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDictationIpc = setupDictationIpc;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_action_orb_ipc_1 = require("./dictation-action-orb-ipc");
const dictation_dev_log_1 = require("./dictation-dev-log");
const promises_1 = require("timers/promises");
const dictation_paste_1 = require("./dictation-paste");
const dictation_paste_target_1 = require("./dictation-paste-target");
const dictation_clipboard_1 = require("./dictation-clipboard");
const dictation_clipboard_prefetch_1 = require("./dictation-clipboard-prefetch");
const dictation_clipboard_chain_1 = require("./dictation-clipboard-chain");
const dictation_paste_guard_1 = require("./dictation-paste-guard");
const dictation_shortcut_1 = require("./dictation-shortcut");
const system_media_playback_1 = require("./system-media-playback");
const dictation_screen_context_1 = require("./dictation-screen-context");
const dictation_accessibility_1 = require("./dictation-accessibility");
const windowing_1 = require("../windowing");
const dictation_accessibility_window_1 = require("./dictation-accessibility-window");
const dictation_talk_teaser_window_1 = require("./dictation-talk-teaser-window");
const dictation_feedback_window_1 = require("./dictation-feedback-window");
const dictation_email_assistant_window_1 = require("./dictation-email-assistant-window");
const dictation_slack_assistant_window_1 = require("./dictation-slack-assistant-window");
const dictation_pill_dock_1 = require("./dictation-pill-dock");
const dictation_pill_presence_1 = require("./dictation-pill-presence");
const CLIPBOARD_RESTORE_DELAY_MS = process.platform === "win32" ? 1500 : 500;
let pasteGuard = (0, dictation_paste_guard_1.createDictationPasteGuardState)();
const formatHelperTime = ({ helperUs }) => helperUs === undefined ? "" : ` (helper ${(helperUs / 1000).toFixed(1)}ms)`;
function setupDictationIpc() {
    /**
     * Two detached results can finish together, and the clipboard is one shared
     * resource: interleaving snapshot → write → keystroke → restore across two
     * pastes lets either insert the other's text, or restore over it. Each waits
     * for the last to finish.
     */
    let pasteChain = Promise.resolve();
    const chainClipboard = (0, dictation_clipboard_chain_1.createChainClipboardState)();
    const pasteCancel = { generation: 0 };
    let pendingRestore = null;
    const startChain = () => {
        if (pendingRestore)
            clearTimeout(pendingRestore.timer);
        (0, dictation_clipboard_chain_1.beginChainClipboard)(chainClipboard, pendingRestore?.restore ?? null);
        pendingRestore = null;
    };
    const finishChain = () => {
        const due = (0, dictation_clipboard_chain_1.finishChainClipboard)(chainClipboard);
        if (!due)
            return;
        pendingRestore = {
            restore: due,
            timer: setTimeout(() => {
                pendingRestore = null;
                (0, dictation_clipboard_1.restoreClipboardIfUnchanged)(due.prior, due.expected);
            }, CLIPBOARD_RESTORE_DELAY_MS),
        };
    };
    const runPaste = (text, pasteEpoch, awaitTarget = false) => {
        if (chainClipboard.inFlight === 0)
            startChain();
        chainClipboard.inFlight += 1;
        const generation = pasteCancel.generation;
        const next = pasteChain
            .then(() => {
            if (generation !== pasteCancel.generation) {
                return { success: true, skipped: true };
            }
            return pasteText(text, pasteEpoch, awaitTarget);
        })
            .finally(() => {
            chainClipboard.inFlight -= 1;
            if (chainClipboard.inFlight === 0)
                finishChain();
        });
        // The chain must not break on a rejection, and each caller still gets its
        // own result.
        pasteChain = next.catch(() => undefined);
        return next;
    };
    // Slack, Claude and Cursor take a paste with nothing focused by moving
    // focus into their composer, so a verdict of "nothing focused" at the
    // keystroke is checked again once the app has handled it.
    const settledPasteTarget = async (atKeystroke) => {
        if (!(0, dictation_paste_target_1.needsPasteTargetRecheck)(atKeystroke))
            return atKeystroke;
        await (0, promises_1.setTimeout)(dictation_paste_target_1.PASTE_TARGET_RECHECK_DELAY_MS);
        return (0, dictation_paste_target_1.settlePasteTarget)(atKeystroke, await (0, dictation_paste_1.recheckPasteTarget)());
    };
    // Stops the pending restore from putting the user's clipboard back over a
    // dictation that landed nowhere. False once the restore has already run.
    const keepDictationOnClipboard = (text) => {
        const outcome = (0, dictation_clipboard_chain_1.keepDictationForUser)(chainClipboard, pendingRestore?.restore ?? null, text, (0, dictation_clipboard_1.keptDictationSnapshot)(text));
        if (outcome === "cancel-restore" && pendingRestore) {
            clearTimeout(pendingRestore.timer);
            pendingRestore = null;
        }
        return outcome !== "too-late";
    };
    // The renderer already has its result by then, so a paste that landed
    // nowhere is reported by its epoch for the history to stop counting it.
    const recheckInBackground = (text, atKeystroke, pasteEpoch) => {
        void settledPasteTarget(atKeystroke).then((probe) => {
            if (!(0, dictation_paste_target_1.shouldFallbackToClipboard)(probe))
                return;
            windowing_1.mainWindow?.webContents.send("dictation:paste-missed", pasteEpoch);
            // Something copied since then is the user's now, not a place to point to.
            if (!(0, dictation_clipboard_1.clipboardHoldsText)(text))
                return;
            if (keepDictationOnClipboard(text))
                (0, windowing_1.sendDictationPasteFallbackToast)();
        });
    };
    const pasteText = async (text, pasteEpoch, awaitTarget) => {
        const decision = (0, dictation_paste_guard_1.decideDictationPaste)(pasteGuard, pasteEpoch);
        if (decision.action === "skip") {
            electron_log_1.default.warn(`[Dictation] Skipping ${decision.reason} paste`);
            // No paste was posted, so callers must not treat this as an outcome —
            // stacked screen copies each call paste() for the same dictation.
            return { success: true, skipped: true };
        }
        pasteGuard = decision.next;
        try {
            // The clipboard still holding the previous dictation means the chain's
            // snapshot is the user's; the one prefetched during recording is not.
            if (chainClipboard.lastPasted === null ||
                !(0, dictation_clipboard_1.clipboardHoldsText)(chainClipboard.lastPasted)) {
                chainClipboard.user = (0, dictation_clipboard_prefetch_1.takeClipboardSnapshot)();
            }
            else {
                (0, dictation_clipboard_prefetch_1.discardClipboardPrefetch)();
            }
            const clipboardStartedAt = performance.now();
            await (0, dictation_clipboard_1.writeClipboardForDictationPaste)(text);
            const clipboardMs = performance.now() - clipboardStartedAt;
            const pasteStartedAt = performance.now();
            const atKeystroke = await (0, dictation_paste_1.pasteIntoFrontmostApp)();
            const pasteKeyMs = performance.now() - pasteStartedAt;
            // The text is already in the app, so a probe that could not tell does not
            // hold the paste result back; its re-read runs afterwards and can still
            // keep the dictation on the clipboard. A confident "nothing focused" is
            // decisive for the result, so that one is awaited.
            const recheckLater = atKeystroke.verdict === "unknown" && !awaitTarget;
            const probe = recheckLater
                ? atKeystroke
                : await settledPasteTarget(atKeystroke);
            const keepForUser = (0, dictation_paste_target_1.shouldFallbackToClipboard)(probe);
            (0, dictation_dev_log_1.logDictationDev)(`[Dictation] ${keepForUser ? "Kept on clipboard" : "Pasted"} (clipboard ${clipboardMs.toFixed(1)}ms, paste-key ${pasteKeyMs.toFixed(1)}ms${formatHelperTime(atKeystroke)}, target ${atKeystroke.verdict} in ${atKeystroke.probeMs}ms${probe === atKeystroke
                ? ""
                : `, after paste ${probe.verdict} in ${probe.probeMs}ms`})`);
            chainClipboard.holdsDictation = true;
            chainClipboard.lastPasted = text;
            chainClipboard.keepForUser = keepForUser;
            // A kept dictation is now what the user owns on the clipboard, so a
            // paste queued behind it restores to it rather than over it.
            if (keepForUser)
                chainClipboard.user = (0, dictation_clipboard_1.keptDictationSnapshot)(text);
            pasteGuard = (0, dictation_paste_guard_1.finishDictationPaste)(pasteGuard, {
                ok: true,
                epoch: pasteEpoch,
            });
            if (keepForUser) {
                (0, windowing_1.sendDictationPasteFallbackToast)();
                return { success: true, copiedToClipboard: true };
            }
            if (!recheckLater)
                return { success: true };
            recheckInBackground(text, atKeystroke, pasteEpoch);
            return { success: true, targetUnconfirmed: true };
        }
        catch (error) {
            pasteGuard = (0, dictation_paste_guard_1.finishDictationPaste)(pasteGuard, {
                ok: false,
                epoch: pasteEpoch,
            });
            electron_log_1.default.error("[Dictation] Paste failed:", error);
            return {
                success: false,
                error: `Paste failed: ${error.message}. ${(0, dictation_paste_1.getManualPasteHint)()}`,
            };
        }
    };
    electron_1.ipcMain.handle("dictation:paste", async (_event, text, pasteEpoch) => runPaste(text, pasteEpoch));
    // A detached run's result is pasted from the orb overlay, which has no
    // dictation session and so no epoch of its own — one is minted here.
    // Detached runs speak over their own channels, but share this clipboard
    // queue so two pastes can never interleave. The orb shows whether its paste
    // landed, so it waits for an unclear target to be read again.
    (0, dictation_action_orb_ipc_1.setupDictationActionOrbIpc)({
        paste: (text) => runPaste(text, (0, dictation_paste_guard_1.nextDictationPasteEpoch)(), true),
        dismissRun: (id) => windowing_1.mainWindow?.webContents.send("dictation:action-run-dismiss", id),
        requestRuns: () => windowing_1.mainWindow?.webContents.send("dictation:action-runs-request"),
        abortRuns: () => {
            pasteCancel.generation += 1;
            windowing_1.mainWindow?.webContents.send("dictation:action-runs-abort");
        },
    });
    electron_1.ipcMain.on("dictation:level", (_event, level) => {
        (0, windowing_1.sendDictationLevel)(level);
    });
    electron_1.ipcMain.on("dictation:phase", (_event, phase) => {
        (0, windowing_1.sendDictationPhase)(phase);
    });
    electron_1.ipcMain.on("dictation:capture-released", () => {
        (0, system_media_playback_1.onDictationCaptureReleased)();
    });
    electron_1.ipcMain.on("dictation:state", (_event, state, mode) => {
        (0, dictation_shortcut_1.setDictationRendererState)(state, mode);
        (0, windowing_1.setDictationPillState)(state, mode);
    });
    electron_1.ipcMain.on("dictation:manual-drag-start", () => {
        (0, windowing_1.startDictationManualDrag)();
    });
    electron_1.ipcMain.on("dictation:manual-drag-end", () => {
        (0, windowing_1.endDictationManualDrag)();
    });
    electron_1.ipcMain.on("dictation:cancel-request", () => {
        (0, dictation_shortcut_1.triggerDictationCancel)();
    });
    electron_1.ipcMain.on("dictation:start-request", () => {
        (0, dictation_shortcut_1.triggerDictationStart)();
    });
    electron_1.ipcMain.on("dictation:stop-request", (_event, source) => {
        (0, dictation_shortcut_1.triggerDictationStop)(source === "auto" ? "auto" : "pill");
    });
    // The pill's notes half. Same destination as the tray item and the
    // quick-note global shortcut, so the renderer needs no new entry point.
    electron_1.ipcMain.on("dictation:start-notes-request", () => {
        (0, windowing_1.showMainWindow)();
        const win = windowing_1.mainWindow;
        if (!win || win.isDestroyed())
            return;
        if (win.webContents.isLoading()) {
            win.webContents.once("did-finish-load", () => {
                if (!win.isDestroyed()) {
                    win.webContents.send("start-recording", { source: "pill" });
                }
            });
            return;
        }
        win.webContents.send("start-recording", { source: "pill" });
    });
    electron_1.ipcMain.on("dictation:set-enabled", (_event, enabled) => {
        (0, dictation_shortcut_1.setDictationEnabled)(Boolean(enabled));
    });
    electron_1.ipcMain.on("dictation:set-pill-visible", (_event, visible) => {
        (0, dictation_shortcut_1.setDictationPillVisible)(Boolean(visible));
    });
    electron_1.ipcMain.on("dictation:set-pause-media-enabled", (_event, enabled) => {
        (0, system_media_playback_1.setPauseMediaEnabled)(Boolean(enabled));
    });
    electron_1.ipcMain.handle("dictation:get-screen-context", () => (0, dictation_screen_context_1.getScreenContext)());
    electron_1.ipcMain.handle("dictation:get-shortcut", () => (0, dictation_shortcut_1.getDictationShortcutState)());
    electron_1.ipcMain.handle("dictation:get-side", () => (0, windowing_1.getDictationPillSide)());
    electron_1.ipcMain.on("dictation:set-side", (_event, side) => {
        if ((0, dictation_pill_dock_1.isDictationPillSide)(side))
            (0, windowing_1.setDictationPillSide)(side);
    });
    // The pill can mount after a meeting started, so it pulls the flag too.
    electron_1.ipcMain.handle("dictation:get-meeting-active", () => (0, windowing_1.isLiveMeetingActive)());
    electron_1.ipcMain.handle("dictation:get-pill-minimized", () => (0, windowing_1.isDictationPillMinimized)());
    // Same for the backdrop: the sampler only pushes changes, so a reloaded
    // pill would otherwise sit dark over a light screen until the next one.
    electron_1.ipcMain.handle("dictation:get-pill-backdrop", () => (0, windowing_1.getDictationPillBackdrop)());
    // Only an explicit false un-minimizes. A renderer that has not loaded this
    // preference yet must not be read as asking for the other shape.
    electron_1.ipcMain.on("dictation:set-pill-minimized", (_event, minimized) => (0, windowing_1.setDictationPillMinimized)(minimized !== false));
    electron_1.ipcMain.on("dictation:show-live-bar", () => (0, windowing_1.showLiveBarFromPill)());
    electron_1.ipcMain.on("dictation:meeting-activity", (_event, transcribing) => (0, windowing_1.setMeetingTranscribing)(!!transcribing));
    electron_1.ipcMain.handle("dictation:set-shortcut", (_event, binding) => (0, dictation_shortcut_1.setDictationBinding)(binding));
    electron_1.ipcMain.handle("dictation:set-action-shortcut", (_event, binding) => (0, dictation_shortcut_1.setActionBinding)(binding));
    electron_1.ipcMain.handle("dictation:set-hands-free-shortcut", (_event, binding) => (0, dictation_shortcut_1.setHandsFreeBinding)(binding));
    electron_1.ipcMain.on("dictation:set-action-mode-enabled", (_event, enabled) => {
        (0, dictation_shortcut_1.setActionModeEnabled)(Boolean(enabled));
    });
    electron_1.ipcMain.on("dictation:set-polish-action-enabled", (_event, enabled) => {
        (0, dictation_shortcut_1.setPolishActionEnabled)(Boolean(enabled));
    });
    electron_1.ipcMain.handle("dictation:set-polish-shortcut", (_event, binding) => (0, dictation_shortcut_1.setPolishBinding)(binding));
    electron_1.ipcMain.on("dictation:pause-hotkey", () => {
        (0, dictation_shortcut_1.pauseDictationHotkey)();
    });
    electron_1.ipcMain.on("dictation:resume-hotkey", () => {
        (0, dictation_shortcut_1.resumeDictationHotkey)();
    });
    electron_1.ipcMain.handle("dictation:has-accessibility", () => (0, dictation_accessibility_1.hasDictationAccessibility)());
    electron_1.ipcMain.handle("dictation:open-accessibility-settings", () => {
        (0, dictation_accessibility_1.openDictationAccessibilitySettings)();
    });
    electron_1.ipcMain.on("dictation:close-accessibility-prompt", () => {
        (0, dictation_accessibility_window_1.hideDictationAccessibilityPrompt)();
    });
    electron_1.ipcMain.on("dictation:set-pill-presence", (event, presence) => {
        if (event.sender !== windowing_1.mainWindow?.webContents)
            return;
        if ((0, dictation_pill_presence_1.isDictationPillPresence)(presence))
            (0, dictation_shortcut_1.setDictationPillPresence)(presence);
    });
    electron_1.ipcMain.handle("dictation:get-teaser", () => (0, windowing_1.isDictationPillTeaserActive)());
    // Only the main window decides what the card says; only the card reads it.
    electron_1.ipcMain.on("dictation:set-teaser-content", (event, content) => {
        if (event.sender !== windowing_1.mainWindow?.webContents)
            return;
        if (content === null) {
            (0, windowing_1.setDictationTeaserContent)(null);
            return;
        }
        if ((0, dictation_pill_presence_1.isDictationTeaserContent)(content))
            (0, windowing_1.setDictationTeaserContent)(content);
    });
    electron_1.ipcMain.handle("dictation:get-teaser-content", (event) => (0, dictation_talk_teaser_window_1.isDictationTalkTeaserSender)(event.sender)
        ? (0, windowing_1.getDictationTeaserContent)()
        : null);
    // Only the card itself gets to say what the user chose on it.
    electron_1.ipcMain.on("dictation:teaser-action", (event, action) => {
        if (!(0, dictation_talk_teaser_window_1.isDictationTalkTeaserSender)(event.sender))
            return;
        if (!(0, dictation_pill_presence_1.isDictationTeaserAction)(action))
            return;
        // Try continues on the home screen, so the main window itself has to
        // come forward — not the live bar, which showMainWindow prefers.
        if (action === "try")
            (0, windowing_1.revealMainWindow)();
        (0, windowing_1.sendDictationTeaserAction)(action);
    });
    // The feedback card is the main window's to ask for; only it may raise it.
    electron_1.ipcMain.on("dictation:set-feedback-popover", (event, active) => {
        if (event.sender !== windowing_1.mainWindow?.webContents)
            return;
        (0, windowing_1.setDictationFeedbackPopoverActive)(Boolean(active));
    });
    // Only the card itself gets to report what the user did on it.
    electron_1.ipcMain.on("dictation:feedback-action", (event, action) => {
        if (!(0, dictation_feedback_window_1.isDictationFeedbackSender)(event.sender))
            return;
        if (!(0, dictation_pill_presence_1.isDictationFeedbackAction)(action))
            return;
        (0, windowing_1.sendDictationFeedbackAction)(action);
    });
    // The Email Assistant card is the main window's to ask for; only it may
    // raise it. Anything but a known mailbox takes it down.
    electron_1.ipcMain.handle("dictation:set-email-assistant-nudge", (event, provider) => {
        if (event.sender !== windowing_1.mainWindow?.webContents)
            return false;
        return (0, windowing_1.setDictationEmailAssistantNudgeActive)((0, dictation_pill_presence_1.isDictationEmailAssistantProvider)(provider) ? provider : null);
    });
    electron_1.ipcMain.handle("dictation:get-email-assistant-nudge-provider", () => (0, windowing_1.getDictationEmailAssistantNudgeProvider)());
    // Only the card itself gets to say what the user chose on it.
    electron_1.ipcMain.on("dictation:email-assistant-nudge-action", (event, action) => {
        if (!(0, dictation_email_assistant_window_1.isDictationEmailAssistantSender)(event.sender))
            return;
        if (!(0, dictation_pill_presence_1.isDictationEmailAssistantAction)(action))
            return;
        (0, windowing_1.sendDictationEmailAssistantNudgeAction)(action);
    });
    // The Slack Assistant card is the main window's to ask for; only it may
    // raise it.
    electron_1.ipcMain.handle("dictation:set-slack-assistant-nudge", (event, active) => {
        if (event.sender !== windowing_1.mainWindow?.webContents)
            return false;
        return (0, windowing_1.setDictationSlackAssistantNudgeActive)(Boolean(active));
    });
    // Only the card itself gets to say what the user chose on it.
    electron_1.ipcMain.on("dictation:slack-assistant-nudge-action", (event, action) => {
        if (!(0, dictation_slack_assistant_window_1.isDictationSlackAssistantSender)(event.sender))
            return;
        if (!(0, dictation_pill_presence_1.isDictationSlackAssistantAction)(action))
            return;
        (0, windowing_1.sendDictationSlackAssistantNudgeAction)(action);
    });
}
//# sourceMappingURL=dictation-ipc.js.map
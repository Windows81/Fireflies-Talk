"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerDictationStart = triggerDictationStart;
exports.setDictationRendererState = setDictationRendererState;
exports.recoverDictationHotkey = recoverDictationHotkey;
exports.triggerDictationStop = triggerDictationStop;
exports.triggerDictationCancel = triggerDictationCancel;
exports.setDictationPillVisible = setDictationPillVisible;
exports.setDictationPillPresence = setDictationPillPresence;
exports.setDictationEnabled = setDictationEnabled;
exports.setupDictationShortcut = setupDictationShortcut;
exports.stopDictationShortcut = stopDictationShortcut;
exports.getDictationShortcutState = getDictationShortcutState;
exports.setDictationBinding = setDictationBinding;
exports.setActionBinding = setActionBinding;
exports.setHandsFreeBinding = setHandsFreeBinding;
exports.setActionModeEnabled = setActionModeEnabled;
exports.setPolishActionEnabled = setPolishActionEnabled;
exports.setPolishBinding = setPolishBinding;
exports.pauseDictationHotkey = pauseDictationHotkey;
exports.resumeDictationHotkey = resumeDictationHotkey;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_action_orb_ipc_1 = require("./dictation-action-orb-ipc");
const dictation_action_orb_window_1 = require("./dictation-action-orb-window");
const dictation_dev_log_1 = require("./dictation-dev-log");
const dictation_clipboard_prefetch_1 = require("./dictation-clipboard-prefetch");
const dictation_paste_guard_1 = require("./dictation-paste-guard");
const dictation_session_guard_1 = require("./dictation-session-guard");
const windowing_1 = require("../windowing");
const dictation_accessibility_1 = require("./dictation-accessibility");
const dictation_accessibility_policy_1 = require("./dictation-accessibility-policy");
const dictation_binding_1 = require("./dictation-binding");
const action_binding_1 = require("./action-binding");
const hands_free_binding_1 = require("./hands-free-binding");
const polish_binding_1 = require("./polish-binding");
const dictation_shortcut_store_1 = require("./dictation-shortcut-store");
const globe_key_listener_1 = require("./globe-key-listener");
const dictation_action_session_1 = require("./dictation-action-session");
const dictation_hotkey_listeners_1 = require("./dictation-hotkey-listeners");
const shortcut_capture_session_1 = require("./shortcut-capture-session");
const dictation_paste_1 = require("./dictation-paste");
const windows_key_listener_1 = require("./windows-key-listener");
const dictation_hold_machine_1 = require("./dictation-hold-machine");
const dictation_mode_1 = require("./dictation-mode");
const macos_paste_helper_1 = require("./macos-paste-helper");
const windows_paste_helper_1 = require("./windows-paste-helper");
const dictation_shortcut_polish_1 = require("./dictation-shortcut-polish");
const dictation_speculative_capture_1 = require("./dictation-speculative-capture");
const system_media_playback_1 = require("./system-media-playback");
const stopArm = (0, dictation_paste_guard_1.createDictationStopArm)();
let holdState = (0, dictation_hold_machine_1.initialDictationHoldState)();
let doubleTapTimer = null;
let shiftHeld = false;
let emittedMode = null;
let dictationEnabled = false;
let polishGeneration = 0;
const session = (0, dictation_session_guard_1.createDictationSessionGuard)(onSessionGuardExpired);
let pillVisible = true;
/** How the main window wants the pill to present for this user (Talk teaser). */
let pillPresence = "interactive";
const LATCHED_FN_POLISH_WINDOW_MS = 100;
let pendingLatchedFnDown = null;
let pendingFnDownAt = null;
let currentBinding = (0, dictation_binding_1.defaultDictationBinding)(process.platform);
let currentActionBinding = (0, action_binding_1.defaultActionBinding)(process.platform);
let currentHandsFreeBinding = (0, hands_free_binding_1.defaultHandsFreeBinding)(process.platform);
const currentPolish = {
    binding: (0, polish_binding_1.defaultPolishBinding)(process.platform),
    /** Feature-flag gate, pushed by the main window; off until it says so. */
    enabled: false,
};
/** The polish binding the listeners should honour; null while gated off. */
function activePolishBinding() {
    return currentPolish.enabled ? currentPolish.binding : null;
}
let actionModeEnabled = true;
const speculativeCapture = (0, dictation_speculative_capture_1.createSpeculativeCapture)((channel) => sendToMain(channel));
function persistCurrentShortcuts() {
    (0, dictation_shortcut_store_1.setSavedDictationShortcuts)({
        action: currentActionBinding,
        dictation: currentBinding,
        handsFree: currentHandsFreeBinding,
        polish: currentPolish.binding,
    });
}
function restoreDictationShortcuts() {
    const saved = (0, dictation_shortcut_store_1.getSavedDictationShortcuts)(process.platform);
    if (saved) {
        currentBinding = saved.dictation;
        currentActionBinding = saved.action;
        currentHandsFreeBinding = saved.handsFree;
        currentPolish.binding = saved.polish;
    }
    // Always push: the native listener has its own polish defaults otherwise.
    if (process.platform === "darwin") {
        (0, globe_key_listener_1.setGlobePolishKeys)((0, polish_binding_1.polishMacVirtualKeys)(activePolishBinding()));
    }
}
/**
 * Fn + Shift is read during the Fn hold rather than registered as its own
 * shortcut, so it drives command mode instead of a listener.
 */
function overlayActive() {
    return (actionModeEnabled &&
        (0, action_binding_1.actionRunsAsShiftOverlay)(currentActionBinding, currentBinding));
}
/** The action binding a listener should register. Fn + Shift is not one. */
function activeActionBinding() {
    if (!actionModeEnabled)
        return null;
    if ((0, action_binding_1.actionRunsAsShiftOverlay)(currentActionBinding, currentBinding)) {
        return null;
    }
    return currentActionBinding;
}
function sendToMain(channel, ...args) {
    if (!windowing_1.mainWindow || windowing_1.mainWindow.isDestroyed())
        return;
    if (windowing_1.mainWindow.webContents.isLoading()) {
        const win = windowing_1.mainWindow;
        win.webContents.once("did-finish-load", () => {
            if (!win.isDestroyed())
                win.webContents.send(channel, ...args);
        });
    }
    else {
        windowing_1.mainWindow.webContents.send(channel, ...args);
    }
}
function sendShortcutHint() {
    (0, windowing_1.setDictationShortcutHint)((0, dictation_binding_1.getDictationShortcutSnapshot)(currentBinding, process.platform).hint);
}
function notifyDictationStart(mode, handsFree) {
    emittedMode = mode;
    stopArm.arm();
    (0, macos_paste_helper_1.snapshotMacosPasteTarget)();
    (0, windows_paste_helper_1.warmWindowsPasteTarget)();
    (0, system_media_playback_1.onDictationShortcutPressed)();
    sendToMain("dictation:start", mode, handsFree);
    // A push-to-talk hold is short enough for the clipboard to still be current
    // at the paste; a hands-free recording is read at stop instead, so no older
    // snapshot may stand in for it.
    if (handsFree)
        (0, dictation_clipboard_prefetch_1.discardClipboardPrefetch)();
    else
        (0, dictation_clipboard_prefetch_1.prefetchClipboardSnapshot)();
    registerCancelShortcut();
}
// What ended the recording, for analytics; the hotkey unless a request says otherwise.
let stopSource = "hotkey";
function notifyDictationStop() {
    const pasteEpoch = stopArm.takeEpoch();
    if (pasteEpoch == null)
        return;
    session.lock(emittedMode);
    emittedMode = null;
    (0, system_media_playback_1.onDictationShortcutReleased)();
    sendToMain("dictation:stop", pasteEpoch, stopSource);
    // Read while the transcript is on its way rather than before the paste.
    if (!(0, dictation_clipboard_prefetch_1.hasClipboardPrefetch)())
        (0, dictation_clipboard_prefetch_1.prefetchClipboardSnapshot)();
}
function notifyDictationCancel() {
    (0, dictation_clipboard_prefetch_1.discardClipboardPrefetch)();
    stopArm.disarm();
    emittedMode = null;
    session.unlock();
    (0, system_media_playback_1.onDictationShortcutReleased)();
    sendToMain("dictation:cancel");
}
function registerCancelShortcut() {
    if (electron_1.globalShortcut.isRegistered("Escape"))
        return;
    electron_1.globalShortcut.register("Escape", () => {
        (0, dictation_dev_log_1.logDictationDev)("[Dictation] Escape pressed — cancelling recording");
        triggerDictationCancel();
    });
}
function unregisterCancelShortcut() {
    if (electron_1.globalShortcut.isRegistered("Escape"))
        electron_1.globalShortcut.unregister("Escape");
}
function clearDoubleTapTimer() {
    if (!doubleTapTimer)
        return;
    clearTimeout(doubleTapTimer);
    doubleTapTimer = null;
}
function armDoubleTapTimer() {
    clearDoubleTapTimer();
    const extra = (0, dictation_binding_1.usesDarwinFnBinding)(currentBinding)
        ? LATCHED_FN_POLISH_WINDOW_MS
        : 0;
    doubleTapTimer = setTimeout(() => {
        doubleTapTimer = null;
        applyHoldResult((0, dictation_hold_machine_1.onDoubleTapTimeout)(holdState, Date.now()));
    }, dictation_hold_machine_1.DOUBLE_TAP_WINDOW_MS + extra);
}
function holdKind() {
    return (0, dictation_binding_1.usesDarwinFnBinding)(currentBinding) ? "fn" : "chord";
}
function resolveMode(forceDictate = false) {
    if (forceDictate)
        return "dictate";
    if ((0, dictation_action_session_1.isForceCommandMode)())
        return "command";
    return (0, dictation_mode_1.resolveDictationMode)(shiftHeld, (0, dictation_binding_1.bindingRequiresShift)(currentBinding), overlayActive(), forceDictate);
}
function applyLateCommandMode(opts) {
    if (emittedMode === "command")
        return;
    if (opts?.force || (0, dictation_action_session_1.isForceCommandMode)()) {
        if (!holdState.recording)
            return;
        emittedMode = "command";
        (0, dictation_dev_log_1.logDictationDev)("[Dictation] Action shortcut — switching to command mode");
        sendToMain("dictation:mode", "command");
        return;
    }
    if (!(0, dictation_mode_1.shouldUpgradeToCommandMode)({
        bindingRequiresShift: (0, dictation_binding_1.bindingRequiresShift)(currentBinding),
        hotkeyHeld: holdState.keyDownAt > 0,
        latched: opts?.ignoreLatch ? false : holdState.latched,
        overlayEnabled: overlayActive(),
        recording: holdState.recording,
        shiftDown: shiftHeld,
    })) {
        return;
    }
    emittedMode = "command";
    (0, dictation_dev_log_1.logDictationDev)("[Dictation] Shift held — switching to command mode");
    sendToMain("dictation:mode", "command");
}
function applyHoldEffect(effect, options = {}) {
    switch (effect.type) {
        case "none":
            return;
        case "ignored":
            (0, dictation_dev_log_1.logDictationDev)(`[Dictation] ${effect.reason}`);
            return;
        case "start":
            clearDoubleTapTimer();
            (0, dictation_dev_log_1.logDictationDev)(`[Dictation] ${effect.reason} (${resolveMode(options.forceDictate)})`);
            notifyDictationStart(resolveMode(options.forceDictate), holdState.latched);
            return;
        case "latch":
            clearDoubleTapTimer();
            (0, dictation_dev_log_1.logDictationDev)(`[Dictation] ${effect.reason} (${resolveMode(options.forceDictate)})`);
            // Recording is already running from the first tap, so this is the only
            // signal that the session went hands-free rather than push-to-talk.
            sendToMain("dictation:latched");
            // Hands-free can run for minutes; read the clipboard at stop instead.
            (0, dictation_clipboard_prefetch_1.discardClipboardPrefetch)();
            // State is already latched; still apply Shift held across the double-tap.
            if (!options.forceDictate)
                applyLateCommandMode({ ignoreLatch: true });
            return;
        case "arm-double-tap":
            (0, dictation_dev_log_1.logDictationDev)(`[Dictation] ${effect.reason}`);
            armDoubleTapTimer();
            return;
        case "stop":
            clearDoubleTapTimer();
            (0, dictation_action_session_1.clearForceCommandMode)();
            (0, dictation_dev_log_1.logDictationDev)(`[Dictation] ${effect.reason}`);
            notifyDictationStop();
            unregisterCancelShortcut();
            return;
        case "cancel":
            clearDoubleTapTimer();
            (0, dictation_action_session_1.clearForceCommandMode)();
            if (effect.reason)
                (0, dictation_dev_log_1.logDictationDev)(`[Dictation] ${effect.reason}`);
            notifyDictationCancel();
            unregisterCancelShortcut();
            return;
        default: {
            const _exhaustive = effect;
            return _exhaustive;
        }
    }
}
function applyHoldResult(result, options = {}) {
    holdState = result.state;
    applyHoldEffect(result.effect, options);
    // A deferred Fn start is still pending — the timer callback settles instead.
    if (!pendingLatchedFnDown)
        settleSpeculativeCapture();
}
function hasAccessibilityForDictation() {
    return !(0, dictation_accessibility_policy_1.shouldShowDictationAccessibilityPrompt)(process.platform, (0, dictation_accessibility_1.hasDictationAccessibility)());
}
function requireAccessibility() {
    if (hasAccessibilityForDictation()) {
        return true;
    }
    (0, windowing_1.sendDictationNeedsAccessibility)();
    return false;
}
function canSpeculativelyCapture() {
    return (dictationEnabled &&
        !holdState.recording &&
        !holdState.latched &&
        (0, dictation_mode_1.canBeginDictation)(session.rendererState(), session.isBusy()) &&
        hasAccessibilityForDictation());
}
function settleSpeculativeCapture() {
    if (holdState.recording || holdState.latched) {
        speculativeCapture.adopt();
        return;
    }
    speculativeCapture.discard();
}
function clearPendingLatchedFnDown() {
    if (!pendingLatchedFnDown)
        return null;
    clearTimeout(pendingLatchedFnDown);
    pendingLatchedFnDown = null;
    const downAt = pendingFnDownAt;
    pendingFnDownAt = null;
    return downAt;
}
const polishCtx = {
    getHoldState: () => holdState,
    setHoldState: (s) => {
        holdState = s;
    },
    isDictationEnabled: () => dictationEnabled,
    getRendererState: () => session.rendererState(),
    sendToMain,
    clearDoubleTapTimer,
    unregisterCancelShortcut,
    clearPendingLatchedFnDown: () => {
        clearPendingLatchedFnDown();
        // Polish pre-empts the Fn start, so the speculative mic must close too.
        speculativeCapture.discard();
    },
    disarmStopArm: () => {
        stopArm.disarm();
    },
    getPolishGeneration: () => polishGeneration,
    bumpPolishGeneration: () => ++polishGeneration,
};
function beginHold(now) {
    if (!dictationEnabled)
        return;
    if (!(0, dictation_mode_1.canBeginDictation)(session.rendererState(), session.isBusy())) {
        (0, dictation_dev_log_1.logDictationDev)("[Dictation] Ignored start — still processing");
        return;
    }
    // Stopping an active session must not depend on a fresh accessibility check.
    if (!holdState.latched && !holdState.recording && !requireAccessibility()) {
        return;
    }
    ++polishGeneration;
    applyHoldResult((0, dictation_hold_machine_1.onHotkeyDown)(holdState, holdKind(), now ?? Date.now()));
}
// macOS Fn: defer hold start by 100ms so a Fn+1 polish shortcut can pre-empt recording.
function onHotkeyDownMaybePolish() {
    if (!(0, dictation_binding_1.usesDarwinFnBinding)(currentBinding)) {
        beginHold();
        return;
    }
    if (pendingLatchedFnDown)
        return;
    pendingFnDownAt = Date.now();
    pendingLatchedFnDown = setTimeout(() => {
        pendingLatchedFnDown = null;
        const downAt = pendingFnDownAt;
        pendingFnDownAt = null;
        beginHold(downAt ?? undefined);
        // beginHold may bail without applying a result (busy, accessibility).
        settleSpeculativeCapture();
    }, LATCHED_FN_POLISH_WINDOW_MS);
    if (canSpeculativelyCapture())
        speculativeCapture.begin();
}
function endHold() {
    const deferredDownAt = clearPendingLatchedFnDown();
    if (deferredDownAt !== null) {
        beginHold(deferredDownAt);
    }
    applyHoldResult((0, dictation_hold_machine_1.onHotkeyUp)(holdState, holdKind(), Date.now()));
}
function latchDoubleTap() {
    if (!dictationEnabled)
        return;
    applyHoldResult((0, dictation_hold_machine_1.onDoubleTapDetected)(holdState, Date.now()));
}
function triggerDictationStart() {
    if (!dictationEnabled)
        return;
    if (!(0, dictation_mode_1.canBeginDictation)(session.rendererState(), session.isBusy())) {
        (0, dictation_dev_log_1.logDictationDev)("[Dictation] Ignored start — still processing");
        return;
    }
    if (!requireAccessibility())
        return;
    ++polishGeneration;
    clearPendingLatchedFnDown();
    clearDoubleTapTimer();
    applyHoldResult((0, dictation_hold_machine_1.onHandsFreeStart)(holdState));
}
function setDictationRendererState(state, mode = null) {
    session.onRendererState(state, mode);
}
/** The renderer never reported `idle`; drop the phantom session so the hotkey works again. */
function onSessionGuardExpired(blockedMs) {
    electron_log_1.default.warn("[Dictation] Session never finished — releasing the hotkey", {
        blockedMs,
    });
    triggerDictationCancel();
}
/**
 * Make sure the hotkey listeners are armed after something may have killed them.
 * A `renderer` cause (reload, crash) means the session's owner is gone: the
 * session is forgotten and, since the settings page that may have been
 * recording a shortcut is gone too, capture mode ends. A `system` cause
 * (resume, unlock) leaves the renderer and any recording or processing it
 * owns untouched — only the native listeners from before the sleep may be
 * dead, so fresh ones are swapped in.
 */
function recoverDictationHotkey(reason, cause) {
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Recovering hotkey after ${reason}`);
    if (cause === "renderer") {
        session.reset();
        triggerDictationCancel();
        if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
            resumeDictationHotkey();
        return;
    }
    finishInterruptedHold();
    shiftHeld = false;
    (0, dictation_action_session_1.resetActionSessionFlags)();
    syncHotkeyListeners();
    if ((0, shortcut_capture_session_1.isShortcutCaptureActive)() && process.platform !== "win32") {
        (0, dictation_hotkey_listeners_1.setMacosCaptureMode)(true, getDictationKeyBindings());
    }
}
/**
 * A push-to-talk hold whose release was lost (lock, sleep) ends like a release.
 * The replacement listener can never report that release, so every held flag
 * is stale afterwards; the caller resets them.
 */
function finishInterruptedHold() {
    if (holdState.latched || holdState.keyDownAt === 0)
        return;
    clearPendingLatchedFnDown();
    clearDoubleTapTimer();
    applyHoldResult((0, dictation_hold_machine_1.onForceStop)(holdState, Date.now(), "Hotkey release lost — finalizing"));
}
function triggerDictationStop(source) {
    clearPendingLatchedFnDown();
    clearDoubleTapTimer();
    stopSource = source;
    applyHoldResult((0, dictation_hold_machine_1.onForceStop)(holdState, Date.now(), "Stop button — finalizing recording"));
    stopSource = "hotkey";
}
function triggerDictationCancel() {
    ++polishGeneration;
    clearPendingLatchedFnDown();
    clearDoubleTapTimer();
    applyHoldResult((0, dictation_hold_machine_1.onForceCancel)(holdState, Date.now(), ""));
}
/** The preference says show it, and the Talk teaser has not taken it away. */
function pillWanted() {
    return pillVisible && pillPresence !== "hidden";
}
function publishPillAllowed() {
    (0, windowing_1.setDictationPillAllowed)(dictationEnabled && pillWanted());
}
function applyPillSurface() {
    if (dictationEnabled && pillWanted()) {
        (0, windowing_1.showDictationPill)();
        return;
    }
    (0, windowing_1.hideDictationPill)();
}
function setDictationPillVisible(visible) {
    if (pillVisible === visible) {
        if (!dictationEnabled)
            (0, windowing_1.hideDictationPill)();
        return;
    }
    pillVisible = visible;
    publishPillAllowed();
    applyPillSurface();
}
function setDictationPillPresence(presence) {
    if (pillPresence === presence)
        return;
    pillPresence = presence;
    (0, windowing_1.setDictationPillTeaserActive)(presence === "teaser");
    publishPillAllowed();
    applyPillSurface();
}
function syncHotkeyListeners() {
    if (dictationEnabled) {
        (0, dictation_hotkey_listeners_1.startDictationHotkeyListeners)(currentBinding, activeActionBinding(), currentHandsFreeBinding, activePolishBinding(), getDictationKeyBindings());
        return;
    }
    (0, dictation_hotkey_listeners_1.stopDictationHotkeyListeners)();
}
function onAccessibilityBecameGranted() {
    (0, dictation_dev_log_1.logDictationDev)("[Dictation] Accessibility granted — restarting hotkey listeners");
    if ((0, shortcut_capture_session_1.isShortcutCaptureActive)()) {
        (0, dictation_hotkey_listeners_1.setMacosCaptureMode)(true, getDictationKeyBindings());
        return;
    }
    syncHotkeyListeners();
}
function setDictationEnabled(enabled) {
    if (dictationEnabled === enabled) {
        if (!enabled)
            (0, windowing_1.hideDictationPill)();
        return;
    }
    dictationEnabled = enabled;
    // The Universal Pill is shelved for now: the legacy live bar stays the
    // default whether dictation is on or off. Pass `enabled` here to ship it.
    (0, windowing_1.setUniversalPillEnabled)(false);
    publishPillAllowed();
    if (enabled) {
        (0, dictation_accessibility_1.startDictationAccessibilityWatch)(onAccessibilityBecameGranted);
        // Warm the paste helper here, not at app boot, so a user without Fireflies
        // Talk never spawns a dictation helper process.
        (0, dictation_paste_1.prewarmDictationPasteHelper)();
    }
    else {
        (0, dictation_accessibility_1.stopDictationAccessibilityWatch)();
        (0, dictation_paste_1.stopDictationPasteHelper)();
    }
    syncHotkeyListeners();
    if (!enabled) {
        triggerDictationCancel();
        // Detached runs stopped mirroring the pill's gate when they left it, so
        // cancelling the pill's work does not touch them — they are ended here.
        (0, dictation_action_orb_ipc_1.abortDetachedActionRunsInRenderer)();
        (0, dictation_action_orb_window_1.setDictationActionOrbsVisible)(false);
        (0, windowing_1.hideDictationPill)();
        return;
    }
    (0, dictation_action_orb_window_1.setDictationActionOrbsVisible)(true);
    if (pillWanted()) {
        (0, windowing_1.showDictationPill)();
        return;
    }
    (0, windowing_1.promptDictationAccessibilityIfNeeded)();
}
function setupDictationShortcut() {
    (0, dictation_hotkey_listeners_1.recoverDictationHotkeyState)();
    restoreDictationShortcuts();
    sendShortcutHint();
}
function stopDictationShortcut() {
    (0, dictation_accessibility_1.stopDictationAccessibilityWatch)();
    (0, dictation_hotkey_listeners_1.stopDictationHotkeyListeners)();
}
function getDictationShortcutState() {
    return (0, dictation_binding_1.getDictationShortcutSnapshot)(currentBinding, process.platform);
}
function setDictationBinding(value) {
    const next = (0, dictation_binding_1.normalizeDictationBinding)(value, process.platform);
    const snapshot = (0, dictation_binding_1.getDictationShortcutSnapshot)(next, process.platform);
    if ((0, dictation_binding_1.dictationBindingsEqual)(currentBinding, next)) {
        (0, windowing_1.setDictationShortcutHint)(snapshot.hint);
        persistCurrentShortcuts();
        return snapshot;
    }
    currentBinding = next;
    clearInvalidHandsFreeBinding();
    triggerDictationCancel();
    shiftHeld = false;
    (0, dictation_action_session_1.resetActionSessionFlags)();
    syncHotkeyListeners();
    (0, windowing_1.setDictationShortcutHint)(snapshot.hint);
    persistCurrentShortcuts();
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Shortcut updated (${snapshot.label})`);
    return snapshot;
}
function setActionBinding(value) {
    const next = (0, action_binding_1.normalizeActionBinding)(value, process.platform);
    if (currentActionBinding === null && next === null)
        return null;
    if (currentActionBinding &&
        next &&
        (0, dictation_binding_1.dictationBindingsEqual)(currentActionBinding, next)) {
        persistCurrentShortcuts();
        return (0, dictation_binding_1.getDictationShortcutSnapshot)(next, process.platform);
    }
    currentActionBinding = next;
    clearInvalidHandsFreeBinding();
    triggerDictationCancel();
    shiftHeld = false;
    (0, dictation_action_session_1.resetActionSessionFlags)();
    syncHotkeyListeners();
    persistCurrentShortcuts();
    const snapshot = next
        ? (0, dictation_binding_1.getDictationShortcutSnapshot)(next, process.platform)
        : null;
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Action shortcut updated (${snapshot?.label ?? "unassigned"})`);
    return snapshot;
}
function setHandsFreeBinding(value) {
    const next = (0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(value, currentBinding, currentActionBinding, currentPolish.binding, process.platform);
    if ((0, hands_free_binding_1.handsFreeBindingsEqual)(currentHandsFreeBinding, next))
        return next;
    currentHandsFreeBinding = next;
    triggerDictationCancel();
    syncHotkeyListeners();
    persistCurrentShortcuts();
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Hands-free shortcut updated (${(0, hands_free_binding_1.formatHandsFreeBindingLabel)(next, { isMac: process.platform === "darwin" })})`);
    return next;
}
function clearInvalidHandsFreeBinding() {
    const resolved = (0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(currentHandsFreeBinding, currentBinding, currentActionBinding, currentPolish.binding, process.platform);
    if ((0, hands_free_binding_1.handsFreeBindingsEqual)(currentHandsFreeBinding, resolved))
        return;
    currentHandsFreeBinding = resolved;
}
function setActionModeEnabled(enabled) {
    if (actionModeEnabled === enabled)
        return;
    actionModeEnabled = enabled;
    triggerDictationCancel();
    shiftHeld = false;
    (0, dictation_action_session_1.resetActionSessionFlags)();
    syncHotkeyListeners();
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Action mode ${enabled ? "on" : "off"}`);
}
/**
 * Pushes the active polish keys to the Fn listener after a change, restarting
 * the listeners only when polish needs a different listener or chord helper.
 */
function applyActivePolish(previous, beforeRestart) {
    const active = activePolishBinding();
    (0, globe_key_listener_1.setGlobePolishKeys)((0, polish_binding_1.polishMacVirtualKeys)(active));
    if (!(0, dictation_hotkey_listeners_1.polishChangeNeedsRestart)(currentBinding, currentHandsFreeBinding, previous, active)) {
        return;
    }
    beforeRestart?.();
    syncHotkeyListeners();
}
/** Feature-flag gate for the on-demand polish shortcut. */
function setPolishActionEnabled(enabled) {
    if (currentPolish.enabled === enabled)
        return;
    const previous = activePolishBinding();
    currentPolish.enabled = enabled;
    // Drop any selected-text read still in flight from before the gate closed.
    if (!enabled)
        ++polishGeneration;
    if (process.platform === "darwin") {
        // The replacement listener misses an in-flight release, so finish it now.
        applyActivePolish(previous, () => {
            finishInterruptedHold();
            shiftHeld = false;
            (0, dictation_action_session_1.resetActionSessionFlags)();
        });
    }
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Polish action ${enabled ? "on" : "off"}`);
}
function setPolishBinding(value) {
    const next = (0, polish_binding_1.normalizePolishBinding)(value, process.platform);
    if (process.platform !== "darwin")
        return null;
    const previous = activePolishBinding();
    currentPolish.binding = next;
    applyActivePolish(previous);
    persistCurrentShortcuts();
    (0, dictation_dev_log_1.logDictationDev)(`[Dictation] Polish shortcut updated (${(0, polish_binding_1.formatPolishBindingLabel)(next)})`);
    return next;
}
function pauseDictationHotkey() {
    (0, shortcut_capture_session_1.setShortcutCaptureActive)(true);
    triggerDictationCancel();
    shiftHeld = false;
    (0, dictation_action_session_1.resetActionSessionFlags)();
    if (process.platform === "win32") {
        if (!(0, windows_key_listener_1.isWindowsKeyListenerRunning)())
            syncHotkeyListeners();
        (0, windows_key_listener_1.setWindowsCaptureMode)(true);
        return;
    }
    (0, dictation_hotkey_listeners_1.setMacosCaptureMode)(true, getDictationKeyBindings());
}
function resumeDictationHotkey() {
    (0, shortcut_capture_session_1.setShortcutCaptureActive)(false);
    shiftHeld = false;
    (0, dictation_action_session_1.resetActionSessionFlags)();
    if (process.platform === "win32") {
        (0, windows_key_listener_1.setWindowsCaptureMode)(false);
        return;
    }
    (0, dictation_hotkey_listeners_1.setMacosCaptureMode)(false, getDictationKeyBindings());
    syncHotkeyListeners();
}
function getDictationKeyBindings() {
    return {
        onDown: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            (0, dictation_action_session_1.setDictationHeld)(true);
            sendToMain("dictation:hotkey-held", true);
            onHotkeyDownMaybePolish();
        },
        onUp: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            (0, dictation_action_session_1.setDictationHeld)(false);
            sendToMain("dictation:hotkey-held", false);
            if ((0, dictation_action_session_1.isActionHeld)())
                return;
            endHold();
        },
        onActionDown: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            (0, dictation_action_session_1.beginActionHold)({
                beginHold,
                holdState,
                isRecording: () => holdState.recording,
                upgradeToCommand: () => applyLateCommandMode({ force: true, ignoreLatch: true }),
            });
        },
        onActionUp: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            (0, dictation_action_session_1.endActionHold)(endHold);
        },
        onHandsFreeDown: () => {
            if (!dictationEnabled || (0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            if (!holdState.recording && !holdState.latched) {
                if (!(0, dictation_mode_1.canBeginDictation)(session.rendererState(), session.isBusy())) {
                    (0, dictation_dev_log_1.logDictationDev)("[Dictation] Ignored start — still processing");
                    return;
                }
                if (!requireAccessibility())
                    return;
            }
            ++polishGeneration;
            const fnHeld = clearPendingLatchedFnDown() !== null;
            clearDoubleTapTimer();
            applyHoldResult((0, dictation_hold_machine_1.onHandsFreeToggle)(holdState, Date.now(), fnHeld), {
                forceDictate: true,
            });
        },
        onDoubleTap: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            latchDoubleTap();
        },
        onShiftChange: (down) => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            shiftHeld = down;
            if (down)
                applyLateCommandMode();
        },
        onInterrupted: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            applyHoldResult((0, dictation_hold_machine_1.onHotkeyInterrupted)(holdState, Date.now()));
        },
        onModifierUsed: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)())
                return;
            // A deferred Fn start must not fire after Fn turned out to be a modifier.
            clearPendingLatchedFnDown();
            applyHoldResult((0, dictation_hold_machine_1.onHotkeyModifierUsed)(holdState, Date.now()));
        },
        onPolish: () => {
            if ((0, shortcut_capture_session_1.isShortcutCaptureActive)() || !currentPolish.enabled)
                return;
            (0, dictation_dev_log_1.logDictationDev)("[Dictation] Polish shortcut — polish selected text");
            (0, dictation_shortcut_polish_1.triggerPolish)(polishCtx);
        },
    };
}
//# sourceMappingURL=dictation-shortcut.js.map
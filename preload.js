"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/******************************
!!!!! never use any node package in preload !!!!!
it can't access to node env due to the sandbox and fails to load
that causes expo/rn side not able to use exposed electron-API
*******************************/
function debugLog(...args) {
    if (process.env.NODE_ENV === "development") {
        console.log(...args);
    }
}
debugLog("[PRELOAD] Preload script is loading...");
// Add custom window drag handler for frameless windows
function addCustomWindowDragHandler() {
    // Inject app-region CSS for draggable/no-drag regions using testID/nativeID hooks
    window.addEventListener("DOMContentLoaded", () => {
        // ensure it adds only once
        if (document.querySelector('style[data-injected="app-region-rules"]')) {
            return;
        }
        const style = document.createElement("style");
        style.setAttribute("data-injected", "app-region-rules");
        style.textContent = `
  /* Prevent text selection globally */
  body {
    user-select: none;
    -webkit-user-select: none;
  }

  /* Allow selection in input fields and editable content */
  input, textarea, [contenteditable=true] {
    user-select: text;
    -webkit-user-select: text;
  }

  /* Drag region hooks (React Native Web maps testID to data-testid; nativeID to id) */
  [data-testid=drag], [data-testid=drag-region], #drag, #drag-region {
    -webkit-app-region: drag;
    user-select: none;
    -webkit-user-select: none;
    cursor: default;
  }

  /* Explicit no-drag hooks. Include #no-drag * so descendants stay interactive:
     -webkit-app-region is not reliably inherited on Windows Chromium, and drag
     regions steal mouse-wheel events (settings page scroll). */
  [data-testid=no-drag], #no-drag,
  [data-testid=no-drag] *, #no-drag * {
    -webkit-app-region: no-drag;
  }

  /* Drag-region sets cursor:default, and that inherits. RN Text also uses a
     text cursor, so only some pixels of a tab or button looked clickable.
     Cover the no-drag node itself and buttons nested inside a no-drag cluster. */
  [data-testid=no-drag][role=button], #no-drag[role=button],
  [data-testid=no-drag][role=button] *, #no-drag[role=button] *,
  [data-testid=no-drag] [role=button], #no-drag [role=button],
  [data-testid=no-drag] [role=button] *, #no-drag [role=button] * {
    cursor: pointer;
  }

  /* Common interactive elements should never be draggable */
  button, input, textarea, select, a, [role=button], [contenteditable=true] {
    -webkit-app-region: no-drag;
  }

  /* Remove focus outline on mouse click, keep it for keyboard navigation */
  *:focus {
    outline: none;
  }

  *:focus-visible {
    outline: auto;
  }

  /* Ensure buttons don't show focus ring after mouse click */
  button:focus:not(:focus-visible),
  [role=button]:focus:not(:focus-visible),
  a:focus:not(:focus-visible),
  div[role=button]:focus:not(:focus-visible) {
    outline: none;
  }

  /* Prevent default focus styling on all buttons and pressable elements */
  button, [role=button], div[role=button] {
    outline: none;
  }

  /* Remove tabIndex -1 focus ring entirely */
  [tabindex="-1"]:focus {
    outline: none !important;
  }
  `;
        document.head.appendChild(style);
        debugLog("[PRELOAD] Injected app-region CSS for drag/no-drag");
        // Remove focus from active element when Esc is pressed
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.blur) {
                    activeElement.blur();
                    debugLog("[PRELOAD] Blurred active element on Esc key");
                }
            }
        });
        debugLog("[PRELOAD] Added Esc key blur handler");
    });
}
addCustomWindowDragHandler();
// Read once: the renderer asks for this on every outgoing request's headers,
// and sendSync blocks it. Lazy rather than at module scope so the handler is
// certainly registered by first access.
let cachedAppVersion;
// Expose secure APIs to expo application runtime
electron_1.contextBridge.exposeInMainWorld("electron", {
    platform: process.platform,
    osVersion: process.getSystemVersion(),
    /**
     * The packaged app's version. Needed synchronously because `expo-application`
     * reports null on web — which the desktop renderer is — leaving Config.VERSION
     * stuck at its "0.0.0" fallback.
     */
    get appVersion() {
        cachedAppVersion ?? (cachedAppVersion = electron_1.ipcRenderer.sendSync("get-app-version"));
        return cachedAppVersion;
    },
    // Proxy authentication token (only accessible to our Electron app)
    get proxyAuthToken() {
        return electron_1.ipcRenderer.sendSync("get-proxy-auth-token");
    },
    // Proxy port (may differ from default if port was taken)
    get proxyPort() {
        return electron_1.ipcRenderer.sendSync("get-proxy-port");
    },
    clipboard: {
        writeText: (text) => electron_1.ipcRenderer.invoke("clipboard-write-text", text),
        writeHtml: (html, text) => electron_1.ipcRenderer.invoke("clipboard-write-html", html, text),
        writeMarkdown: (text) => electron_1.ipcRenderer.invoke("clipboard-write-markdown", text),
        writeImage: (dataUrl, text) => electron_1.ipcRenderer.invoke("clipboard-write-image", dataUrl, text),
    },
    // Notification methods
    notification: {
        show: (title, body, actionUrl, actionText, notificationConfig) => electron_1.ipcRenderer.invoke("show-notification", title, body, actionUrl, actionText, notificationConfig),
        showMeeting: (payload) => electron_1.ipcRenderer.invoke("show-meeting-notification", payload),
        showUpcoming: (payload) => electron_1.ipcRenderer.invoke("show-upcoming-notification", payload),
        showCalendarEvent: (payload) => electron_1.ipcRenderer.invoke("show-calendar-event-notification", payload),
        action: (actionUrl) => electron_1.ipcRenderer.invoke("notification-action", actionUrl),
        close: (actionUrl) => {
            debugLog("[PRELOAD] notification.close invoked", { actionUrl });
            return electron_1.ipcRenderer.invoke("notification-close", actionUrl);
        },
        focus: () => {
            debugLog("[PRELOAD] notification.focus invoked");
            return electron_1.ipcRenderer.invoke("notification-focus");
        },
        reportHeight: (height) => {
            return electron_1.ipcRenderer.invoke("notification-report-height", height);
        },
    },
    window: {
        showMain: () => {
            debugLog("[PRELOAD] window.showMain invoked");
            return electron_1.ipcRenderer.invoke("window-show-main");
        },
        minimize: () => {
            debugLog("[PRELOAD] window.minimize invoked");
            return electron_1.ipcRenderer.invoke("window-minimize");
        },
        close: () => {
            debugLog("[PRELOAD] window.close invoked");
            return electron_1.ipcRenderer.invoke("window-close");
        },
        closeAndFocusMain: (options) => {
            debugLog("[PRELOAD] window.closeAndFocusMain invoked", options);
            return electron_1.ipcRenderer.invoke("window-close-and-focus-main", options);
        },
        maximize: () => {
            debugLog("[PRELOAD] window.maximize invoked");
            return electron_1.ipcRenderer.invoke("window-maximize");
        },
        unmaximize: () => {
            debugLog("[PRELOAD] window.unmaximize invoked");
            return electron_1.ipcRenderer.invoke("window-unmaximize");
        },
        isMaximized: () => {
            debugLog("[PRELOAD] window.isMaximized invoked");
            return electron_1.ipcRenderer.invoke("window-is-maximized");
        },
        isMainWindow: () => {
            return electron_1.ipcRenderer.sendSync("window-is-main");
        },
        setIgnoreMouseEvents: (ignore, forward = true) => {
            debugLog("[PRELOAD] window.setIgnoreMouseEvents invoked", {
                ignore,
                forward,
            });
            return electron_1.ipcRenderer.invoke("window-set-ignore-mouse-events", ignore, forward);
        },
        resizeToContent: (width, height) => {
            debugLog("[PRELOAD] window.resizeToContent invoked", { width, height });
            return electron_1.ipcRenderer.invoke("window-resize-to-content", width, height);
        },
        snapToTop: () => {
            debugLog("[PRELOAD] window.snapToTop invoked");
            return electron_1.ipcRenderer.invoke("window-snap-to-top");
        },
        moveBy: (dx, dy) => {
            debugLog("[PRELOAD] window.moveBy invoked", { dx, dy });
            return electron_1.ipcRenderer.invoke("window-move-by", dx, dy);
        },
        setContentProtection: (enable) => {
            debugLog("[PRELOAD] window.setContentProtection invoked", { enable });
            return electron_1.ipcRenderer.invoke("window-set-content-protection", enable);
        },
        openLive: (url, mode) => {
            debugLog("[PRELOAD] window.openLive invoked", { url, mode });
            return electron_1.ipcRenderer.invoke("window-open-live", url, mode);
        },
        getScaleFactor: () => {
            debugLog("[PRELOAD] window.getScaleFactor invoked");
            return electron_1.ipcRenderer.invoke("window-get-scale-factor");
        },
        getZoomFactor: () => {
            debugLog("[PRELOAD] window.getZoomFactor invoked");
            return electron_1.ipcRenderer.invoke("window-get-zoom-factor");
        },
        onZoomFactorChanged: (callback) => {
            debugLog("[PRELOAD] window.onZoomFactorChanged registered");
            const handler = (_event, zoomFactor) => callback(zoomFactor);
            electron_1.ipcRenderer.on("window-zoom-factor-changed", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("window-zoom-factor-changed", handler);
            };
        },
    },
    // Browser meeting detection
    browserMeetings: {
        onMeetingsChanged: (callback) => {
            const handler = (_event, data) => callback(data);
            const removeListener = () => electron_1.ipcRenderer.removeListener("browser-meetings-changed", handler);
            electron_1.ipcRenderer.on("browser-meetings-changed", handler);
            return removeListener;
        },
        scan: () => electron_1.ipcRenderer.invoke("meetings:scan"),
        isAutomationAvailable: () => electron_1.ipcRenderer.invoke("meetings:check-automation"),
        findGoogleMeetBrowser: () => electron_1.ipcRenderer.invoke("meetings:find-google-meet-browser"),
        sendChatMessage: (browser, message) => electron_1.ipcRenderer.invoke("meetings:send-chat", browser, message),
        sendZoomNativeChat: (message) => electron_1.ipcRenderer.invoke("meetings:send-zoom-native-chat", message),
        isKeyboardAvailable: () => electron_1.ipcRenderer.invoke("meetings:is-keyboard-available"),
        checkAccessibilityPermission: () => electron_1.ipcRenderer.invoke("meetings:check-accessibility-permission"),
        openAccessibilitySettings: () => electron_1.ipcRenderer.invoke("meetings:open-accessibility-settings"),
        requestAccessibilityPermission: () => electron_1.ipcRenderer.invoke("meetings:request-accessibility-permission"),
    },
    // Notification navigation events to be handled by renderer (RN)
    notifications: {
        onNavigate: (callback) => {
            const handler = (_event, path) => callback(path);
            const removeListener = () => electron_1.ipcRenderer.removeListener("notification-navigate", handler);
            electron_1.ipcRenderer.on("notification-navigate", handler);
            return removeListener;
        },
        onDismissed: (callback) => {
            const handler = (_event, actionUrl) => callback(actionUrl);
            const removeListener = () => electron_1.ipcRenderer.removeListener("notification-dismissed", handler);
            electron_1.ipcRenderer.on("notification-dismissed", handler);
            return removeListener;
        },
    },
    // Recording control
    recording: {
        onStartRecording: (callback) => {
            const handler = (_event, payload) => callback(payload);
            const removeListener = () => electron_1.ipcRenderer.removeListener("start-recording", handler);
            electron_1.ipcRenderer.on("start-recording", handler);
            return removeListener;
        },
    },
    dictation: {
        onCapture: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:capture", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:capture", handler);
        },
        onStart: (callback) => {
            const handler = (_event, mode, handsFree) => callback(mode, handsFree);
            electron_1.ipcRenderer.on("dictation:start", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:start", handler);
        },
        onMode: (callback) => {
            const handler = (_event, mode) => callback(mode);
            electron_1.ipcRenderer.on("dictation:mode", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:mode", handler);
        },
        onLatched: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:latched", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:latched", handler);
        },
        onHotkeyHeld: (callback) => {
            const handler = (_event, held) => callback(held);
            electron_1.ipcRenderer.on("dictation:hotkey-held", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:hotkey-held", handler);
        },
        onStop: (callback) => {
            const handler = (_event, pasteEpoch, source) => callback(pasteEpoch, source);
            electron_1.ipcRenderer.on("dictation:stop", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:stop", handler);
        },
        onCancel: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:cancel", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:cancel", handler);
        },
        requestCancel: () => electron_1.ipcRenderer.send("dictation:cancel-request"),
        requestStart: () => electron_1.ipcRenderer.send("dictation:start-request"),
        requestStartNotes: () => electron_1.ipcRenderer.send("dictation:start-notes-request"),
        startManualDrag: () => electron_1.ipcRenderer.send("dictation:manual-drag-start"),
        endManualDrag: () => electron_1.ipcRenderer.send("dictation:manual-drag-end"),
        startActionOrbDrag: () => electron_1.ipcRenderer.send("dictation:orb-drag-start"),
        endActionOrbDrag: () => electron_1.ipcRenderer.send("dictation:orb-drag-end"),
        getActionOrbSpawnPoint: () => electron_1.ipcRenderer.invoke("dictation:orb-spawn-point"),
        publishActionRuns: (runs) => electron_1.ipcRenderer.send("dictation:action-runs", runs),
        onActionRuns: (callback) => {
            const handler = (_event, runs) => callback(runs);
            electron_1.ipcRenderer.on("dictation:action-runs", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:action-runs", handler);
        },
        pasteActionResult: (text) => electron_1.ipcRenderer.invoke("dictation:orb-paste", text),
        openActionLink: (url) => electron_1.ipcRenderer.invoke("dictation:open-link", url),
        requestActionRuns: () => electron_1.ipcRenderer.send("dictation:action-runs-request"),
        onActionRunsAborted: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:action-runs-abort", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:action-runs-abort", handler);
        },
        onActionRunsRequested: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:action-runs-request", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:action-runs-request", handler);
        },
        dismissActionRun: (id) => electron_1.ipcRenderer.send("dictation:action-run-dismiss", id),
        onActionRunDismissed: (callback) => {
            const handler = (_event, id) => callback(id);
            electron_1.ipcRenderer.on("dictation:action-run-dismiss", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:action-run-dismiss", handler);
        },
        requestStop: (source = "pill") => electron_1.ipcRenderer.send("dictation:stop-request", source),
        setEnabled: (enabled) => electron_1.ipcRenderer.send("dictation:set-enabled", enabled),
        setPillVisible: (visible) => electron_1.ipcRenderer.send("dictation:set-pill-visible", visible),
        setPillMinimized: (minimized) => electron_1.ipcRenderer.send("dictation:set-pill-minimized", minimized),
        setPillSide: (side) => electron_1.ipcRenderer.send("dictation:set-side", side),
        onPillMinimized: (callback) => {
            const handler = (_event, minimized) => callback(minimized);
            electron_1.ipcRenderer.on("dictation:pill-minimized", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:pill-minimized", handler);
        },
        getPillMinimized: () => electron_1.ipcRenderer.invoke("dictation:get-pill-minimized"),
        onPillBackdrop: (callback) => {
            const handler = (_event, backdrop) => callback(backdrop);
            electron_1.ipcRenderer.on("dictation:pill-backdrop", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:pill-backdrop", handler);
        },
        getPillBackdrop: () => electron_1.ipcRenderer.invoke("dictation:get-pill-backdrop"),
        setPauseMediaEnabled: (enabled) => electron_1.ipcRenderer.send("dictation:set-pause-media-enabled", enabled),
        paste: (text, pasteEpoch) => electron_1.ipcRenderer.invoke("dictation:paste", text, pasteEpoch),
        onPasteFallbackToast: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:paste-fallback-toast", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:paste-fallback-toast", handler);
        },
        onPasteMissed: (callback) => {
            const handler = (_event, pasteEpoch) => callback(pasteEpoch);
            electron_1.ipcRenderer.on("dictation:paste-missed", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:paste-missed", handler);
        },
        reportLevel: (level) => electron_1.ipcRenderer.send("dictation:level", level),
        onLevel: (callback) => {
            const handler = (_event, level) => callback(level);
            electron_1.ipcRenderer.on("dictation:level", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:level", handler);
        },
        reportState: (state, mode) => electron_1.ipcRenderer.send("dictation:state", state, mode),
        onState: (callback) => {
            const handler = (_event, state, mode) => callback(state, mode);
            electron_1.ipcRenderer.on("dictation:state", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:state", handler);
        },
        reportPhase: (phase) => electron_1.ipcRenderer.send("dictation:phase", phase),
        reportCaptureReleased: () => electron_1.ipcRenderer.send("dictation:capture-released"),
        onPhase: (callback) => {
            const handler = (_event, phase) => callback(phase);
            electron_1.ipcRenderer.on("dictation:phase", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:phase", handler);
        },
        onPolishSelection: (callback) => {
            const handler = (_event, text, pasteEpoch) => callback(text, pasteEpoch);
            electron_1.ipcRenderer.on("dictation:polish-selection", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:polish-selection", handler);
        },
        // Hover-to-expand is driven from the main process (a cursor hit-test on the
        // pill window) rather than DOM mouse events: the alpha click-through poll
        // toggles the window's mouse-event forwarding, which makes DOM hover
        // unreliable for a stationary cursor. See showDictationPill in windowing.ts.
        onHover: (callback) => {
            const handler = (_event, isHovered) => callback(isHovered);
            electron_1.ipcRenderer.on("dictation:hover", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:hover", handler);
        },
        onSide: (callback) => {
            const handler = (_event, side) => callback(side);
            electron_1.ipcRenderer.on("dictation:side", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:side", handler);
        },
        onDragging: (callback) => {
            const handler = (_event, dragging) => callback(dragging);
            electron_1.ipcRenderer.on("dictation:dragging", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:dragging", handler);
        },
        onMeetingActive: (callback) => {
            const handler = (_event, active) => callback(active);
            electron_1.ipcRenderer.on("dictation:meeting", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:meeting", handler);
        },
        getMeetingActive: () => electron_1.ipcRenderer.invoke("dictation:get-meeting-active"),
        reportMeetingActivity: (transcribing) => electron_1.ipcRenderer.send("dictation:meeting-activity", transcribing),
        onMeetingActivity: (callback) => {
            const handler = (_event, transcribing) => callback(transcribing);
            electron_1.ipcRenderer.on("dictation:meeting-activity-changed", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:meeting-activity-changed", handler);
        },
        showLiveBar: () => electron_1.ipcRenderer.send("dictation:show-live-bar"),
        getSide: () => electron_1.ipcRenderer.invoke("dictation:get-side"),
        getScreenContext: () => electron_1.ipcRenderer.invoke("dictation:get-screen-context"),
        getShortcut: () => electron_1.ipcRenderer.invoke("dictation:get-shortcut"),
        setShortcut: (binding) => electron_1.ipcRenderer.invoke("dictation:set-shortcut", binding),
        setActionShortcut: (binding) => electron_1.ipcRenderer.invoke("dictation:set-action-shortcut", binding),
        setHandsFreeShortcut: (binding) => electron_1.ipcRenderer.invoke("dictation:set-hands-free-shortcut", binding),
        setActionModeEnabled: (enabled) => electron_1.ipcRenderer.send("dictation:set-action-mode-enabled", enabled),
        setPolishActionEnabled: (enabled) => electron_1.ipcRenderer.send("dictation:set-polish-action-enabled", enabled),
        setPolishShortcut: (binding) => electron_1.ipcRenderer.invoke("dictation:set-polish-shortcut", binding),
        pauseHotkey: () => electron_1.ipcRenderer.send("dictation:pause-hotkey"),
        resumeHotkey: () => electron_1.ipcRenderer.send("dictation:resume-hotkey"),
        onCaptureWin: (callback) => {
            const handler = (_event, down) => callback(down);
            electron_1.ipcRenderer.on("dictation:capture-win", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:capture-win", handler);
        },
        onCaptureMouse: (callback) => {
            const handler = (_event, button, down, flags) => callback(button, down, flags);
            electron_1.ipcRenderer.on("dictation:capture-mouse", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:capture-mouse", handler);
        },
        onCaptureFn: (callback) => {
            const handler = (_event, down) => callback(down);
            electron_1.ipcRenderer.on("dictation:capture-fn", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:capture-fn", handler);
        },
        onCaptureFnChord: (callback) => {
            const handler = (_event, keyCode) => callback(keyCode);
            electron_1.ipcRenderer.on("dictation:capture-fn-chord", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:capture-fn-chord", handler);
        },
        onShortcutChanged: (callback) => {
            const handler = (_event, hint) => callback(hint);
            electron_1.ipcRenderer.on("dictation:shortcut", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:shortcut", handler);
        },
        hasAccessibilityPermission: () => electron_1.ipcRenderer.invoke("dictation:has-accessibility"),
        openAccessibilitySettings: () => electron_1.ipcRenderer.invoke("dictation:open-accessibility-settings"),
        closeAccessibilityPrompt: () => electron_1.ipcRenderer.send("dictation:close-accessibility-prompt"),
        setPillPresence: (presence) => electron_1.ipcRenderer.send("dictation:set-pill-presence", presence),
        onTeaser: (callback) => {
            const handler = (_event, active) => callback(active);
            electron_1.ipcRenderer.on("dictation:teaser", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:teaser", handler);
        },
        getTeaser: () => electron_1.ipcRenderer.invoke("dictation:get-teaser"),
        setTeaserContent: (content) => electron_1.ipcRenderer.send("dictation:set-teaser-content", content),
        onTeaserContent: (callback) => {
            const handler = (_event, content) => callback(content);
            electron_1.ipcRenderer.on("dictation:teaser-content", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:teaser-content", handler);
        },
        getTeaserContent: () => electron_1.ipcRenderer.invoke("dictation:get-teaser-content"),
        reportTeaserAction: (action) => electron_1.ipcRenderer.send("dictation:teaser-action", action),
        onTeaserAction: (callback) => {
            const handler = (_event, action) => callback(action);
            electron_1.ipcRenderer.on("dictation:teaser-action", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:teaser-action", handler);
        },
        onTeaserShown: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:teaser-shown", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:teaser-shown", handler);
        },
        setFeedbackPopoverActive: (active) => electron_1.ipcRenderer.send("dictation:set-feedback-popover", active),
        reportFeedbackAction: (action) => electron_1.ipcRenderer.send("dictation:feedback-action", action),
        onFeedbackAction: (callback) => {
            const handler = (_event, action) => callback(action);
            electron_1.ipcRenderer.on("dictation:feedback-action", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:feedback-action", handler);
        },
        onFeedbackPopoverShown: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:feedback-popover-shown", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:feedback-popover-shown", handler);
        },
        setEmailAssistantNudgeActive: (provider) => electron_1.ipcRenderer.invoke("dictation:set-email-assistant-nudge", provider),
        getEmailAssistantNudgeProvider: () => electron_1.ipcRenderer.invoke("dictation:get-email-assistant-nudge-provider"),
        reportEmailAssistantNudgeAction: (action) => electron_1.ipcRenderer.send("dictation:email-assistant-nudge-action", action),
        onEmailAssistantNudgeAction: (callback) => {
            const handler = (_event, action) => callback(action);
            electron_1.ipcRenderer.on("dictation:email-assistant-nudge-action", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:email-assistant-nudge-action", handler);
        },
        onEmailAssistantNudgeShown: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:email-assistant-nudge-shown", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:email-assistant-nudge-shown", handler);
        },
        setSlackAssistantNudgeActive: (active) => electron_1.ipcRenderer.invoke("dictation:set-slack-assistant-nudge", active),
        reportSlackAssistantNudgeAction: (action) => electron_1.ipcRenderer.send("dictation:slack-assistant-nudge-action", action),
        onSlackAssistantNudgeAction: (callback) => {
            const handler = (_event, action) => callback(action);
            electron_1.ipcRenderer.on("dictation:slack-assistant-nudge-action", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:slack-assistant-nudge-action", handler);
        },
        onSlackAssistantNudgeShown: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("dictation:slack-assistant-nudge-shown", handler);
            return () => electron_1.ipcRenderer.removeListener("dictation:slack-assistant-nudge-shown", handler);
        },
    },
    // Recording context bridge (sync across windows)
    recordingContext: {
        get: () => electron_1.ipcRenderer.invoke("recording-context:get"),
        sync: (snapshot) => electron_1.ipcRenderer.send("recording-context:sync", snapshot),
        requestUpdate: (update) => electron_1.ipcRenderer.send("recording-context:request-update", update),
        onUpdated: (callback) => {
            const handler = (_event, snapshot) => callback(snapshot);
            electron_1.ipcRenderer.on("recording-context:updated", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("recording-context:updated", handler);
            };
        },
        onUpdateRequested: (callback) => {
            const handler = (_event, update) => callback(update);
            electron_1.ipcRenderer.on("recording-context:apply-update", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("recording-context:apply-update", handler);
            };
        },
        stop: (meetingId) => electron_1.ipcRenderer.invoke("recording:stop", meetingId),
        onStopRequested: (callback) => {
            const handler = (_event, payload) => callback(payload);
            electron_1.ipcRenderer.on("recording:stop", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("recording:stop", handler);
            };
        },
        notifyStopCompleted: (payload) => electron_1.ipcRenderer.send("recording:stop-done", payload),
        discardRecording: (meetingId) => electron_1.ipcRenderer.invoke("recording:discard", meetingId),
        onDiscardRequested: (callback) => {
            const handler = (_event, payload) => callback(payload);
            electron_1.ipcRenderer.on("recording:discard", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("recording:discard", handler);
            };
        },
        notifyDiscarded: (payload) => electron_1.ipcRenderer.send("recording:discard-done", payload),
        notifyEnded: (payload) => electron_1.ipcRenderer.send("recording-context:ended", payload),
        onEnded: (callback) => {
            const handler = (_event, payload) => callback(payload);
            electron_1.ipcRenderer.on("recording-context:ended", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("recording-context:ended", handler);
            };
        },
        togglePauseResume: () => {
            electron_1.ipcRenderer.send("recording:toggle-pause-resume");
        },
        onTogglePauseResumeRequested: (callback) => {
            const handler = () => callback();
            electron_1.ipcRenderer.on("recording:toggle-pause-resume", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("recording:toggle-pause-resume", handler);
            };
        },
        setInputDevice: (deviceId) => {
            electron_1.ipcRenderer.send("recording:set-input-device", deviceId);
        },
        onSetInputDeviceRequested: (callback) => {
            const handler = (_event, deviceId) => callback(deviceId);
            electron_1.ipcRenderer.on("recording:set-input-device", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("recording:set-input-device", handler);
            };
        },
    },
    // Meeting metadata bridge (rename sync across windows)
    meeting: {
        broadcastTitleUpdate: (update) => electron_1.ipcRenderer.send("meeting:title-updated", update),
        onTitleUpdated: (callback) => {
            const handler = (_event, update) => callback(update);
            electron_1.ipcRenderer.on("meeting:title-updated", handler);
            return () => {
                electron_1.ipcRenderer.removeListener("meeting:title-updated", handler);
            };
        },
    },
    // Live view mode control
    liveView: {
        getBarSide: () => electron_1.ipcRenderer.invoke("live-bar:get-side"),
        onBarSide: (callback) => {
            const handler = (_event, side) => callback(side);
            electron_1.ipcRenderer.on("live-bar:side", handler);
            return () => electron_1.ipcRenderer.removeListener("live-bar:side", handler);
        },
        dockBar: (side) => electron_1.ipcRenderer.send("live-bar:dock", side),
        startBarDrag: () => electron_1.ipcRenderer.send("live-bar:drag-start"),
        endBarDrag: () => electron_1.ipcRenderer.send("live-bar:drag-end"),
        getMode: () => electron_1.ipcRenderer.invoke("liveview:get-mode"),
        setMode: (mode, persist) => electron_1.ipcRenderer.invoke("liveview:set-mode", mode, persist),
        getPreferredMode: () => electron_1.ipcRenderer.invoke("liveview:get-preferred-mode"),
        setPreferredMode: (mode) => electron_1.ipcRenderer.invoke("liveview:set-preferred-mode", mode),
        onModeChanged: (callback) => {
            const handler = (_event, mode) => callback(mode);
            const removeListener = () => electron_1.ipcRenderer.removeListener("liveview:mode-changed", handler);
            electron_1.ipcRenderer.on("liveview:mode-changed", handler);
            return removeListener;
        },
        isWindowAlive: () => electron_1.ipcRenderer.invoke("liveview:is-window-alive"),
        closeWindow: () => electron_1.ipcRenderer.invoke("liveview:close-window"),
        showWindow: () => electron_1.ipcRenderer.invoke("liveview:show-window"),
        getMeetingId: () => electron_1.ipcRenderer.invoke("liveview:get-meeting-id"),
        enterFullscreen: () => electron_1.ipcRenderer.invoke("liveview:enter-fullscreen"),
        reparentToMain: () => electron_1.ipcRenderer.invoke("liveview:reparent-to-main"),
        detachFromMain: () => electron_1.ipcRenderer.invoke("liveview:detach-from-main"),
        onReparentedToMain: (callback) => {
            const handler = () => callback();
            const removeListener = () => electron_1.ipcRenderer.removeListener("reparented-to-main", handler);
            electron_1.ipcRenderer.on("reparented-to-main", handler);
            return removeListener;
        },
        notifyMainNavigated: () => electron_1.ipcRenderer.send("liveview:main-window-navigated"),
        notifyMeetingEndedInPlace: () => electron_1.ipcRenderer.send("liveview:meeting-ended-in-place"),
    },
    // Meeting end animation floating window
    meetingEndAnimation: {
        show: () => electron_1.ipcRenderer.invoke("meeting-end-animation:show"),
        hide: () => electron_1.ipcRenderer.invoke("meeting-end-animation:hide"),
    },
    // Audio monitor control
    audioMonitor: {
        start: () => electron_1.ipcRenderer.invoke("audio-monitor-start"),
        stop: () => electron_1.ipcRenderer.invoke("audio-monitor-stop"),
        isActive: () => electron_1.ipcRenderer.invoke("audio-monitor-is-active"),
        requestSystemAudioPermission: () => electron_1.ipcRenderer.invoke("audio-monitor-request-system-audio-permission"),
        onAudioEvent: (callback) => {
            const handler = (_event, audioEvent) => callback(audioEvent);
            const removeListener = () => electron_1.ipcRenderer.removeListener("audio-event", handler);
            electron_1.ipcRenderer.on("audio-event", handler);
            return removeListener;
        },
    },
    // Audio playback for consent sounds
    audio: {
        getConsentMessageData: () => electron_1.ipcRenderer.invoke("audio:get-consent-message"),
    },
    // Audio loopback control for system audio capture
    audioLoopback: {
        enable: (options) => electron_1.ipcRenderer.invoke("enable-loopback-audio", options),
        disable: () => electron_1.ipcRenderer.invoke("disable-loopback-audio"),
        getConfig: () => electron_1.ipcRenderer.invoke("audio-loopback:get-config"),
        shouldUseCoreAudioTap: () => electron_1.ipcRenderer.invoke("audio-loopback:should-use-core-audio-tap"),
    },
    // Real-time streaming bridge to Node WebSocket client
    streaming: {
        start: (config) => electron_1.ipcRenderer.invoke("streaming:start", config),
        sendChunk: (chunk) => electron_1.ipcRenderer.send("streaming:chunk", chunk),
        sendMicActivity: (micActivity) => electron_1.ipcRenderer.send("streaming:mic-activity", micActivity),
        end: () => electron_1.ipcRenderer.invoke("streaming:end"),
        stop: () => electron_1.ipcRenderer.invoke("streaming:stop"),
        onStateChange: (callback) => {
            const handler = (_event, state) => callback(state);
            electron_1.ipcRenderer.on("streaming:state", handler);
            return () => electron_1.ipcRenderer.removeListener("streaming:state", handler);
        },
        onError: (callback) => {
            const handler = (_event, error) => callback(error);
            electron_1.ipcRenderer.on("streaming:error", handler);
            return () => electron_1.ipcRenderer.removeListener("streaming:error", handler);
        },
        onTokenRequest: (provider) => {
            const handler = async (_event, requestId) => {
                try {
                    const token = await provider();
                    electron_1.ipcRenderer.send("streaming:token-response", { requestId, token });
                }
                catch (error) {
                    electron_1.ipcRenderer.send("streaming:token-response", {
                        requestId,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            };
            electron_1.ipcRenderer.on("streaming:token-request", handler);
            return () => electron_1.ipcRenderer.removeListener("streaming:token-request", handler);
        },
        onComplete: (callback) => {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on("streaming:complete", handler);
            return () => electron_1.ipcRenderer.removeListener("streaming:complete", handler);
        },
        onTranscript: (callback) => {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on("streaming:transcript", handler);
            return () => electron_1.ipcRenderer.removeListener("streaming:transcript", handler);
        },
        getHealth: () => electron_1.ipcRenderer.invoke("streaming:get-health"),
    },
    // Network reachability bridge to the main-process proxy-aware HTTPS probe
    network: {
        isReachable: () => electron_1.ipcRenderer.invoke("network:is-reachable"),
    },
    // Permissions control
    permissions: {
        check: (type) => electron_1.ipcRenderer.invoke("permissions:check", type),
        checkAll: () => electron_1.ipcRenderer.invoke("permissions:check-all"),
        request: (type) => electron_1.ipcRenderer.invoke("permissions:request", type),
        openSettings: (type) => electron_1.ipcRenderer.invoke("permissions:open-settings", type),
    },
    // App settings
    app: {
        setLoginItemSettings: (enable) => {
            debugLog("[PRELOAD] app.setLoginItemSettings invoked", { enable });
            return electron_1.ipcRenderer.invoke("app-set-login-item-settings", enable);
        },
        getLoginItemSettings: () => {
            debugLog("[PRELOAD] app.getLoginItemSettings invoked");
            return electron_1.ipcRenderer.invoke("app-get-login-item-settings");
        },
        setQuickNoteShortcut: (enabled, key) => {
            debugLog("[PRELOAD] app.setQuickNoteShortcut invoked", { enabled, key });
            return electron_1.ipcRenderer.invoke("app-set-quick-note-shortcut", enabled, key);
        },
        getSystemIdleState: (idleThresholdSeconds = 60) => {
            debugLog("[PRELOAD] app.getSystemIdleState invoked", {
                idleThresholdSeconds,
            });
            return electron_1.ipcRenderer.invoke("app-get-system-idle-state", idleThresholdSeconds);
        },
        getWindowPowerState: () => electron_1.ipcRenderer.invoke("app-get-window-power-state"),
        getProcessHealth: () => electron_1.ipcRenderer.invoke("app-get-process-health"),
        setRecordingPowerPolicy: (mode) => electron_1.ipcRenderer.invoke("app-set-recording-power-policy", mode),
    },
    // Auto-updater
    updater: {
        getVersion: () => {
            debugLog("[PRELOAD] updater.getVersion invoked");
            return electron_1.ipcRenderer.invoke("updater:get-version");
        },
        getStatus: () => {
            debugLog("[PRELOAD] updater.getStatus invoked");
            return electron_1.ipcRenderer.invoke("updater:get-status");
        },
        checkForUpdates: () => {
            debugLog("[PRELOAD] updater.checkForUpdates invoked");
            return electron_1.ipcRenderer.invoke("updater:check-for-updates");
        },
        installUpdate: () => {
            debugLog("[PRELOAD] updater.installUpdate invoked");
            return electron_1.ipcRenderer.invoke("updater:install-update");
        },
        clearPostUpdateReleaseNotes: () => {
            debugLog("[PRELOAD] updater.clearPostUpdateReleaseNotes invoked");
            return electron_1.ipcRenderer.invoke("updater:clear-post-update-release-notes");
        },
        onStatusChanged: (callback) => {
            const handler = (_event, status) => callback(status);
            const removeListener = () => electron_1.ipcRenderer.removeListener("updater:status-changed", handler);
            electron_1.ipcRenderer.on("updater:status-changed", handler);
            debugLog("[PRELOAD] updater.onStatusChanged listener added");
            return removeListener;
        },
    },
    // Glass blur underlays (macOS only)
    virtualCamera: {
        getStatus: () => electron_1.ipcRenderer.invoke("virtual-camera:get-status"),
        enable: () => electron_1.ipcRenderer.invoke("virtual-camera:enable"),
        disable: () => electron_1.ipcRenderer.invoke("virtual-camera:disable"),
        onStatusChanged: (callback) => {
            const listener = (_event, status) => callback(status);
            electron_1.ipcRenderer.on("virtual-camera:status-changed", listener);
            return () => electron_1.ipcRenderer.removeListener("virtual-camera:status-changed", listener);
        },
    },
    glass: {
        upsert: (id, rect) => {
            debugLog("[PRELOAD] glass.upsert invoked", { id, rect });
            return electron_1.ipcRenderer.send("glass:upsert", id, rect);
        },
        hide: (id) => {
            debugLog("[PRELOAD] glass.hide invoked", { id });
            return electron_1.ipcRenderer.send("glass:hide", id);
        },
        remove: (id) => {
            debugLog("[PRELOAD] glass.remove invoked", { id });
            return electron_1.ipcRenderer.send("glass:remove", id);
        },
        getWindowPosition: async () => {
            const pos = await electron_1.ipcRenderer.invoke("glass:get-window-position");
            return pos;
        },
    },
    // Cloud log forwarding from main process
    cloudLog: {
        onFlush: (callback) => {
            const handler = (_event, batch) => callback(batch);
            electron_1.ipcRenderer.on("cloud-log:flush", handler);
            return () => electron_1.ipcRenderer.removeListener("cloud-log:flush", handler);
        },
    },
    // Logger API for sending logs to main process
    logger: {
        write: (level, tag, message, metadata) => {
            return electron_1.ipcRenderer.send("logger:write", level, tag, message, metadata);
        },
        getLogFiles: () => {
            return electron_1.ipcRenderer.invoke("logger:get-log-files");
        },
    },
    // Shell API for opening files/folders
    shell: {
        showItemInFolder: (path) => {
            debugLog("[PRELOAD] shell.showItemInFolder invoked", { path });
            electron_1.ipcRenderer.invoke("shell:show-item-in-folder", path);
        },
        openPath: async (path) => {
            debugLog("[PRELOAD] shell.openPath invoked", { path });
            return electron_1.ipcRenderer.invoke("shell:open-path", path);
        },
    },
    // File system API for recording storage
    fs: {
        getRecordingsDir: () => electron_1.ipcRenderer.invoke("fs:get-recordings-dir"),
        getLogsDir: () => electron_1.ipcRenderer.invoke("fs:get-logs-dir"),
        mkdir: (path) => electron_1.ipcRenderer.invoke("fs:mkdir", path),
        writeFile: (path, data) => electron_1.ipcRenderer.invoke("fs:write-file", path, data),
        appendFile: (path, data) => electron_1.ipcRenderer.invoke("fs:append-file", path, data),
        readFile: (path) => electron_1.ipcRenderer.invoke("fs:read-file", path),
        readFileRange: (path, start, length) => electron_1.ipcRenderer.invoke("fs:read-file-range", path, start, length),
        stat: (path) => electron_1.ipcRenderer.invoke("fs:stat", path),
        exists: (path) => electron_1.ipcRenderer.invoke("fs:exists", path),
        unlink: (path) => electron_1.ipcRenderer.invoke("fs:unlink", path),
        readdir: (path) => electron_1.ipcRenderer.invoke("fs:readdir", path),
    },
    // Glass sync control events
    onStopGlassSync: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("stop-glass-sync", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("stop-glass-sync", handler);
        };
    },
    onResumeGlassSync: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("resume-glass-sync", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("resume-glass-sync", handler);
        };
    },
    onWindowFocus: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("window-focus", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("window-focus", handler);
        };
    },
    triggerMainRefetch: () => {
        debugLog("[PRELOAD] triggerMainRefetch invoked");
        electron_1.ipcRenderer.send("trigger-main-refetch");
    },
    navigateMainToLive: (meetingId) => {
        debugLog("[PRELOAD] navigateMainToLive invoked", meetingId);
        electron_1.ipcRenderer.send("navigate-main-to-live", meetingId);
    },
    navigateMainToRoute: (route) => {
        debugLog("[PRELOAD] navigateMainToRoute invoked", route);
        electron_1.ipcRenderer.send("navigate-main-to-route", route);
    },
    onTriggerRefetch: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("trigger-refetch", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("trigger-refetch", handler);
        };
    },
    notifyLiveMeetingEnded: (meetingId) => {
        debugLog("[PRELOAD] notifyLiveMeetingEnded invoked", meetingId);
        electron_1.ipcRenderer.send("live-meeting-ended", meetingId);
    },
    onLiveMeetingEnded: (callback) => {
        const handler = (_event, meetingId) => callback(meetingId);
        electron_1.ipcRenderer.on("live-meeting-ended", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("live-meeting-ended", handler);
        };
    },
    onWindowBlur: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("window-blur", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("window-blur", handler);
        };
    },
    onWindowMinimize: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("window-minimize", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("window-minimize", handler);
        };
    },
    onWindowRestore: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("window-restore", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("window-restore", handler);
        };
    },
    isWindowFullscreen: () => electron_1.ipcRenderer.invoke("window-is-fullscreen"),
    onWindowFullscreenChange: (callback) => {
        const handler = (_event, isFullscreen) => callback(isFullscreen);
        electron_1.ipcRenderer.on("window-fullscreen-change", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("window-fullscreen-change", handler);
        };
    },
    onUserBecameActive: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("power:user-became-active", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("power:user-became-active", handler);
        };
    },
    // Clear DNS cache (best effort - may not affect renderer due to Electron limitations)
    clearHostResolverCache: () => {
        debugLog("[PRELOAD] clearHostResolverCache invoked");
        return electron_1.ipcRenderer.invoke("clear-host-resolver-cache");
    },
    onDisplayChanged: (callback) => {
        const handler = (_event, scaleFactor, displayId) => callback(scaleFactor, displayId);
        electron_1.ipcRenderer.on("display-changed", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("display-changed", handler);
        };
    },
    onNavigateToHome: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on("navigate-to-home", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("navigate-to-home", handler);
        };
    },
    onNavigateToLive: (callback) => {
        const handler = (_event, meetingId) => callback(meetingId);
        electron_1.ipcRenderer.on("navigate-to-live", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("navigate-to-live", handler);
        };
    },
    onNavigateToRoute: (callback) => {
        const handler = (_event, route) => callback(route);
        electron_1.ipcRenderer.on("navigate-to-route", handler);
        return () => {
            electron_1.ipcRenderer.removeListener("navigate-to-route", handler);
        };
    },
    calendar: {
        sync: (state) => electron_1.ipcRenderer.invoke("calendar:sync", state),
    },
    tray: {
        onOpenInviteModal: (callback) => {
            const handler = (_, url) => callback(url);
            electron_1.ipcRenderer.on("tray-open-invite-modal", handler);
            return () => electron_1.ipcRenderer.removeListener("tray-open-invite-modal", handler);
        },
        onInviteBotDirectly: (callback) => {
            const handler = (_, url) => callback(url);
            electron_1.ipcRenderer.on("tray-invite-bot", handler);
            return () => electron_1.ipcRenderer.removeListener("tray-invite-bot", handler);
        },
    },
    // Sentry config + context sync for @sentry/browser (React) ↔ @sentry/electron/main
    sentry: {
        // Inlined (NOT imported from src/constants): this preload runs sandboxed in production, where it
        // can't `require` app modules — a failed import here would silently break window.electron exposure.
        // Keep in sync with SENTRY_DSN in electron/src/constants.ts.
        dsn: "https://401e1a062ddb793037a36eee5ed5e82e@o207331.ingest.us.sentry.io/4510982345785344",
        get release() {
            return `fireflies-desktop@${electron_1.ipcRenderer.sendSync("get-app-version")}`;
        },
        setUser: (user) => electron_1.ipcRenderer.send("sentry:set-user", user),
        setContext: (name, context) => electron_1.ipcRenderer.send("sentry:set-context", name, context),
        setTag: (key, value) => electron_1.ipcRenderer.send("sentry:set-tag", key, value),
    },
});
debugLog("[PRELOAD] Electron APIs exposed successfully");
// Intercept console logs in development mode
if (process.env.NODE_ENV === "development") {
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
    };
    // Override console methods to also send to main process
    console.log = (...args) => {
        originalConsole.log(...args);
        electron_1.ipcRenderer.send("logger:console", "log", ...args);
    };
    console.info = (...args) => {
        originalConsole.info(...args);
        electron_1.ipcRenderer.send("logger:console", "info", ...args);
    };
    console.warn = (...args) => {
        originalConsole.warn(...args);
        electron_1.ipcRenderer.send("logger:console", "warn", ...args);
    };
    console.error = (...args) => {
        originalConsole.error(...args);
        electron_1.ipcRenderer.send("logger:console", "error", ...args);
    };
    console.debug = (...args) => {
        originalConsole.debug(...args);
        electron_1.ipcRenderer.send("logger:console", "debug", ...args);
    };
    debugLog("[PRELOAD] Console logging interception enabled for development");
}
// Global error handlers to catch uncaught errors
window.addEventListener("error", (event) => {
    const errorMsg = `Uncaught error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
    console.error(errorMsg, event.error);
    electron_1.ipcRenderer.send("logger:write", "error", "UncaughtError", errorMsg, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
    });
});
window.addEventListener("unhandledrejection", (event) => {
    const errorMsg = `Unhandled promise rejection: ${event.reason}`;
    console.error(errorMsg, event.reason);
    electron_1.ipcRenderer.send("logger:write", "error", "UnhandledRejection", errorMsg, {
        reason: String(event.reason),
        promise: String(event.promise),
    });
});
//# sourceMappingURL=preload.js.map
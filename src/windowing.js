"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDictationPillMinimized = exports.glassManager = exports.liveGlassManager = exports.mainGlassManager = exports.recordWindow = exports.liveWindow = exports.mainWindow = void 0;
exports.getDictationPillCenter = getDictationPillCenter;
exports.getDictationPillSide = getDictationPillSide;
exports.setDictationPillSide = setDictationPillSide;
exports.getDictationPillBackdrop = getDictationPillBackdrop;
exports.startDictationManualDrag = startDictationManualDrag;
exports.endDictationManualDrag = endDictationManualDrag;
exports.syncLiveViewBounds = syncLiveViewBounds;
exports.getLiveBarDockSide = getLiveBarDockSide;
exports.suppressLiveBarMoveTracking = suppressLiveBarMoveTracking;
exports.snapLiveBarToSide = snapLiveBarToSide;
exports.startLiveBarManualDrag = startLiveBarManualDrag;
exports.endLiveBarManualDrag = endLiveBarManualDrag;
exports.setContentProtectionEnabled = setContentProtectionEnabled;
exports.getContentProtectionEnabled = getContentProtectionEnabled;
exports.setMainWindow = setMainWindow;
exports.setRecordingShutdownCoordinator = setRecordingShutdownCoordinator;
exports.getCurrentLiveMeetingId = getCurrentLiveMeetingId;
exports.destroyLiveWindow = destroyLiveWindow;
exports.createWindow = createWindow;
exports.isLiveBarBottomAnchored = isLiveBarBottomAnchored;
exports.isLiveBarSideDocked = isLiveBarSideDocked;
exports.liveBarResizeAnchor = liveBarResizeAnchor;
exports.showLiveBarFromPill = showLiveBarFromPill;
exports.isDictationPillTeaserActive = isDictationPillTeaserActive;
exports.setDictationPillTeaserActive = setDictationPillTeaserActive;
exports.setDictationTeaserContent = setDictationTeaserContent;
exports.getDictationTeaserContent = getDictationTeaserContent;
exports.sendDictationTeaserAction = sendDictationTeaserAction;
exports.setDictationFeedbackPopoverActive = setDictationFeedbackPopoverActive;
exports.sendDictationFeedbackAction = sendDictationFeedbackAction;
exports.getDictationEmailAssistantNudgeProvider = getDictationEmailAssistantNudgeProvider;
exports.setDictationEmailAssistantNudgeActive = setDictationEmailAssistantNudgeActive;
exports.sendDictationEmailAssistantNudgeAction = sendDictationEmailAssistantNudgeAction;
exports.setDictationSlackAssistantNudgeActive = setDictationSlackAssistantNudgeActive;
exports.sendDictationSlackAssistantNudgeAction = sendDictationSlackAssistantNudgeAction;
exports.setDictationPillAllowed = setDictationPillAllowed;
exports.setUniversalPillEnabled = setUniversalPillEnabled;
exports.isLiveMeetingActive = isLiveMeetingActive;
exports.setDictationPillMinimized = setDictationPillMinimized;
exports.sendDictationPasteFallbackToast = sendDictationPasteFallbackToast;
exports.setMeetingTranscribing = setMeetingTranscribing;
exports.setMeetingRecordingActive = setMeetingRecordingActive;
exports.markLiveMeetingEnded = markLiveMeetingEnded;
exports.switchLiveWindowMode = switchLiveWindowMode;
exports.exitLiveFullWindowFullscreen = exitLiveFullWindowFullscreen;
exports.enterLiveFullWindowFullscreen = enterLiveFullWindowFullscreen;
exports.getLiveBrowserViewWebContents = getLiveBrowserViewWebContents;
exports.isLiveViewHostFullscreen = isLiveViewHostFullscreen;
exports.markLiveMeetingEndedInPlace = markLiveMeetingEndedInPlace;
exports.reparentLiveViewToMain = reparentLiveViewToMain;
exports.detachLiveViewFromMain = detachLiveViewFromMain;
exports.isLiveViewOnMain = isLiveViewOnMain;
exports.createChildWindow = createChildWindow;
exports.showMainWindow = showMainWindow;
exports.revealMainWindow = revealMainWindow;
exports.showMeetingEndAnimationWindow = showMeetingEndAnimationWindow;
exports.hideMeetingEndAnimationWindow = hideMeetingEndAnimationWindow;
exports.showDictationPill = showDictationPill;
exports.hideDictationPill = hideDictationPill;
exports.isDictationRendererSender = isDictationRendererSender;
exports.setDictationPillState = setDictationPillState;
exports.sendDictationLevel = sendDictationLevel;
exports.sendDictationPhase = sendDictationPhase;
exports.setDictationShortcutHint = setDictationShortcutHint;
exports.sendDictationNeedsAccessibility = sendDictationNeedsAccessibility;
exports.promptDictationAccessibilityIfNeeded = promptDictationAccessibilityIfNeeded;
const electron_1 = require("electron");
const fsSync = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const utils_1 = require("./utils");
const navigation_1 = require("./navigation");
const restart_state_1 = require("./auto-updater/restart-state");
const full_window_bounds_store_1 = require("./full-window-bounds-store");
const mouse_1 = require("./mouse");
const dictation_action_orb_window_1 = require("./dictation/dictation-action-orb-window");
const glass_manager_1 = require("./glass-manager");
const live_view_mode_store_1 = require("./live-view-mode-store");
const recording_context_store_1 = require("./recording-context-store");
const window_zoom_1 = require("./window-zoom");
const ipc_1 = require("./ipc");
const dictation_accessibility_window_1 = require("./dictation/dictation-accessibility-window");
const dictation_talk_teaser_window_1 = require("./dictation/dictation-talk-teaser-window");
const dictation_feedback_window_1 = require("./dictation/dictation-feedback-window");
const dictation_feedback_hold_1 = require("./dictation/dictation-feedback-hold");
const dictation_pill_card_edge_1 = require("./dictation/dictation-pill-card-edge");
const dictation_email_assistant_window_1 = require("./dictation/dictation-email-assistant-window");
const dictation_slack_assistant_window_1 = require("./dictation/dictation-slack-assistant-window");
const dictation_pill_layout_1 = require("./dictation/dictation-pill-layout");
const dictation_pill_minimized_1 = require("./dictation/dictation-pill-minimized");
Object.defineProperty(exports, "isDictationPillMinimized", { enumerable: true, get: function () { return dictation_pill_minimized_1.isDictationPillMinimized; } });
const dictation_pill_screen_1 = require("./dictation/dictation-pill-screen");
const dictation_pill_backdrop_sampler_1 = require("./dictation/dictation-pill-backdrop-sampler");
const dictation_pill_backdrop_1 = require("./dictation/dictation-pill-backdrop");
const dictation_pill_tracking_1 = require("./dictation/dictation-pill-tracking");
const dictation_pill_position_1 = require("./dictation/dictation-pill-position");
const macos_left_mouse_1 = require("./dictation/macos-left-mouse");
const dictation_pill_overlay_1 = require("./dictation/dictation-pill-overlay");
const dictation_live_anchor_1 = require("./dictation/dictation-live-anchor");
const meeting_presence_1 = require("./dictation/meeting-presence");
const meeting_end_animation_position_1 = require("./dictation/meeting-end-animation-position");
const dictation_pill_dock_store_1 = require("./dictation/dictation-pill-dock-store");
const dictation_pill_context_menu_1 = require("./dictation/dictation-pill-context-menu");
const main_window_context_menu_1 = require("./main-window-context-menu");
const windows_overlay_owner_1 = require("./dictation/windows-overlay-owner");
const windows_overlay_activation_1 = require("./dictation/windows-overlay-activation");
const macos_panel_activation_1 = require("./macos-panel-activation");
const macos_spaces_1 = require("./macos-spaces");
const recording_shutdown_1 = require("./recording-shutdown");
// Global window references
exports.mainWindow = null;
exports.liveWindow = null;
exports.recordWindow = null;
let recordingShutdownCoordinator = null;
// Meeting end animation floating window
let meetingEndAnimationWindow = null;
// Dictation push-to-talk floating pill window. The pill renders inside
// a WebContentsView inside a fixed, larger host window (like the Live compact
// panel) — the pill sits bottom-centered in the transparent window, so macOS's
// corner mask sits at the (invisible) host-window corners and never touches
// the pill, and the transparent margin composites truly see-through. Alpha-
// based click-through (startIgnoreMouseEventsByAlpha) forwards clicks over the
// transparent margin to the app behind, keeping only the pill interactive.
let dictationPillWindow = null;
let dictationPillView = null;
let dictationHoverInterval = null;
let dictationPillRepositionInterval = null;
let dictationCollapseTimer = null;
let lastDictationPillDisplayId = null;
let dictationShortcutHint = process.platform === "win32" ? "Hold Ctrl+Win" : "Hold Fn";
const DICTATION_PILL_REPOSITION_MS = 400;
const DICTATION_PILL_BOTTOM_MARGIN = (0, dictation_pill_layout_1.dictationPillBottomMargin)(process.platform);
let dictationPillSide = "bottom";
let dictationPillDockLoaded = false;
let dictationPillDragging = false;
/** The cursor is on the open launcher: the window stays clickable, no sampling. */
let dictationLauncherHovered = false;
let restoreDictationClickThrough = null;
let dictationPointerPoll = null;
let dictationWinDragOrigin = null;
let dictationCaptionLoopActive = false;
let dictationIgnoreMoveEvents = false;
function runDictationProgrammaticMove(move) {
    dictationIgnoreMoveEvents = true;
    try {
        move();
    }
    finally {
        dictationIgnoreMoveEvents = false;
    }
}
function setDictationPillBounds(bounds) {
    const win = dictationPillWindow;
    if (!win || win.isDestroyed())
        return;
    if (!dictationPillDragging)
        dictationWinDragOrigin = null;
    runDictationProgrammaticMove(() => {
        win.setBounds(bounds);
    });
}
/**
 * Where along its docked edge the pill sits. The pill and the live bar are
 * independent surfaces: each keeps its own edge and place along it, and
 * neither moves, hides, or re-docks for the other.
 */
let dictationPillEdgeAnchor = 0.5;
/** Where along its docked edge the live bar sits, per session. */
let liveBarEdgeAnchor = 0.5;
/**
 * Records where along its edge the bar was just placed. A side-docked bar
 * measures by its rail, everything else by its own box.
 */
function recordLiveBarAnchor(side, bounds, workArea) {
    liveBarEdgeAnchor =
        side === "left" || side === "right"
            ? (0, dictation_live_anchor_1.liveBarSideAnchorFraction)(bounds, workArea)
            : (0, dictation_pill_layout_1.edgeAnchorFraction)(side, bounds, workArea);
}
function getDictationPillBounds(side, anchor = electron_1.screen.getCursorScreenPoint()) {
    return dictationPillBoundsOn(electron_1.screen.getDisplayNearestPoint(anchor), side);
}
function dictationPillBoundsOn(display, side) {
    return (0, dictation_pill_layout_1.getDictationPillBounds)(side, (0, dictation_pill_tracking_1.dictationPillWorkArea)(display), DICTATION_PILL_BOTTOM_MARGIN, dictationPillEdgeAnchor);
}
function restoreDictationPillDock() {
    let savedFreePosition = null;
    if (!dictationPillDockLoaded) {
        dictationPillDockLoaded = true;
        const saved = (0, dictation_pill_dock_store_1.getSavedDictationPillDock)();
        if (saved) {
            dictationPillSide = saved.side;
            lastDictationPillDisplayId = saved.displayId ?? null;
            if (saved.anchor !== undefined)
                dictationPillEdgeAnchor = saved.anchor;
            if (saved.x != null && saved.y != null) {
                savedFreePosition = { x: saved.x, y: saved.y };
            }
        }
    }
    // Legacy saves have no display ID; use their coordinates to select the saved display.
    const point = savedFreePosition && lastDictationPillDisplayId == null
        ? savedFreePosition
        : savedDictationPillDisplayPoint();
    if (savedFreePosition)
        redockRestoredDictationPill(savedFreePosition, point);
    return point;
}
function savedDictationPillDisplayPoint() {
    if (lastDictationPillDisplayId == null) {
        return electron_1.screen.getCursorScreenPoint();
    }
    const display = electron_1.screen
        .getAllDisplays()
        .find((item) => item.id === lastDictationPillDisplayId);
    if (!display)
        return electron_1.screen.getCursorScreenPoint();
    return {
        x: display.workArea.x + Math.round(display.workArea.width / 2),
        y: display.workArea.y + Math.round(display.workArea.height / 2),
    };
}
/**
 * Older saves pinned the pill to a screen position, which could be mid-screen
 * and kept it from following the cursor between displays. Fold that position
 * into a docked edge and anchor, and save it back in that shape.
 */
function redockRestoredDictationPill(savedFreePosition, point) {
    const display = electron_1.screen.getDisplayNearestPoint(point);
    const redocked = (0, dictation_pill_position_1.redockSavedDictationPill)({ side: dictationPillSide, ...savedFreePosition }, (0, dictation_pill_tracking_1.dictationPillWorkArea)(display), DICTATION_PILL_BOTTOM_MARGIN);
    dictationPillSide = redocked.side;
    dictationPillEdgeAnchor = redocked.edgeAnchor;
    lastDictationPillDisplayId = display.id;
    (0, dictation_pill_dock_store_1.setSavedDictationPillDock)(redocked.side, display.id, redocked.edgeAnchor);
}
/**
 * Where a newly detached action orb flies from, in screen coordinates.
 *
 * The pill sits at one edge of a much larger transparent host window, so the
 * window's centre is nowhere near it — the orb has to leave the pill itself.
 * This is the same region the hover tracker measures against, so the two can
 * never disagree about where the pill is.
 */
function getDictationPillCenter() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return null;
    const region = (0, dictation_pill_layout_1.getDictationHoverRegion)(dictationPillSide, process.platform, (0, dictation_pill_minimized_1.isDictationPillMinimized)());
    const [winX, winY] = dictationPillWindow.getPosition();
    return { x: winX + region.centerX, y: winY + region.centerY };
}
/**
 * Settings can ask before the pill window exists (Floating pill off at
 * launch), so the saved dock is restored here too instead of only when the
 * window is created.
 */
function getDictationPillSide() {
    if (!dictationPillDockLoaded)
        restoreDictationPillDock();
    return dictationPillSide;
}
// The main window hears it too: Settings shows the pill's edge, and a drag
// changes that edge without going through Settings.
function sendDictationPillSide(side) {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:side", side);
    }
    if (exports.mainWindow && !exports.mainWindow.isDestroyed()) {
        exports.mainWindow.webContents.send("dictation:side", side);
    }
}
// Centre of the visible surface, not the host. A side host's rail sits far
// from that host's own centre, and the destination host is a different shape
// again, so a fraction of the one being left would drop the pill somewhere
// else along its new edge.
function dictationPillVisualCenter(bounds) {
    const visible = (0, dictation_pill_layout_1.getDictationPillVisualBounds)(bounds, dictationPillSide);
    return {
        x: visible.x + visible.width / 2,
        y: visible.y + visible.height / 2,
    };
}
/** The display the pill sits on; the cursor's when the pill is not up. */
function currentDictationPillDisplay() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed()) {
        return electron_1.screen.getDisplayNearestPoint(electron_1.screen.getCursorScreenPoint());
    }
    const center = dictationPillVisualCenter(dictationPillWindow.getBounds());
    return electron_1.screen.getDisplayNearestPoint({
        x: Math.round(center.x),
        y: Math.round(center.y),
    });
}
// Take the new shape under the current visual centre first, so the glide to
// the edge starts from where the pill is rather than jumping there.
function reshapeDictationPillForGlide(start, visualCenter, side, target, workArea) {
    if (start.width === target.width && start.height === target.height) {
        return start;
    }
    const from = (0, dictation_pill_position_1.resizePillAroundVisualCenter)(visualCenter, side, workArea);
    syncDictationPillViewSize(target.width, target.height);
    setDictationPillBounds(from);
    return from;
}
/**
 * Settings picked an edge. The pill docks at that edge's default spot on the
 * display it is on, and the choice is saved even while the pill is hidden.
 */
function setDictationPillSide(side) {
    const display = currentDictationPillDisplay();
    const workArea = (0, dictation_pill_tracking_1.dictationPillWorkArea)(display);
    const plan = (0, dictation_pill_position_1.planDictationPillSideChoice)(side, workArea, DICTATION_PILL_BOTTOM_MARGIN);
    // Measured against the edge being left, so before the side flips below.
    const start = dictationPillWindow && !dictationPillWindow.isDestroyed()
        ? dictationPillWindow.getBounds()
        : null;
    const visualCenter = start ? dictationPillVisualCenter(start) : null;
    dictationPillSide = side;
    dictationPillEdgeAnchor = plan.edgeAnchor;
    lastDictationPillDisplayId = display.id;
    (0, dictation_pill_dock_store_1.setSavedDictationPillDock)(side, display.id, plan.edgeAnchor);
    sendDictationPillSide(side);
    if (!start || !visualCenter)
        return;
    cancelSnapAnimation();
    const from = reshapeDictationPillForGlide(start, visualCenter, side, plan.bounds, workArea);
    animateDictationPillTo(from, plan.bounds);
}
function sendDictationDragging(dragging) {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:dragging", dragging);
    }
}
function syncDictationPillViewSize(width, height) {
    if (!dictationPillView || dictationPillView.webContents.isDestroyed())
        return;
    const current = dictationPillView.getBounds();
    if (current.width === width && current.height === height)
        return;
    dictationPillView.setBounds({ x: 0, y: 0, width, height });
}
const SNAP_ANIM_DURATION_MS = 250;
function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
}
let snapAnimTimer = null;
function cancelSnapAnimation() {
    if (snapAnimTimer) {
        clearInterval(snapAnimTimer);
        snapAnimTimer = null;
    }
}
function settleDictationPillAtPosition(side, display) {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    cancelSnapAnimation();
    const targetDisplay = display ?? electron_1.screen.getDisplayNearestPoint(electron_1.screen.getCursorScreenPoint());
    const start = dictationPillWindow.getBounds();
    const visualCenter = dictationPillVisualCenter(start);
    const workArea = (0, dictation_pill_tracking_1.dictationPillWorkArea)(targetDisplay);
    const plan = (0, dictation_pill_position_1.planDictationPillDrop)({
        side,
        visualCentre: visualCenter,
        workArea,
        bottomMargin: DICTATION_PILL_BOTTOM_MARGIN,
    });
    const target = plan.bounds;
    dictationPillSide = side;
    dictationPillEdgeAnchor = plan.edgeAnchor;
    lastDictationPillDisplayId = targetDisplay.id;
    (0, dictation_pill_dock_store_1.setSavedDictationPillDock)(side, targetDisplay.id, plan.edgeAnchor);
    const from = reshapeDictationPillForGlide(start, visualCenter, side, target, workArea);
    sendDictationPillSide(side);
    animateDictationPillTo(from, target);
}
function animateDictationPillTo(from, target) {
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    if (dx === 0 && dy === 0) {
        setDictationPillBounds(target);
        resumeDictationMouseAfterDrag();
        return;
    }
    const startTime = Date.now();
    snapAnimTimer = setInterval(() => {
        if (!dictationPillWindow || dictationPillWindow.isDestroyed()) {
            cancelSnapAnimation();
            return;
        }
        const t = Math.min((Date.now() - startTime) / SNAP_ANIM_DURATION_MS, 1);
        const e = easeOutCubic(t);
        setDictationPillBounds({
            ...target,
            x: Math.round(from.x + dx * e),
            y: Math.round(from.y + dy * e),
        });
        if (t >= 1) {
            cancelSnapAnimation();
            resumeDictationMouseAfterDrag();
        }
    }, 8);
}
function positionDictationPill() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    if ((0, dictation_pill_layout_1.shouldHoldDictationReposition)({
        dragging: dictationPillDragging,
        snapping: snapAnimTimer != null,
        captionLoopActive: dictationCaptionLoopActive,
    })) {
        return;
    }
    const display = (0, dictation_pill_tracking_1.resolveDictationPillDisplay)();
    const nextBounds = dictationPillBoundsOn(display, dictationPillSide);
    const currentBounds = dictationPillWindow.getBounds();
    const displayChanged = lastDictationPillDisplayId !== display.id;
    const positionChanged = (0, dictation_pill_tracking_1.dictationPillNeedsMove)(currentBounds, nextBounds);
    if (displayChanged || positionChanged) {
        lastDictationPillDisplayId = display.id;
        setDictationPillBounds(nextBounds);
        (0, dictation_pill_tracking_1.recordDictationPillPlacement)(nextBounds, dictationPillWindow.getBounds());
        syncDictationPillViewSize(nextBounds.width, nextBounds.height);
    }
    if (process.platform === "darwin") {
        (0, dictation_accessibility_window_1.positionDictationAccessibilityPrompt)(dictationPillWindow.getBounds(), dictationPillSide);
    }
    (0, dictation_talk_teaser_window_1.positionDictationTalkTeaser)(dictationPillWindow.getBounds(), dictationPillSide);
    (0, dictation_feedback_window_1.positionDictationFeedbackPopover)(dictationPillWindow.getBounds(), dictationPillSide);
    (0, dictation_email_assistant_window_1.positionDictationEmailAssistantNudge)(dictationPillWindow.getBounds(), dictationPillSide);
    (0, dictation_slack_assistant_window_1.positionDictationSlackAssistantNudge)(dictationPillWindow.getBounds(), dictationPillSide);
}
function isDictationPillIntendedVisible() {
    return dictationPillRepositionInterval != null;
}
function rescueWindowsDictationPill() {
    (0, windows_overlay_owner_1.rescueWindowsOverlayWindow)(dictationPillWindow, dictationPillAllowed && isDictationPillIntendedVisible());
}
/**
 * The main window showing, focusing or restoring re-links its owner chain on
 * Windows, which can leave the overlays stacked below ordinary windows with
 * their topmost style intact. Put them back on top each time.
 */
function raiseWindowsDictationOverlays() {
    if (dictationPillAllowed && isDictationPillIntendedVisible()) {
        (0, windows_overlay_owner_1.raiseWindowsOverlay)(dictationPillWindow);
    }
    (0, dictation_action_orb_window_1.raiseDictationActionOrbWindow)();
    (0, dictation_talk_teaser_window_1.raiseDictationTalkTeaser)();
    (0, dictation_feedback_window_1.raiseDictationFeedbackPopover)();
    (0, dictation_email_assistant_window_1.raiseDictationEmailAssistantNudge)();
    (0, dictation_slack_assistant_window_1.raiseDictationSlackAssistantNudge)();
}
function tickDictationPillPosition() {
    rescueWindowsDictationPill();
    (0, dictation_talk_teaser_window_1.rescueDictationTalkTeaser)();
    (0, dictation_feedback_window_1.rescueDictationFeedbackPopover)();
    (0, dictation_email_assistant_window_1.rescueDictationEmailAssistantNudge)();
    (0, dictation_slack_assistant_window_1.rescueDictationSlackAssistantNudge)();
    positionDictationPill();
    // The pill can be dragged to another monitor; the overlay the orbs fly
    // across has to be on that one too.
    (0, dictation_action_orb_window_1.followPillDisplay)(dictationPillWindow && !dictationPillWindow.isDestroyed()
        ? dictationPillWindow.getBounds()
        : null);
}
function startDictationPillRepositionLoop() {
    if (dictationPillRepositionInterval)
        return;
    positionDictationPill();
    dictationPillRepositionInterval = setInterval(tickDictationPillPosition, DICTATION_PILL_REPOSITION_MS);
    (0, dictation_pill_tracking_1.startDictationPillTracking)(tickDictationPillPosition, () => {
        if (isDictationPillIntendedVisible())
            positionDictationPill();
    });
    startDictationPillBackdrop();
}
function stopDictationPillRepositionLoop() {
    if (dictationPillRepositionInterval) {
        clearInterval(dictationPillRepositionInterval);
        dictationPillRepositionInterval = null;
    }
    (0, dictation_pill_tracking_1.stopDictationPillTracking)();
    stopDictationPillBackdrop?.();
    stopDictationPillBackdrop = null;
    lastDictationPillDisplayId = null;
}
let stopDictationPillBackdrop = null;
/** The last call made, pulled by a pill that (re)loads after it was pushed. */
let dictationPillBackdrop = "dark";
function getDictationPillBackdrop() {
    return dictationPillBackdrop;
}
/**
 * Reads the screen under the pill while it is shown, so the idle pill can
 * sit darker over a dark desktop and softer over a light one. Runs with the
 * reposition loop: the same "the pill is on screen" lifetime.
 */
function startDictationPillBackdrop() {
    if (stopDictationPillBackdrop)
        return;
    stopDictationPillBackdrop = (0, dictation_pill_backdrop_sampler_1.startDictationPillBackdropSampling)({
        getRegion: () => dictationPillWindow &&
            !dictationPillWindow.isDestroyed() &&
            dictationPillWindow.isVisible() &&
            !dictationPillDragging
            ? (0, dictation_pill_backdrop_1.dictationPillBackdropRegion)(dictationPillWindow.getBounds(), dictationPillSide, process.platform)
            : null,
        onChange: (backdrop) => {
            dictationPillBackdrop = backdrop;
            if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
                dictationPillView.webContents.send("dictation:pill-backdrop", backdrop);
            }
        },
    });
}
let dictationDragSnapTimer = null;
let dictationDragHighlightTimer = null;
function refreshDictationDragHighlight() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    const bounds = dictationPillWindow.getBounds();
    (0, dictation_pill_overlay_1.updateDictationDragHighlight)(bounds, (0, dictation_pill_layout_1.getDictationPillVisualBounds)(bounds, dictationPillSide));
}
function stopDictationPointerPoll() {
    if (dictationPointerPoll) {
        clearInterval(dictationPointerPoll);
        dictationPointerPoll = null;
    }
}
function captureWinDragOrigin() {
    if (dictationWinDragOrigin)
        return;
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    const { x, y } = dictationPillWindow.getBounds();
    dictationWinDragOrigin = { x, y };
}
function maybeBeginDictationDrag() {
    if (dictationIgnoreMoveEvents)
        return;
    if (dictationPillDragging)
        return;
    // Windows HTCAPTION mouse-down and macOS click-on-drag-region can fire
    // will-move before any real movement. Wait for a move so a click does not
    // flash the overlay.
    captureWinDragOrigin();
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    if (!dictationWinDragOrigin)
        return;
    if (!(0, dictation_pill_layout_1.hasDictationDragMoved)(dictationWinDragOrigin, dictationPillWindow.getBounds())) {
        return;
    }
    beginDictationDrag();
}
function beginDictationDrag() {
    if (dictationPillDragging)
        return;
    dictationPillDragging = true;
    cancelSnapAnimation();
    dictationPillWindow?.setIgnoreMouseEvents(false);
    (0, dictation_pill_overlay_1.showDictationDragOverlay)(dictationPillWindow, { showHomeZone: true });
    sendDictationDragging(true);
    refreshDictationDragHighlight();
    if (!dictationDragHighlightTimer) {
        dictationDragHighlightTimer = setInterval(() => {
            try {
                refreshDictationDragHighlight();
            }
            catch (error) {
                electron_log_1.default.warn("[DictationPill] drag highlight failed:", error);
            }
        }, 50);
    }
    if (process.platform === "darwin" &&
        (0, macos_left_mouse_1.canReadMacLeftMouseButton)() &&
        !dictationPointerPoll) {
        dictationPointerPoll = setInterval(() => {
            try {
                if (!(0, macos_left_mouse_1.isMacLeftMouseDown)())
                    finishDictationDrag();
            }
            catch (error) {
                electron_log_1.default.warn("[DictationPill] mouse poll failed:", error);
            }
        }, 32);
    }
}
function resumeDictationMouseAfterDrag() {
    restoreDictationClickThrough?.();
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    const point = electron_1.screen.getCursorScreenPoint();
    const [x, y] = dictationPillWindow.getPosition();
    const [w, h] = dictationPillWindow.getSize();
    if (point.x > x && point.x < x + w && point.y > y && point.y < y + h) {
        dictationPillWindow.setIgnoreMouseEvents(false);
    }
}
function finishDictationDrag() {
    if (!dictationPillDragging)
        return;
    if (dictationDragSnapTimer) {
        clearTimeout(dictationDragSnapTimer);
        dictationDragSnapTimer = null;
    }
    dictationWinDragOrigin = null;
    dictationCaptionLoopActive = false;
    stopDictationPointerPoll();
    if (dictationDragHighlightTimer) {
        clearInterval(dictationDragHighlightTimer);
        dictationDragHighlightTimer = null;
    }
    dictationPillDragging = false;
    if (!dictationPillWindow || dictationPillWindow.isDestroyed()) {
        (0, dictation_pill_overlay_1.hideDictationDragOverlay)();
        sendDictationDragging(false);
        restoreDictationClickThrough?.();
        return;
    }
    const bounds = dictationPillWindow.getBounds();
    // A side host reserves room inward for its tooltip, so its centre sits far
    // from the rail the user is actually dragging — near a corner that skews the
    // edge choice towards top or bottom. Measure from the visible rail there. A
    // top or bottom host is offset only along the axis it is docked to and its
    // horizontal centre already matches the pill's, so it keeps using the window
    // and its behaviour is unchanged.
    const measured = (0, dictation_pill_layout_1.isDictationPillSideDock)(dictationPillSide)
        ? (0, dictation_pill_layout_1.getDictationPillVisualBounds)(bounds, dictationPillSide)
        : bounds;
    const display = electron_1.screen.getDisplayNearestPoint({
        x: measured.x + measured.width / 2,
        y: measured.y + measured.height / 2,
    });
    const newSide = (0, dictation_pill_position_1.nearestDictationPillSide)(measured, (0, dictation_pill_tracking_1.dictationPillWorkArea)(display));
    (0, dictation_pill_overlay_1.hideDictationDragOverlay)();
    settleDictationPillAtPosition(newSide, display);
    sendDictationDragging(false);
}
function scheduleDragSnap() {
    // A manual drag ends on the renderer's pointer-up, never on stillness —
    // holding the pill still mid-drag must not snap it away under the cursor.
    if (dictationManualDrag)
        return;
    if (dictationDragSnapTimer)
        clearTimeout(dictationDragSnapTimer);
    dictationDragSnapTimer = setTimeout(finishDictationDrag, 240);
}
// Grab-anywhere drag: the renderer reports pointer-down movement past the
// threshold and pointer-up; the main process follows the cursor in between.
let dictationManualDrag = null;
function stopDictationManualDrag() {
    if (!dictationManualDrag)
        return;
    clearInterval(dictationManualDrag.timer);
    dictationManualDrag = null;
}
function startDictationManualDrag() {
    if (dictationPillTeaserActive)
        return;
    // A gesture whose release never reached us would otherwise leave this set
    // and silently mute every drag after it.
    if (dictationManualDrag)
        stopDictationManualDrag();
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    const cursor = electron_1.screen.getCursorScreenPoint();
    const [winX, winY] = dictationPillWindow.getPosition();
    const offsetX = cursor.x - winX;
    const offsetY = cursor.y - winY;
    beginDictationDrag();
    const timer = setInterval(() => {
        if (!dictationPillWindow || dictationPillWindow.isDestroyed()) {
            endDictationManualDrag();
            return;
        }
        const point = electron_1.screen.getCursorScreenPoint();
        dictationPillWindow.setPosition(point.x - offsetX, point.y - offsetY);
    }, 16);
    dictationManualDrag = { timer, offsetX, offsetY };
}
function endDictationManualDrag() {
    if (!dictationManualDrag)
        return;
    stopDictationManualDrag();
    finishDictationDrag();
}
function setupDictationPillDrag() {
    if (!dictationPillWindow)
        return;
    dictationPillWindow.on("will-move", () => {
        maybeBeginDictationDrag();
        if (!dictationPillDragging)
            return;
        refreshDictationDragHighlight();
        if ((0, dictation_pill_layout_1.shouldUseStillnessAsDragEnd)(process.platform, (0, macos_left_mouse_1.canReadMacLeftMouseButton)())) {
            scheduleDragSnap();
        }
    });
    dictationPillWindow.on("moved", () => {
        maybeBeginDictationDrag();
        if (!dictationPillDragging)
            return;
        refreshDictationDragHighlight();
        if ((0, dictation_pill_layout_1.shouldUseStillnessAsDragEnd)(process.platform, (0, macos_left_mouse_1.canReadMacLeftMouseButton)())) {
            scheduleDragSnap();
        }
    });
    if (process.platform === "win32") {
        const WM_ENTERSIZEMOVE = 0x0231;
        const WM_EXITSIZEMOVE = 0x0232;
        dictationPillWindow.hookWindowMessage(WM_ENTERSIZEMOVE, () => {
            dictationCaptionLoopActive = true;
            captureWinDragOrigin();
        });
        dictationPillWindow.hookWindowMessage(WM_EXITSIZEMOVE, () => {
            dictationCaptionLoopActive = false;
            if (dictationPillDragging)
                finishDictationDrag();
            dictationWinDragOrigin = null;
        });
        // Caption click without a move may skip EXITSIZEMOVE. Resume follow-display.
        // Drag regions are non-client (HTCAPTION), so hook both client and NC up.
        const WM_LBUTTONUP = 0x0202;
        const WM_NCLBUTTONUP = 0x00a2;
        const clearCaptionLoopIfIdle = () => {
            if (dictationPillDragging)
                return;
            dictationCaptionLoopActive = false;
            dictationWinDragOrigin = null;
        };
        dictationPillWindow.hookWindowMessage(WM_LBUTTONUP, clearCaptionLoopIfIdle);
        dictationPillWindow.hookWindowMessage(WM_NCLBUTTONUP, clearCaptionLoopIfIdle);
    }
}
// Live window dual-window architecture for mode switching
// We use two host windows and one WebContentsView to preserve state when switching modes.
// The full ("full-screen") view (shown during recording) opens at LIVE_FULL_DEFAULT_*
// docked to the top-right corner for first-time users. Once a user resizes or moves it,
// their chosen size and position are persisted and restored on the next open instead
// (see full-window-bounds-store.ts).
// Default width fits the 910px centered notes column plus the assistant pane
// (40+910+48+400+16); default height gives both panes a comfortable amount of room.
const LIVE_FULL_DEFAULT_WIDTH = 1414;
const LIVE_FULL_DEFAULT_HEIGHT = 867;
// Minimum size the full window can be shrunk to. Kept well below the default (the
// flex layout reflows: the assistant pane narrows/collapses) so the window is
// genuinely resizable, while the floor keeps the 910px notes column readable.
const LIVE_FULL_MIN_WIDTH = 960;
const LIVE_FULL_MIN_HEIGHT = 600;
// Minimum width for the main window (Home / Recording / Notepad all live here in
// the one-window model). Locks the app so no screen can be dragged narrower than
// this comfortable width; height stays freely resizable.
const MAIN_MIN_WIDTH = 1015;
// Timestamp until which full-window "resized"/"moved" events are ignored. Set
// around programmatic setBounds (e.g. positioning on open) so those don't get
// persisted as if the user moved the window. See persistFullWindowBounds.
let suppressFullBoundsSaveUntil = 0;
let liveCompactWindow = null; // Panel type for floating
let liveFullWindow = null; // Normal type for non-floating
let liveBrowserView = null; // The actual content
let placeholderContentView = null; // Reusable empty view to avoid memory leaks
let currentLiveUrl = null; // Track current live window URL for reuse detection
let liveTeardownInProgress = false;
// True once the recording ended and the expanded window swapped to the notepad
// in place. Changes the full window's close behavior from "collapse to compact"
// to a real close (the compact recording bar is meaningless for an ended meeting).
let liveMeetingEndedInPlace = false;
// Global glass manager references
exports.mainGlassManager = null;
exports.liveGlassManager = null;
// Legacy export for backwards compatibility
exports.glassManager = null;
// Display tracking for compact window (module-level for window recreation)
let lastDisplayId = null;
let moveDebounceTimeout = null;
// Helper to check display change and notify renderer
function checkCompactDisplayChange() {
    if (!liveCompactWindow || liveCompactWindow.isDestroyed() || !liveBrowserView)
        return;
    const display = electron_1.screen.getDisplayMatching(liveCompactWindow.getBounds());
    if (lastDisplayId !== null && display.id !== lastDisplayId) {
        liveBrowserView.webContents.send("display-changed", display.scaleFactor, display.id);
    }
    lastDisplayId = display.id;
}
// Keep the content view filling the compact window on every resize. Without
// this the WebContentsView stays at its creation size, so when the user resizes
// a panel card larger than that, the content gets clipped each frame (flicker).
function syncLiveViewToWindow(win) {
    if (!liveBrowserView || win.isDestroyed())
        return;
    const { width, height } = win.getBounds();
    liveBrowserView.setBounds({ x: 0, y: 0, width, height });
}
// Sync the live content view to its current host window. Called right after a
// programmatic resize so the view fills the window without waiting on the
// (platform-dependent) "resize" event.
function syncLiveViewBounds() {
    if (exports.liveWindow)
        syncLiveViewToWindow(exports.liveWindow);
}
function clampToRange(value, min, max) {
    // When the window is larger than the work area, max < min; pin to min.
    return Math.max(min, Math.min(value, Math.max(min, max)));
}
// Where the full ("full-screen") view should open and its minimum size. The
// minimum is the default fitted to the chosen display; the window opens at the
// user's saved size+position if present (never below that minimum, clamped to
// stay on-screen), otherwise at the default docked to the top-right corner.
// Returning both together keeps the bounds and the enforced minimum consistent —
// otherwise a saved size smaller than the minimum would be clamped to a position
// that pushes the (minimum-enforced) window off-screen.
function getFullWindowPlacement(referenceBounds) {
    const saved = (0, full_window_bounds_store_1.getSavedFullWindowBounds)();
    const display = electron_1.screen.getDisplayMatching(saved ?? referenceBounds);
    const wa = display.workArea;
    // Default open size, fitted so it never opens larger than the display.
    const fitted = fitToDisplay(display, LIVE_FULL_DEFAULT_WIDTH, LIVE_FULL_DEFAULT_HEIGHT);
    // Minimum the window can shrink to, never larger than the default (so it still
    // fits on small displays where the default itself was capped down).
    const minWidth = Math.min(LIVE_FULL_MIN_WIDTH, fitted.width);
    const minHeight = Math.min(LIVE_FULL_MIN_HEIGHT, fitted.height);
    // Open at the saved size if present (down to the minimum), otherwise the
    // default; never larger than the work area, so the window and its resize
    // handles stay reachable even if bounds were saved on a bigger, now-gone monitor.
    const width = clampToRange(saved?.width ?? fitted.width, minWidth, wa.width);
    const height = clampToRange(saved?.height ?? fitted.height, minHeight, wa.height);
    // First-time default: dock to the top-right corner. Otherwise restore the
    // saved position, clamped so the window stays on-screen.
    const bounds = saved
        ? {
            x: clampToRange(saved.x, wa.x, wa.x + wa.width - width),
            y: clampToRange(saved.y, wa.y, wa.y + wa.height - height),
            width,
            height,
        }
        : { x: Math.round(wa.x + wa.width - width), y: wa.y, width, height };
    return { bounds, minWidth, minHeight };
}
/**
 * The live bar docks to screen edges exactly like the dictation pill: a drag
 * ends on stillness, the bar snaps to the nearest edge, and the renderer is
 * told which side it lives on so it can go vertical on the rails.
 */
let liveBarDockSide = "top";
let liveBarSnapTimer = null;
let liveBarSnapAnim = null;
let suppressLiveBarMoveUntil = 0;
function getLiveBarDockSide() {
    return liveBarDockSide;
}
function suppressLiveBarMoveTracking(ms) {
    suppressLiveBarMoveUntil = Date.now() + ms;
}
function sendLiveBarSide(side) {
    if (liveBrowserView && !liveBrowserView.webContents.isDestroyed()) {
        liveBrowserView.webContents.send("live-bar:side", side);
    }
}
/** The dictation pill as it is on screen right now, or null while hidden. */
function visibleDictationPill() {
    const pill = dictationPillWindow;
    if (!pill || pill.isDestroyed() || !pill.isVisible())
        return null;
    return { bounds: pill.getBounds(), side: dictationPillSide };
}
/**
 * Where a bar opens. The Universal Pill docks it to the top edge (or the
 * bottom when the dictation pill already holds the top of that display) and
 * records that dock, so later resizes grow from the right side; the legacy bar
 * has no dock and sits flush top-centre.
 */
function openingLiveBarBounds(size, workArea) {
    if (!universalPillEnabled)
        return (0, dictation_live_anchor_1.legacyLiveBarBounds)(size, workArea);
    // Leaving the dock on a stale value would tell the resize logic and the
    // renderer to grow the bar upward from an edge it is not on, stacking
    // panels off the top of the screen.
    liveBarDockSide = (0, dictation_live_anchor_1.liveBarOpeningSide)(visibleDictationPill(), workArea);
    liveBarEdgeAnchor = 0.5;
    sendLiveBarSide(liveBarDockSide);
    return liveBarDockedBounds(liveBarDockSide, size, workArea);
}
/**
 * Where an already-open bar goes when it is brought back: the edge and place
 * along it the user left it on, carried over to the display it is asked for.
 * Only a fresh bar gets the opening dock.
 */
function reopenedLiveBarBounds(size, workArea) {
    if (!universalPillEnabled)
        return (0, dictation_live_anchor_1.legacyLiveBarBounds)(size, workArea);
    return liveBarDockedBounds(liveBarDockSide, size, workArea);
}
function liveBarDockedBounds(side, size, workArea) {
    const margin = dictation_live_anchor_1.LIVE_BAR_DOCK_MARGIN;
    const alongX = workArea.x +
        (0, dictation_pill_layout_1.edgeAnchorOffset)(workArea.width - size.width, liveBarEdgeAnchor);
    switch (side) {
        case "bottom":
            return {
                x: alongX,
                y: workArea.y + workArea.height - size.height - margin,
                width: size.width,
                height: size.height,
            };
        case "top":
            return {
                x: alongX,
                y: workArea.y + margin,
                width: size.width,
                height: size.height,
            };
        // The rail is pinned to the top of a much taller window and the first
        // content resize holds that top, so centre the rail rather than the window.
        case "left":
            return {
                x: workArea.x + margin,
                y: (0, dictation_live_anchor_1.liveBarSideAnchoredY)(liveBarEdgeAnchor, workArea, size.height),
                ...size,
            };
        case "right":
            return {
                x: workArea.x + workArea.width - size.width - margin,
                y: (0, dictation_live_anchor_1.liveBarSideAnchoredY)(liveBarEdgeAnchor, workArea, size.height),
                ...size,
            };
        default: {
            const _exhaustive = side;
            return _exhaustive;
        }
    }
}
function snapLiveBarToSide(side, 
/** A drop keeps where along the edge it landed; an explicit dock centres. */
keepPlaceAlongEdge = false) {
    if (!universalPillEnabled)
        return;
    if (!liveCompactWindow || liveCompactWindow.isDestroyed())
        return;
    if (liveBarSnapAnim) {
        clearInterval(liveBarSnapAnim);
        liveBarSnapAnim = null;
    }
    const start = liveCompactWindow.getBounds();
    const rail = (0, dictation_live_anchor_1.liveBarRailRect)(liveBarDockSide, start);
    const display = electron_1.screen.getDisplayNearestPoint({
        x: rail.x + rail.width / 2,
        y: rail.y + rail.height / 2,
    });
    const target = keepPlaceAlongEdge
        ? (0, dictation_live_anchor_1.liveBarDropBounds)(side, liveBarDockSide, start, display.workArea)
        : liveBarDockedBounds(side, { width: start.width, height: start.height }, display.workArea);
    // Record from where the bar actually landed, not from where it was let go.
    // A drop clamps against the whole window's travel while the anchor measures
    // the rail's, so near an edge the two disagree.
    if (keepPlaceAlongEdge) {
        recordLiveBarAnchor(side, target, display.workArea);
    }
    liveBarDockSide = side;
    sendLiveBarSide(side);
    const startTime = Date.now();
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    suppressLiveBarMoveTracking(SNAP_ANIM_DURATION_MS + 200);
    liveBarSnapAnim = setInterval(() => {
        if (!liveCompactWindow || liveCompactWindow.isDestroyed()) {
            if (liveBarSnapAnim)
                clearInterval(liveBarSnapAnim);
            liveBarSnapAnim = null;
            return;
        }
        const t = Math.min((Date.now() - startTime) / SNAP_ANIM_DURATION_MS, 1);
        const e = easeOutCubic(t);
        suppressLiveBarMoveTracking(300);
        liveCompactWindow.setPosition(Math.round(start.x + dx * e), Math.round(start.y + dy * e));
        if (t >= 1 && liveBarSnapAnim) {
            clearInterval(liveBarSnapAnim);
            liveBarSnapAnim = null;
        }
    }, 8);
}
function finishLiveBarDrag() {
    endLiveBarDragOverlay();
    if (!liveCompactWindow || liveCompactWindow.isDestroyed())
        return;
    const rail = (0, dictation_live_anchor_1.liveBarRailRect)(liveBarDockSide, liveCompactWindow.getBounds());
    const display = electron_1.screen.getDisplayNearestPoint({
        x: rail.x + rail.width / 2,
        y: rail.y + rail.height / 2,
    });
    snapLiveBarToSide((0, dictation_pill_position_1.nearestDictationPillSide)(rail, display.workArea), true);
}
// Grab-anywhere drag for the live bar, mirroring the dictation pill: the
// renderer reports the gesture, the main process follows the cursor, and the
// bar snaps to the nearest edge on release.
let liveBarManualDrag = null;
let liveBarDragHighlight = null;
/** Last seen bar geometry, to tell a drag apart from a content resize. */
let lastCompactBounds = null;
/** The bar docks exactly as the pill does, so it gets the pill's dock chrome. */
function beginLiveBarDragOverlay() {
    // The running highlight loop doubles as "already up for this drag", so this
    // is safe to call from every move event.
    if (liveBarDragHighlight)
        return;
    if (!liveCompactWindow || liveCompactWindow.isDestroyed())
        return;
    (0, dictation_pill_overlay_1.showDictationDragOverlay)(liveCompactWindow);
    refreshLiveBarDragHighlight();
    liveBarDragHighlight = setInterval(() => {
        try {
            refreshLiveBarDragHighlight();
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] drag highlight failed:", error);
        }
    }, 50);
}
function refreshLiveBarDragHighlight() {
    if (!liveCompactWindow || liveCompactWindow.isDestroyed())
        return;
    (0, dictation_pill_overlay_1.updateDictationDragHighlight)((0, dictation_live_anchor_1.liveBarRailRect)(liveBarDockSide, liveCompactWindow.getBounds()));
}
function endLiveBarDragOverlay() {
    if (liveBarDragHighlight) {
        clearInterval(liveBarDragHighlight);
        liveBarDragHighlight = null;
    }
    (0, dictation_pill_overlay_1.hideDictationDragOverlay)();
}
function startLiveBarManualDrag() {
    if (!universalPillEnabled)
        return;
    if (!liveCompactWindow || liveCompactWindow.isDestroyed())
        return;
    // A gesture whose release never reached us would otherwise leave this set
    // and silently mute every drag after it, overlay included.
    if (liveBarManualDrag) {
        clearInterval(liveBarManualDrag);
        liveBarManualDrag = null;
    }
    beginLiveBarDragOverlay();
    const cursor = electron_1.screen.getCursorScreenPoint();
    const origin = (0, dictation_live_anchor_1.liveBarRailOrigin)(liveBarDockSide, liveCompactWindow.getBounds());
    const offsetX = cursor.x - origin.x;
    const offsetY = cursor.y - origin.y;
    liveBarManualDrag = setInterval(() => {
        if (!liveCompactWindow || liveCompactWindow.isDestroyed()) {
            endLiveBarManualDrag();
            return;
        }
        const point = electron_1.screen.getCursorScreenPoint();
        const current = liveCompactWindow.getBounds();
        const rail = (0, dictation_live_anchor_1.liveBarRailOrigin)(liveBarDockSide, current);
        suppressLiveBarMoveTracking(200);
        liveCompactWindow.setPosition(current.x + (point.x - offsetX - rail.x), current.y + (point.y - offsetY - rail.y));
    }, 16);
}
function endLiveBarManualDrag() {
    if (!liveBarManualDrag)
        return;
    clearInterval(liveBarManualDrag);
    liveBarManualDrag = null;
    endLiveBarDragOverlay();
    suppressLiveBarMoveUntil = 0;
    finishLiveBarDrag();
}
/**
 * Live-bar drag and snap run on module-level timers. Teardown has to clear them
 * itself: otherwise a snap scheduled moments before the window closed fires
 * afterwards and moves whatever session replaced it.
 */
function stopLiveBarTimers() {
    if (liveBarSnapTimer) {
        clearTimeout(liveBarSnapTimer);
        liveBarSnapTimer = null;
    }
    if (liveBarSnapAnim) {
        clearInterval(liveBarSnapAnim);
        liveBarSnapAnim = null;
    }
    if (liveBarManualDrag) {
        clearInterval(liveBarManualDrag);
        liveBarManualDrag = null;
    }
    endLiveBarDragOverlay();
    suppressLiveBarMoveUntil = 0;
}
function scheduleLiveBarSnap() {
    if (Date.now() < suppressLiveBarMoveUntil)
        return;
    if (liveBarSnapTimer)
        clearTimeout(liveBarSnapTimer);
    liveBarSnapTimer = setTimeout(finishLiveBarDrag, 240);
}
// A move that did not come through startLiveBarManualDrag (the OS moving the
// window) still has to end docked. Raise the dock chrome from the movement
// itself, but only for a true move: growing a panel also shifts a
// bottom-anchored window, and flashing the dock chrome over a resize reads as
// the bar glitching.
function trackLiveBarDrag() {
    const bounds = liveCompactWindow?.getBounds() ?? null;
    const resized = !!bounds &&
        !!lastCompactBounds &&
        (bounds.width !== lastCompactBounds.width ||
            bounds.height !== lastCompactBounds.height);
    lastCompactBounds = bounds;
    if (!resized && Date.now() >= suppressLiveBarMoveUntil) {
        beginLiveBarDragOverlay();
    }
    scheduleLiveBarSnap();
}
// Handler for compact window moved event
function onCompactWindowMoved() {
    checkCompactDisplayChange();
    if (universalPillEnabled)
        trackLiveBarDrag();
    // Debounce: after no movement for 1 second, add 1px to force re-render
    if (moveDebounceTimeout)
        clearTimeout(moveDebounceTimeout);
    moveDebounceTimeout = setTimeout(() => {
        if (liveCompactWindow && !liveCompactWindow.isDestroyed()) {
            const [width, height] = liveCompactWindow.getSize();
            // Ours, not the user's — mark it so the next move event is not read as
            // the start of a drag.
            suppressLiveBarMoveTracking(300);
            liveCompactWindow.setSize(width + 1, height);
        }
    }, 1000);
}
// Track whether live view is reparented to main window
let liveViewReparentedToMain = false;
let liveViewResizeHandler = null;
// Content protection state (hide windows when screen sharing)
let contentProtectionEnabled = false;
// Zoom level shared across all windows except the floating bar (always 1.0).
// Updated whenever the user zooms the home screen or the full realtime panel.
let sharedZoom = 1;
let restoreMainZoomPending = false;
// Get a default window size so windows size based on the user's resolution, so windows never
// are open larger than the monitor.
function fitToDisplay(display, maxWidth, maxHeight, ratio = 0.95) {
    const wa = display.workArea;
    return {
        width: Math.min(maxWidth, Math.floor(wa.width * ratio)),
        height: Math.min(maxHeight, Math.floor(wa.height * ratio)),
    };
}
// The display under the cursor — where a newly opened live window should land.
function getCursorDisplay() {
    return electron_1.screen.getDisplayNearestPoint(electron_1.screen.getCursorScreenPoint());
}
// The floating bar (compact) always renders at 100%; the full realtime panel
// shares the bounded zoom level used by every other window.
function getLiveZoomBounds() {
    return (0, ipc_1.getCurrentLiveViewMode)() === "compact" ? [1, 1] : [window_zoom_1.MIN_ZOOM, window_zoom_1.MAX_ZOOM];
}
function setContentProtectionEnabled(enabled) {
    contentProtectionEnabled = enabled;
    electron_log_1.default.info("[WINDOWING] Content protection state updated:", enabled);
    // Apply to existing windows
    if (exports.mainWindow && !exports.mainWindow.isDestroyed()) {
        exports.mainWindow.setContentProtection(enabled);
    }
    if (exports.liveWindow && !exports.liveWindow.isDestroyed()) {
        exports.liveWindow.setContentProtection(enabled);
    }
}
function getContentProtectionEnabled() {
    return contentProtectionEnabled;
}
function setMainWindow(window) {
    exports.mainWindow = window;
}
function setRecordingShutdownCoordinator(coordinator) {
    recordingShutdownCoordinator = coordinator;
}
function teardownWebContentsView(view) {
    if (!view)
        return;
    try {
        if (!view.webContents.isDestroyed()) {
            view.webContents.removeAllListeners();
            view.webContents.close();
        }
    }
    catch (error) {
        electron_log_1.default.warn("[LIVE] Failed to teardown WebContentsView:", error);
    }
}
/**
 * Extract the meeting ID from the current live window URL.
 * URL format: .../live/{meetingId}?...
 */
function getCurrentLiveMeetingId() {
    if (!currentLiveUrl || !exports.liveWindow || exports.liveWindow.isDestroyed())
        return null;
    try {
        const url = new URL(currentLiveUrl, "https://local");
        const segments = url.pathname.split("/").filter(Boolean);
        const liveIdx = segments.indexOf("live");
        if (liveIdx !== -1 && segments[liveIdx + 1]) {
            return segments[liveIdx + 1];
        }
    }
    catch {
        // ignore parse errors
    }
    return null;
}
function destroyLiveWindow() {
    if (liveTeardownInProgress)
        return;
    liveTeardownInProgress = true;
    try {
        // If live view is reparented to main, detach it first
        if (liveViewReparentedToMain) {
            detachLiveViewFromMain();
        }
        (0, ipc_1.resetLiveViewMode)();
        setLiveSessionOpen(false);
        currentLiveUrl = null;
        lastDisplayId = null;
        liveMeetingEndedInPlace = false;
        if (moveDebounceTimeout) {
            clearTimeout(moveDebounceTimeout);
            moveDebounceTimeout = null;
        }
        stopLiveBarTimers();
        try {
            if (liveCompactWindow && !liveCompactWindow.isDestroyed()) {
                liveCompactWindow.removeListener("moved", onCompactWindowMoved);
                liveCompactWindow.emit("close");
            }
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to emit close on compact window:", error);
        }
        try {
            if (liveFullWindow && !liveFullWindow.isDestroyed()) {
                liveFullWindow.emit("close");
            }
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to emit close on full window:", error);
        }
        teardownWebContentsView(liveBrowserView);
        liveBrowserView = null;
        teardownWebContentsView(placeholderContentView);
        placeholderContentView = null;
        try {
            if (liveCompactWindow && !liveCompactWindow.isDestroyed()) {
                liveCompactWindow.destroy();
            }
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to destroy compact window:", error);
        }
        try {
            if (liveFullWindow && !liveFullWindow.isDestroyed()) {
                liveFullWindow.destroy();
            }
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to destroy full window:", error);
        }
        liveCompactWindow = null;
        liveFullWindow = null;
        exports.liveWindow = null;
        if (exports.liveGlassManager) {
            exports.liveGlassManager.dispose();
            exports.liveGlassManager = null;
        }
    }
    finally {
        liveTeardownInProgress = false;
    }
}
function createWindow() {
    if ((0, utils_1.isDev)()) {
        electron_log_1.default.info("Development mode: Using metro bundler at http://localhost:8081");
    }
    else {
        // Validate dist folder exists in production using centralized helper
        const distPath = (0, utils_1.getProductionDistPath)();
        if (!distPath) {
            electron_log_1.default.error("[WINDOW] Critical error: Unable to locate production dist folder");
            electron_1.app.exit(1);
            return;
        }
    }
    // Cap the default size to the primary display so the window never opens
    // larger than the screen on smaller monitors.
    const { width: mainWidth, height: mainHeight } = fitToDisplay(electron_1.screen.getPrimaryDisplay(), 1100, 800, 0.9);
    // Create the main window
    exports.mainWindow = new electron_1.BrowserWindow({
        width: mainWidth,
        height: mainHeight,
        // Lock the minimum width so no screen — Home, Recording, or Notepad, all
        // hosted here — can be dragged narrower than this. Capped to the fitted
        // width so it never exceeds a small display. Height stays freely resizable.
        minWidth: Math.min(MAIN_MIN_WIDTH, mainWidth),
        minHeight: 550,
        show: false,
        title: "Fireflies.ai Desktop",
        resizable: true,
        alwaysOnTop: false,
        frame: true,
        skipTaskbar: process.platform === "darwin",
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
        trafficLightPosition: { x: 18, y: 18 },
        transparent: false,
        autoHideMenuBar: true,
        backgroundColor: "#0C0C0D",
        visualEffectState: "active",
        darkTheme: true,
        acceptFirstMouse: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "..", "preload.js"),
            webSecurity: !(0, utils_1.isDev)(), // Keep security enabled for release builds!
            sandbox: !(0, utils_1.isDev)(),
            // Add specific permissions
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            webviewTag: false,
            devTools: (0, utils_1.shouldEnableDevTools)(),
            backgroundThrottling: false,
        },
    });
    electron_1.nativeTheme.themeSource = "dark";
    // Apply content protection if enabled (from persisted settings)
    if (contentProtectionEnabled) {
        exports.mainWindow.setContentProtection(true);
        electron_log_1.default.info("[WINDOWING] Applied content protection to main window on creation");
    }
    // Don't make main window visible on all workspaces - keep it on its assigned screen
    // Initialize glass manager for main window
    exports.mainGlassManager = new glass_manager_1.GlassManager(exports.mainWindow);
    exports.glassManager = exports.mainGlassManager; // Set legacy reference for backwards compatibility
    // Bound page zoom and heal persisted out-of-range zoom on load.
    (0, window_zoom_1.attachZoomControl)(exports.mainWindow.webContents, () => [window_zoom_1.MIN_ZOOM, window_zoom_1.MAX_ZOOM], (z) => {
        sharedZoom = z;
        // Cards render at the same origin zoom; re-size them with the window.
        positionDictationPill();
    });
    // Load the application
    const loadApp = async () => {
        try {
            if ((0, utils_1.isDev)()) {
                await exports.mainWindow.loadURL("http://localhost:8081");
            }
            else if (utils_1.loadURL) {
                await (0, utils_1.loadURL)(exports.mainWindow);
            }
        }
        catch (error) {
            electron_log_1.default.error("[WINDOWING] Initial load failed, retrying in 1s:", error);
            // Retry once — covers slow boot, low memory, protocol not ready yet
            await new Promise((r) => setTimeout(r, 1000));
            try {
                if ((0, utils_1.isDev)()) {
                    await exports.mainWindow.loadURL("http://localhost:8081");
                }
                else if (utils_1.loadURL) {
                    await (0, utils_1.loadURL)(exports.mainWindow);
                }
            }
            catch (retryError) {
                electron_log_1.default.error("[WINDOWING] Retry also failed:", retryError);
            }
        }
    };
    loadApp();
    // Restore regular activation policy after window is ready to maintain dock icon
    exports.mainWindow.once("ready-to-show", () => {
        // Check if app was launched with --hidden flag (auto-launched at startup)
        const isHiddenLaunch = process.argv.includes("--hidden");
        const shouldStartMinimizedAfterUpdate = (0, restart_state_1.consumeStartMinimizedAfterUpdateRestart)();
        // Only show window if not launched in a minimized/hidden state
        if (!isHiddenLaunch && !shouldStartMinimizedAfterUpdate) {
            exports.mainWindow?.show();
        }
        else {
            exports.mainWindow?.hide();
            exports.mainWindow?.setSkipTaskbar(true);
            electron_log_1.default.info("[WINDOWING] App launched minimized/hidden, keeping window hidden", { isHiddenLaunch, shouldStartMinimizedAfterUpdate });
        }
    });
    // Handle loading errors
    exports.mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
        electron_log_1.default.error(`Failed to load: ${errorDescription} (${errorCode})`);
        // You could add logic here to reload the page or display an error
    });
    exports.mainWindow.on("close", (0, recording_shutdown_1.createRecordingAwareWindowCloseHandler)({
        isAppQuitting: () => !!electron_1.app.isQuitting,
        getShutdownCoordinator: () => recordingShutdownCoordinator,
        closeAfterShutdown: () => {
            if (exports.mainWindow && !exports.mainWindow.isDestroyed()) {
                exports.mainWindow.close();
            }
        },
        hideWindow: () => {
            try {
                exports.mainWindow?.hide();
                exports.mainWindow?.setSkipTaskbar(true);
            }
            catch (error) {
                electron_log_1.default.error("[WINDOW] Failed to minimize main window", error);
            }
        },
    }));
    // Clean up glass manager when window is destroyed
    exports.mainWindow.on("closed", () => {
        if (exports.mainGlassManager) {
            // Check if glassManager is pointing to mainGlassManager BEFORE disposing
            const shouldUpdateLegacyRef = exports.glassManager === exports.mainGlassManager;
            exports.mainGlassManager.dispose();
            exports.mainGlassManager = null;
            // Update legacy reference to point to live glass manager
            if (shouldUpdateLegacyRef) {
                exports.glassManager = exports.liveGlassManager;
            }
        }
    });
    exports.mainWindow.on("closed", function () {
        exports.mainWindow = null;
    });
    exports.mainWindow.on("show", () => {
        // Send resume signal to renderer to restart glass syncing
        exports.mainWindow?.webContents.send("resume-glass-sync");
        // Restore the shared zoom on return from a live session.
        if (restoreMainZoomPending && exports.mainWindow && !exports.mainWindow.isDestroyed()) {
            exports.mainWindow.webContents.setZoomFactor(sharedZoom);
            restoreMainZoomPending = false;
        }
        raiseWindowsDictationOverlays();
    });
    exports.mainWindow.on("hide", () => {
        // Send stop signal to renderer to pause glass syncing
        exports.mainWindow?.webContents.send("stop-glass-sync");
        rescueWindowsDictationPill();
        (0, dictation_action_orb_window_1.rescueDictationActionOrbWindow)();
    });
    exports.mainWindow.on("focus", () => {
        // Send window focus signal to renderer for data refresh
        exports.mainWindow?.webContents.send("window-focus");
        raiseWindowsDictationOverlays();
    });
    exports.mainWindow.on("blur", () => {
        // Send window blur signal to renderer (e.g., to close popovers)
        exports.mainWindow?.webContents.send("window-blur");
    });
    exports.mainWindow.on("minimize", () => {
        exports.mainWindow?.webContents.send("window-minimize");
        rescueWindowsDictationPill();
        (0, dictation_action_orb_window_1.rescueDictationActionOrbWindow)();
    });
    exports.mainWindow.on("restore", () => {
        exports.mainWindow?.webContents.send("window-restore");
        raiseWindowsDictationOverlays();
    });
    // macOS hides the traffic lights in native fullscreen; the renderer uses this
    const broadcastMainFullscreen = (isFullscreen) => {
        exports.mainWindow?.webContents.send("window-fullscreen-change", isFullscreen);
        if (liveViewReparentedToMain) {
            liveBrowserView?.webContents.send("window-fullscreen-change", isFullscreen);
        }
    };
    exports.mainWindow.on("enter-full-screen", () => broadcastMainFullscreen(true));
    exports.mainWindow.on("leave-full-screen", () => broadcastMainFullscreen(false));
    exports.mainWindow.webContents.on("context-menu", (_event, params) => {
        const template = (0, main_window_context_menu_1.buildMainWindowContextMenu)(params);
        if (template)
            electron_1.Menu.buildFromTemplate(template).popup();
    });
    // Load stored deep link if app was opened via deep link
    if (navigation_1.deeplinkUrl) {
        exports.mainWindow.webContents.once("did-finish-load", () => {
            electron_log_1.default.info("[DEEPLINK] Loading stored deep link:", navigation_1.deeplinkUrl);
            if (exports.mainWindow && navigation_1.deeplinkUrl) {
                const targetUrl = (0, utils_1.getUrlToLoad)(navigation_1.deeplinkUrl);
                electron_log_1.default.info("[DEEPLINK] Loading stored URL:", targetUrl);
                exports.mainWindow.loadURL(targetUrl);
                // Clear the stored URL after using it
                (0, navigation_1.setDeeplinkUrl)(null);
            }
        });
    }
    // Setup navigation handlers
    (0, navigation_1.setupNavigationHandlers)(exports.mainWindow.webContents, createChildWindow, {
        enableGoBack: true,
        getMainWindow: () => exports.mainWindow,
        showMainWindow,
        // The main window hosts the live/recording view in place (one-window model);
        // never let an in-page /live navigation spawn the floating live window.
        keepLiveInPlace: true,
    });
}
/**
 * True while the live bar is docked to the bottom edge: its window has to
 * keep its foot planted and grow upward, not downward from a fixed top.
 */
function isLiveBarBottomAnchored(win) {
    return (universalPillEnabled &&
        win === liveCompactWindow &&
        (0, dictation_live_anchor_1.liveBarGrowsUpward)(liveBarDockSide));
}
/** True while the live bar is docked to a screen side (vertical rail). */
function isLiveBarSideDocked(win) {
    return (universalPillEnabled &&
        win === liveCompactWindow &&
        (liveBarDockSide === "left" || liveBarDockSide === "right"));
}
/** Which edge a live-bar resize must hold still, or null for the default. */
function liveBarResizeAnchor(win) {
    if (!universalPillEnabled || win !== liveCompactWindow)
        return null;
    if (liveBarDockSide === "left" || liveBarDockSide === "right") {
        return liveBarDockSide;
    }
    // Top and bottom docks stack panels above or below the bar and can sit
    // anywhere along their edge, so holding the window's centre is what keeps
    // the bar still as panels open.
    return null;
}
/** The meeting pill's notes badge action: bring the live bar back. */
function showLiveBarFromPill() {
    if (!liveMeetingActive)
        return;
    if (liveCompactWindow && !liveCompactWindow.isDestroyed()) {
        void (0, ipc_1.applyLiveViewMode)("compact");
        return;
    }
    const meetingId = (0, recording_context_store_1.getRecordingContextSnapshot)()?.meetingId;
    if (!meetingId)
        return;
    createChildWindow(`/live/${meetingId}`, true, "compact");
}
/**
 * While the "Try Talk" card is up the pill rests as an inert sliver: the card
 * rides beside it, and the host is pinned so no gesture can drag it away from
 * under the card. The renderer ignores hover and clicks on its own.
 */
let dictationPillTeaserActive = false;
function isDictationPillTeaserActive() {
    return dictationPillTeaserActive;
}
/**
 * The introduction takes the pill over while it shows, so it is the one card
 * the permission guide checks for before standing down.
 */
function isDictationIntroCardUp() {
    return dictationTeaserContent?.variant === "intro";
}
function pillCardEdgeState() {
    return {
        teaser: dictationTeaserContent?.variant ?? null,
        feedbackActive: dictationFeedbackPopoverActive,
        emailAssistantActive: !!dictationEmailAssistantNudgeProvider,
        slackAssistantActive: dictationSlackAssistantNudgeActive,
        guideOpen: (0, dictation_accessibility_window_1.isDictationAccessibilityPromptOpen)(),
    };
}
/** Which of the pill-anchored cards may be up — see the rules module. */
function pillCardOwner() {
    return (0, dictation_pill_card_edge_1.dictationPillCardOwner)(pillCardEdgeState());
}
function sendDictationPillTeaser() {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:teaser", dictationPillTeaserActive);
    }
}
function syncDictationTalkTeaser() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    dictationPillWindow.setMovable(!dictationPillTeaserActive);
    if (!dictationPillWindow.isVisible() || pillCardOwner() !== "teaser") {
        (0, dictation_talk_teaser_window_1.hideDictationTalkTeaser)();
        return;
    }
    (0, dictation_talk_teaser_window_1.showDictationTalkTeaser)(dictationPillWindow.getBounds(), dictationPillSide, sendDictationTeaserShown);
}
/** The card is actually on screen; the main window records the impression. */
function sendDictationTeaserShown() {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:teaser-shown");
}
/**
 * One registration for every pill-anchored card — the module stores a single
 * prompt-closed callback, so separate registrations would overwrite each
 * other. The cards that have lost the edge sync first, so a handover never
 * leaves two of them on screen together.
 */
function syncDictationPillCards() {
    const owner = pillCardOwner();
    const syncs = {
        teaser: syncDictationTalkTeaser,
        feedback: syncDictationFeedbackPopover,
        emailAssistant: syncDictationEmailAssistantNudge,
        slackAssistant: syncDictationSlackAssistantNudge,
    };
    for (const [card, sync] of Object.entries(syncs)) {
        if (card !== owner)
            sync();
    }
    if (owner)
        syncs[owner]();
}
(0, dictation_accessibility_window_1.onDictationAccessibilityPromptClosed)(syncDictationPillCards);
function setDictationPillTeaserActive(active) {
    if (active) {
        setDictationTeaserContent({ variant: "intro" });
        return;
    }
    // Presence owns the introduction and nothing else. A nudge belongs to the
    // renderer that queued it, and clearing it here would take it off the pill
    // for good: the renderer only sends content when its own value changes, so
    // an unchanged pending milestone would never put it back.
    if (dictationTeaserContent?.variant === "intro") {
        setDictationTeaserContent(null);
    }
}
/** What the card beside the pill is showing, or null when there is no card. */
let dictationTeaserContent = null;
const sameTeaserContent = (a, b) => a?.variant === b?.variant && a?.milestone === b?.milestone;
function setDictationTeaserContent(content) {
    if (sameTeaserContent(dictationTeaserContent, content))
        return;
    dictationTeaserContent = content;
    // The intro takes the pill over while it shows; a nudge sits beside a pill
    // that still works, so the user can carry on and ignore it.
    const introUp = content?.variant === "intro";
    if (dictationPillTeaserActive !== introUp) {
        dictationPillTeaserActive = introUp;
        sendDictationPillTeaser();
    }
    // Only the introduction displaces the passive guide, because it takes the
    // pill over and leaves the guide nothing to point at. A nudge yields to the
    // guide instead: dismissing it for a card the user can ignore would take the
    // permission away until the nudge is cleared.
    if (introUp)
        (0, dictation_accessibility_window_1.hideDictationAccessibilityPrompt)();
    else
        restoreDictationAccessibilityPrompt();
    sendDictationTeaserContent();
    syncDictationPillCards();
}
function restoreDictationAccessibilityPrompt() {
    if (process.platform !== "darwin")
        return;
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    if (!dictationPillWindow.isVisible())
        return;
    (0, dictation_accessibility_window_1.showDictationAccessibilityPromptIfNeeded)(dictationPillWindow.getBounds(), dictationPillSide);
}
function getDictationTeaserContent() {
    return dictationTeaserContent;
}
function sendDictationTeaserContent() {
    (0, dictation_talk_teaser_window_1.sendDictationTalkTeaserContent)(dictationTeaserContent);
}
/** The card's Try or close, relayed to the main window that owns the flow. */
function sendDictationTeaserAction(action) {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:teaser-action", action);
}
/**
 * The tenth-dictation feedback offer is a second pill-anchored card. Unlike
 * the teaser it is focusable (its details step takes typed text), and it
 * shares the pill's edges with the teaser, so the two are never up together.
 * It yields to the introduction and displaces a nudge, which comes back
 * through sync once the offer is gone.
 */
let dictationFeedbackPopoverActive = false;
function setDictationFeedbackPopoverActive(active) {
    if (dictationFeedbackPopoverActive === active)
        return;
    dictationFeedbackPopoverActive = active;
    // Every card, not just this one: a card holding the edge has to step aside
    // for the offer, and it is owed the edge back once the offer is gone.
    syncDictationPillCards();
}
/**
 * Dictation-state transitions around the dictation-driven cards: starting a
 * dictation cancels a card that is still loading so it cannot reveal
 * mid-recording (the offer stays active and re-shows below), and returning to
 * idle syncs it.
 */
function syncPillCardsForPillState(wasIdle, state) {
    if (wasIdle && state !== "idle") {
        if (!(0, dictation_feedback_window_1.isDictationFeedbackPopoverVisible)())
            (0, dictation_feedback_window_1.hideDictationFeedbackPopover)();
        if (!(0, dictation_email_assistant_window_1.isDictationEmailAssistantNudgeVisible)()) {
            (0, dictation_email_assistant_window_1.hideDictationEmailAssistantNudge)();
        }
        if (!(0, dictation_slack_assistant_window_1.isDictationSlackAssistantNudgeVisible)()) {
            (0, dictation_slack_assistant_window_1.hideDictationSlackAssistantNudge)();
        }
    }
    if (!wasIdle && state === "idle") {
        syncDictationFeedbackPopover();
        syncDictationEmailAssistantNudge();
        syncDictationSlackAssistantNudge();
    }
}
function syncDictationFeedbackPopover() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    if (!dictationPillWindow.isVisible() || pillCardOwner() !== "feedback") {
        (0, dictation_feedback_window_1.hideDictationFeedbackPopover)();
        return;
    }
    // The card waits for the dictation to finish rather than interrupting
    // it; an open card stays open.
    if ((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)(dictationPillState, (0, dictation_feedback_window_1.isDictationFeedbackPopoverVisible)())) {
        return;
    }
    (0, dictation_feedback_window_1.showDictationFeedbackPopover)(dictationPillWindow.getBounds(), dictationPillSide, sendDictationFeedbackPopoverShown);
}
/** The card is actually on screen; the main window records the impression. */
function sendDictationFeedbackPopoverShown() {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:feedback-popover-shown");
}
/** The card's dismiss or submit, relayed to the main window that owns it. */
function sendDictationFeedbackAction(action) {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:feedback-action", action);
}
let dictationEmailAssistantNudgeProvider = null;
function getDictationEmailAssistantNudgeProvider() {
    return dictationEmailAssistantNudgeProvider;
}
function setDictationEmailAssistantNudgeActive(provider) {
    if (dictationEmailAssistantNudgeProvider === provider)
        return true;
    if (provider && !canOfferCardTakeEdge("emailAssistant")) {
        electron_log_1.default.info("[DictationPill] Email Assistant nudge turned away: edge taken");
        return false;
    }
    dictationEmailAssistantNudgeProvider = provider;
    syncDictationPillCards();
    return true;
}
function canOfferCardTakeEdge(card) {
    if (!dictationPillWindow ||
        dictationPillWindow.isDestroyed() ||
        !dictationPillWindow.isVisible()) {
        return false;
    }
    return (0, dictation_pill_card_edge_1.offerCardTakesPillEdge)(card, pillCardEdgeState());
}
function syncDictationEmailAssistantNudge() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    if (!dictationPillWindow.isVisible() ||
        pillCardOwner() !== "emailAssistant") {
        (0, dictation_email_assistant_window_1.hideDictationEmailAssistantNudge)();
        return;
    }
    if ((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)(dictationPillState, (0, dictation_email_assistant_window_1.isDictationEmailAssistantNudgeVisible)())) {
        return;
    }
    (0, dictation_email_assistant_window_1.showDictationEmailAssistantNudge)(dictationPillWindow.getBounds(), dictationPillSide, sendDictationEmailAssistantNudgeShown);
}
function sendDictationEmailAssistantNudgeShown() {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:email-assistant-nudge-shown");
}
/** The card's Connect or close, relayed to the main window that owns the offer. */
function sendDictationEmailAssistantNudgeAction(action) {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:email-assistant-nudge-action", action);
}
let dictationSlackAssistantNudgeActive = false;
function setDictationSlackAssistantNudgeActive(active) {
    if (dictationSlackAssistantNudgeActive === active)
        return true;
    if (active && !canOfferCardTakeEdge("slackAssistant")) {
        electron_log_1.default.info("[DictationPill] Slack Assistant nudge turned away: edge taken");
        return false;
    }
    dictationSlackAssistantNudgeActive = active;
    syncDictationPillCards();
    return true;
}
function syncDictationSlackAssistantNudge() {
    if (!dictationPillWindow || dictationPillWindow.isDestroyed())
        return;
    if (!dictationPillWindow.isVisible() ||
        pillCardOwner() !== "slackAssistant") {
        (0, dictation_slack_assistant_window_1.hideDictationSlackAssistantNudge)();
        return;
    }
    if ((0, dictation_feedback_hold_1.shouldHoldFeedbackPopoverForDictation)(dictationPillState, (0, dictation_slack_assistant_window_1.isDictationSlackAssistantNudgeVisible)())) {
        return;
    }
    (0, dictation_slack_assistant_window_1.showDictationSlackAssistantNudge)(dictationPillWindow.getBounds(), dictationPillSide, sendDictationSlackAssistantNudgeShown);
}
function sendDictationSlackAssistantNudgeShown() {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:slack-assistant-nudge-shown");
}
/** The card's Connect or close, relayed to the main window that owns the offer. */
function sendDictationSlackAssistantNudgeAction(action) {
    if (!exports.mainWindow || exports.mainWindow.isDestroyed())
        return;
    exports.mainWindow.webContents.send("dictation:slack-assistant-nudge-action", action);
}
// Mirrors dictation-shortcut's view of whether the pill belongs on screen.
// It pushes the value down because it already depends on this module.
let dictationPillAllowed = false;
function setDictationPillAllowed(allowed) {
    dictationPillAllowed = allowed;
}
// The Universal Pill made the live bar dock and drag like the dictation pill.
// It ships behind the dictation flag: without it the bar is the pre-pill one,
// flush top-centre, and none of that machinery runs.
let universalPillEnabled = false;
function setUniversalPillEnabled(enabled) {
    if (universalPillEnabled === enabled)
        return;
    universalPillEnabled = enabled;
    refitLiveCompactWindow();
}
/**
 * The flag can flip mid-meeting (the poll, or a sign-in), and the renderer
 * swaps bars on the spot. The window has to follow, or the Universal Pill bar
 * is clamped to the legacy floor and the legacy bar is left on a dock it does
 * not know: give it the floor the mounted bar expects and open it where that
 * bar opens. A hidden bar (full mode) is placed again when it next shows.
 */
function refitLiveCompactWindow() {
    const bar = liveCompactWindow;
    if (!bar || bar.isDestroyed())
        return;
    const compact = fitToDisplay(getCursorDisplay(), 1100, 560);
    const compactMin = (0, dictation_live_anchor_1.liveCompactWindowMinSize)(universalPillEnabled, compact);
    bar.setMinimumSize(compactMin.minWidth, compactMin.minHeight);
    if (!bar.isVisible())
        return;
    const bounds = bar.getBounds();
    const size = {
        width: Math.max(bounds.width, compactMin.minWidth),
        height: Math.max(bounds.height, compactMin.minHeight),
    };
    const workArea = electron_1.screen.getDisplayMatching(bounds).workArea;
    bar.setBounds(openingLiveBarBounds(size, workArea), false);
}
// Whether a meeting is on for the pill to stand in for. The rules live in
// meeting-presence; this holds the value and pushes every change to the pill.
let meetingPresence = meeting_presence_1.NO_MEETING;
let liveMeetingActive = false;
function sendDictationMeetingActive() {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:meeting", liveMeetingActive);
    }
}
function isLiveMeetingActive() {
    return liveMeetingActive;
}
function applyMeetingPresence(next) {
    meetingPresence = next;
    const active = (0, meeting_presence_1.isMeetingPresent)(next);
    if (active === liveMeetingActive)
        return;
    liveMeetingActive = active;
    sendDictationMeetingActive();
}
function setLiveSessionOpen(open) {
    if (!open)
        setMeetingTranscribing(false);
    applyMeetingPresence((0, meeting_presence_1.withSessionOpen)(meetingPresence, open));
}
let dictationPillCardRepositionTimer = null;
function setDictationPillMinimized(minimized) {
    if (!(0, dictation_pill_minimized_1.setDictationPillMinimizedState)(minimized))
        return;
    if (dictationPillCardRepositionTimer) {
        clearTimeout(dictationPillCardRepositionTimer);
        dictationPillCardRepositionTimer = null;
    }
    sendDictationPillMinimized();
    // Shrinking: the cards follow the pill only once the shell has finished
    // shrinking, or they would overlap it for the whole morph.
    if (minimized) {
        dictationPillCardRepositionTimer = setTimeout(() => {
            dictationPillCardRepositionTimer = null;
            positionDictationPill();
        }, dictation_pill_layout_1.DICTATION_PILL_REST_MORPH_MS);
        return;
    }
    positionDictationPill();
}
function sendDictationPillMinimized() {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:pill-minimized", (0, dictation_pill_minimized_1.isDictationPillMinimized)());
    }
}
function sendDictationPasteFallbackToast() {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:paste-fallback-toast");
    }
}
/** Transcript activity, mirrored to the pill so its meter matches the bar's. */
let meetingTranscribing = false;
function setMeetingTranscribing(transcribing) {
    if (meetingTranscribing === transcribing)
        return;
    meetingTranscribing = transcribing;
    sendDictationMeetingActivity();
}
function sendDictationMeetingActivity() {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:meeting-activity-changed", meetingTranscribing);
    }
}
/** Driven by the recording context the main window syncs — the tray's signal. */
function setMeetingRecordingActive(active, meetingId) {
    applyMeetingPresence((0, meeting_presence_1.withRecording)(meetingPresence, active, meetingId));
}
/** The meeting is over, however it ended and wherever its notepad lands. */
function markLiveMeetingEnded(meetingId) {
    applyMeetingPresence((0, meeting_presence_1.withMeetingEnded)(meetingPresence, meetingId));
}
// Create the dual-window setup for live mode (compact panel + full normal window)
function createLiveDualWindowSetup(url, initialMode) {
    // Ensure clean state regardless of how previous session ended
    (0, ipc_1.resetLiveViewMode)();
    // Restore the view mode the user last selected (compact bar vs full window),
    // unless the caller forces one (e.g. popping out the compact Live Assist bar
    // from the one-window recording view). The setup is built around compact;
    // full is reached via a mode switch below.
    const preferredMode = initialMode ?? (0, live_view_mode_store_1.getPreferredLiveViewMode)() ?? "compact";
    // Common web preferences for both windows
    const webPreferences = {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "..", "preload.js"),
        webSecurity: !(0, utils_1.isDev)(),
        sandbox: !(0, utils_1.isDev)(),
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        backgroundThrottling: false,
        devTools: (0, utils_1.shouldEnableDevTools)(),
    };
    // Width: 1100px to accommodate header (470px) + side-by-side menus
    // (280+280+gutters), capped to the display so it fits narrow monitors.
    const compact = fitToDisplay(getCursorDisplay(), 1100, 560);
    const compactMin = (0, dictation_live_anchor_1.liveCompactWindowMinSize)(universalPillEnabled, compact);
    // Create compact mode window (panel type for floating)
    liveCompactWindow = new electron_1.BrowserWindow({
        width: compact.width,
        height: compact.height,
        minWidth: compactMin.minWidth,
        minHeight: compactMin.minHeight,
        type: "panel",
        show: false,
        maximizable: false,
        // The floating bar is a fixed-size panel — never user-resizable. Panel-card
        // drag handles still resize it programmatically via window-resize-to-content.
        resizable: false,
        fullscreenable: false,
        alwaysOnTop: true,
        frame: false,
        skipTaskbar: false,
        titleBarStyle: "hiddenInset",
        title: "Live Assist",
        transparent: true,
        hasShadow: false,
        webPreferences,
    });
    // Cap the full panel to the screen so it never opens larger than the monitor
    // (which broke rendering on small laptops).
    const full = fitToDisplay(getCursorDisplay(), LIVE_FULL_DEFAULT_WIDTH, LIVE_FULL_DEFAULT_HEIGHT);
    // Minimum is a real floor below the default so the window is user-resizable,
    // never larger than the (possibly capped) default on small displays.
    const fullMinWidth = Math.min(LIVE_FULL_MIN_WIDTH, full.width);
    const fullMinHeight = Math.min(LIVE_FULL_MIN_HEIGHT, full.height);
    // Create full mode window (normal type for non-floating)
    liveFullWindow = new electron_1.BrowserWindow({
        width: full.width,
        height: full.height,
        minWidth: fullMinWidth,
        minHeight: fullMinHeight,
        show: false,
        maximizable: true,
        resizable: true,
        fullscreenable: true,
        alwaysOnTop: false,
        frame: true,
        skipTaskbar: false,
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
        autoHideMenuBar: true,
        title: "Live Assist",
        transparent: process.platform === "darwin",
        trafficLightPosition: { x: 18, y: 18 },
        vibrancy: "menu",
        visualEffectState: "active",
        darkTheme: true,
        hasShadow: true,
        webPreferences,
    });
    // Create the WebContentsView that holds the actual content
    liveBrowserView = new electron_1.WebContentsView({
        webPreferences,
    });
    // Ensure WebContentsView was created successfully
    if (!liveBrowserView) {
        electron_log_1.default.error("[LIVE] Failed to create WebContentsView");
        return;
    }
    // Create a reusable placeholder view to avoid creating new ones on each switch
    placeholderContentView = new electron_1.WebContentsView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Start with compact mode (panel window)
    exports.liveWindow = liveCompactWindow;
    setLiveSessionOpen(true);
    liveCompactWindow.setContentView(liveBrowserView);
    // Set BrowserView bounds to fill the window
    const bounds = liveCompactWindow.getBounds();
    liveBrowserView.setBounds({
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height,
    });
    // Load the URL in the BrowserView
    liveBrowserView.webContents.loadURL(url);
    // Setup navigation handlers for live window (opens external URLs in browser)
    (0, navigation_1.setupNavigationHandlers)(liveBrowserView.webContents, createChildWindow, {
        getMainWindow: () => exports.mainWindow,
        showMainWindow,
    });
    // Only the full panel feeds sharedZoom — the bar's forced 1.0 must not
    // become the global level.
    (0, window_zoom_1.attachZoomControl)(liveBrowserView.webContents, getLiveZoomBounds, (z) => {
        if ((0, ipc_1.getCurrentLiveViewMode)() === "full")
            sharedZoom = z;
    });
    // Apply content protection if enabled
    if (contentProtectionEnabled) {
        liveCompactWindow.setContentProtection(true);
        liveFullWindow.setContentProtection(true);
    }
    // Setup compact window
    (0, macos_spaces_1.keepWindowOnActiveSpace)(liveCompactWindow);
    if (process.platform === "darwin") {
        liveCompactWindow.setWindowButtonVisibility(false);
    }
    // Setup full window
    if (process.platform === "darwin") {
        liveFullWindow.setVisibleOnAllWorkspaces(false);
        liveFullWindow.setWindowButtonVisibility(true);
    }
    try {
        const display = electron_1.screen.getDisplayNearestPoint(electron_1.screen.getCursorScreenPoint());
        liveCompactWindow.setBounds(openingLiveBarBounds({ width: bounds.width, height: bounds.height }, display.workArea), false);
    }
    catch (error) {
        electron_log_1.default.warn("[LIVE] Failed to position compact window:", error);
    }
    liveCompactWindow.on("closed", destroyLiveWindow);
    // Closing the full RTP window returns to the compact live bar instead of
    // ending the session. Minimize keeps its native behavior (handled by the OS).
    // Allow the real close through during teardown or an app quit. Once the
    // meeting ended and the notepad is shown in place, a close returns home.
    liveFullWindow.on("close", (event) => {
        const appWithQuitFlag = electron_1.app;
        if (appWithQuitFlag.isQuitting || liveTeardownInProgress)
            return;
        if (liveMeetingEndedInPlace) {
            if (exports.mainWindow && !exports.mainWindow.isDestroyed()) {
                electron_log_1.default.info("[LIVE] Navigating main window to home after in-place notepad close");
                exports.mainWindow.webContents.send("navigate-to-home");
            }
            if (process.platform === "darwin") {
                electron_1.app.focus({ steal: true });
            }
            showMainWindow();
            return;
        }
        event.preventDefault();
        void (0, ipc_1.applyLiveViewMode)("compact");
    });
    liveFullWindow.on("closed", () => {
        const endedInPlace = liveMeetingEndedInPlace;
        destroyLiveWindow();
        if (endedInPlace) {
            if (process.platform === "darwin") {
                electron_1.app.focus({ steal: true });
            }
            showMainWindow();
        }
    });
    // Send window-blur to the BrowserView when either live window loses focus
    liveCompactWindow.on("blur", () => {
        liveBrowserView?.webContents.send("window-blur");
    });
    liveFullWindow.on("blur", () => {
        liveBrowserView?.webContents.send("window-blur");
    });
    liveFullWindow.on("enter-full-screen", () => {
        liveBrowserView?.webContents.send("window-fullscreen-change", true);
    });
    liveFullWindow.on("leave-full-screen", () => {
        liveBrowserView?.webContents.send("window-fullscreen-change", false);
    });
    // Keep the content view filling the full window as the user resizes it.
    liveFullWindow.on("resize", () => syncLiveViewToWindow(liveFullWindow));
    // Persist the user's chosen full-view size and position once a manual resize or
    // move settles. On macOS "resized"/"moved" also fire for programmatic setBounds,
    // so we ignore events within suppressFullBoundsSaveUntil of positioning on open —
    // otherwise the first-time default would be persisted and clobber the fresh
    // top-right default on later opens.
    const persistFullWindowBounds = () => {
        if (!liveFullWindow || liveFullWindow.isDestroyed())
            return;
        // Don't persist native-fullscreen bounds (the whole display): quitting via
        // Cmd+Q while fullscreen would otherwise reopen the window maximized-looking.
        if (liveFullWindow.isFullScreen())
            return;
        if (Date.now() < suppressFullBoundsSaveUntil)
            return;
        (0, full_window_bounds_store_1.saveFullWindowBounds)(liveFullWindow.getBounds());
    };
    liveFullWindow.on("resized", persistFullWindowBounds);
    liveFullWindow.on("moved", persistFullWindowBounds);
    // Initialize display tracking
    const initialDisplay = electron_1.screen.getDisplayMatching(liveCompactWindow.getBounds());
    lastDisplayId = initialDisplay.id;
    // Add moved handler for display change tracking
    liveCompactWindow.on("moved", onCompactWindowMoved);
    // Keep the content view filling the window as the user resizes panel cards
    liveCompactWindow.on("resize", () => syncLiveViewToWindow(liveCompactWindow));
    // Initialize glass manager for compact window
    exports.liveGlassManager = new glass_manager_1.GlassManager(liveCompactWindow);
    // Enable alpha-based mouse passthrough
    try {
        // Pass the WebContentsView's webContents for capturing the actual content
        (0, mouse_1.startIgnoreMouseEventsByAlpha)(liveCompactWindow, liveBrowserView.webContents);
    }
    catch (error) {
        electron_log_1.default.warn("[LIVE] Failed to init alpha-based ignoreMouseEvents:", error);
    }
    // Show the live window in the user's preferred mode when ready
    liveBrowserView.webContents.once("did-finish-load", () => {
        // The first-time demo plays a walkthrough video in the main window while the
        // floating live window records it, so both must stay visible. Every other
        // meeting hides the home window behind the live window.
        const isDemo = (0, recording_context_store_1.getRecordingContextSnapshot)()?.isDemo === true;
        // Full mode: switch the BrowserView to the full window (shows + focuses it
        // and notifies the renderer) instead of revealing the compact bar.
        if (preferredMode === "full") {
            void (0, ipc_1.applyLiveViewMode)("full");
            // When the live window is visible, hide the home window
            if (!isDemo)
                hideMainWindowToTray();
            return;
        }
        if (liveCompactWindow && !liveCompactWindow.isDestroyed()) {
            if (process.platform === "darwin") {
                liveCompactWindow.showInactive();
            }
            else {
                liveCompactWindow.show();
            }
            // When the live floating bar is visible, hide the home window
            if (!isDemo)
                hideMainWindowToTray();
        }
    });
    electron_log_1.default.info("[LIVE] Created dual-window setup for live mode");
}
// Helper to recreate compact window with fresh macOS window state
function recreateCompactWindow() {
    const webPreferences = {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "..", "preload.js"),
        webSecurity: !(0, utils_1.isDev)(),
        sandbox: !(0, utils_1.isDev)(),
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        backgroundThrottling: false,
        devTools: (0, utils_1.shouldEnableDevTools)(),
    };
    const compact = fitToDisplay(getCursorDisplay(), 1100, 560);
    const compactMin = (0, dictation_live_anchor_1.liveCompactWindowMinSize)(universalPillEnabled, compact);
    const newWindow = new electron_1.BrowserWindow({
        width: compact.width,
        height: compact.height,
        minWidth: compactMin.minWidth,
        minHeight: compactMin.minHeight,
        type: "panel",
        show: false,
        maximizable: false,
        // Fixed-size floating bar — never user-resizable (see createLiveDualWindowSetup).
        resizable: false,
        fullscreenable: false,
        alwaysOnTop: true,
        frame: false,
        skipTaskbar: false,
        titleBarStyle: "hiddenInset",
        title: "Live Assist",
        transparent: true,
        hasShadow: false,
        webPreferences,
    });
    // Setup compact window properties
    (0, macos_spaces_1.keepWindowOnActiveSpace)(newWindow);
    if (process.platform === "darwin") {
        newWindow.setWindowButtonVisibility(false);
    }
    return newWindow;
}
// Switch between compact and full mode by moving the BrowserView
function switchLiveWindowMode(mode) {
    if (!liveBrowserView || !liveCompactWindow || !liveFullWindow) {
        electron_log_1.default.warn("[LIVE] Dual-window setup not initialized, cannot switch mode");
        return;
    }
    const fromWindow = mode === "compact" ? liveFullWindow : liveCompactWindow;
    let toWindow = mode === "compact" ? liveCompactWindow : liveFullWindow;
    // Save the current bounds
    const currentBounds = fromWindow.getBounds();
    // Remove WebContentsView from current window using the reusable placeholder
    if (placeholderContentView) {
        fromWindow.setContentView(placeholderContentView);
    }
    fromWindow.hide();
    // When switching to compact, recreate the window to get fresh macOS state
    if (mode === "compact" && process.platform === "darwin") {
        const oldWindow = liveCompactWindow;
        // Dispose glass manager BEFORE destroying the old window
        if (exports.liveGlassManager) {
            exports.liveGlassManager.dispose();
            exports.liveGlassManager = null;
        }
        toWindow = recreateCompactWindow();
        liveCompactWindow = toWindow;
        // Add event listeners to new window
        toWindow.on("blur", () => {
            liveBrowserView?.webContents.send("window-blur");
        });
        toWindow.on("moved", onCompactWindowMoved);
        toWindow.on("resize", () => syncLiveViewToWindow(toWindow));
        toWindow.on("closed", destroyLiveWindow);
        // Reinitialize display tracking for the new window
        const initialDisplay = electron_1.screen.getDisplayMatching(toWindow.getBounds());
        lastDisplayId = initialDisplay.id;
        // Clean up old window: emit 'close' to trigger mouse tracking cleanup,
        // then remove all event listeners to prevent handleClose and any other handlers
        if (oldWindow && !oldWindow.isDestroyed()) {
            oldWindow.emit("close"); // Triggers mouse.ts cleanup (clearInterval + setIgnoreMouseEvents)
            oldWindow.removeAllListeners(); // Remove ALL listeners to prevent any callbacks to destroyed window
            // Delay destroy to give macOS time to deregister native tracking areas
            // Otherwise mouse events can crash trying to route to destroyed window
            setTimeout(() => {
                if (oldWindow && !oldWindow.isDestroyed()) {
                    oldWindow.destroy();
                }
            }, 200);
        }
    }
    // Add BrowserView to target window
    toWindow.setContentView(liveBrowserView);
    // Apply the target mode's zoom: full panel shares the global level, the
    // floating bar is always 100%.
    if (!liveBrowserView.webContents.isDestroyed()) {
        liveBrowserView.webContents.setZoomFactor(mode === "full" ? sharedZoom : 1);
    }
    // Set bounds for the BrowserView to fill the window
    const toBounds = toWindow.getBounds();
    liveBrowserView.setBounds({
        x: 0,
        y: 0,
        width: toBounds.width,
        height: toBounds.height,
    });
    // Position the target window
    if (mode === "compact") {
        // Update glass manager for compact mode
        if (exports.liveGlassManager) {
            exports.liveGlassManager.dispose();
        }
        exports.liveGlassManager = new glass_manager_1.GlassManager(toWindow);
        // Compact mode: back onto whichever edge the bar is docked to. Forcing
        // top-centre here would strand liveBarDockSide on its previous edge, and
        // the resize logic would then hold the wrong side still. The legacy bar
        // has no dock and always comes back top-centre.
        try {
            const display = electron_1.screen.getDisplayMatching(currentBounds);
            const size = { width: toBounds.width, height: toBounds.height };
            toWindow.setBounds(universalPillEnabled
                ? liveBarDockedBounds(liveBarDockSide, size, display.workArea)
                : (0, dictation_live_anchor_1.legacyLiveBarBounds)(size, display.workArea), false);
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to position compact window:", error);
        }
        // Enable alpha-based mouse passthrough for compact mode
        try {
            // Pass the WebContentsView's webContents for capturing the actual content
            (0, mouse_1.startIgnoreMouseEventsByAlpha)(toWindow, liveBrowserView.webContents);
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to init alpha-based ignoreMouseEvents:", error);
        }
    }
    else {
        // Full mode doesn't use glass/acrylic, so dispose glass manager
        if (exports.liveGlassManager) {
            exports.liveGlassManager.dispose();
            exports.liveGlassManager = null;
        }
        // Re-fit the minimum to the active display (it may differ from the
        // creation-time display) so the window never exceeds the screen and can't be
        // shrunk below the size the panels need. The minimum and the open bounds come
        // from the same call so they stay consistent. Then open at the user's saved
        // size+position, or the default docked to the top-right corner.
        const placement = getFullWindowPlacement(currentBounds);
        toWindow.setMinimumSize(placement.minWidth, placement.minHeight);
        try {
            suppressFullBoundsSaveUntil = Date.now() + 1000;
            toWindow.setBounds(placement.bounds, false);
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to position full window:", error);
        }
    }
    // Show the target window
    toWindow.show();
    toWindow.focus();
    // Update the global liveWindow reference
    exports.liveWindow = toWindow;
    electron_log_1.default.info(`[LIVE] Switched to ${mode} mode`);
}
// Exit fullscreen on the full window if it's active
// Returns a Promise that resolves when fullscreen exit is complete
function exitLiveFullWindowFullscreen() {
    return new Promise((resolve) => {
        if (!liveFullWindow || liveFullWindow.isDestroyed()) {
            resolve();
            return;
        }
        if (!liveFullWindow.isFullScreen()) {
            resolve();
            return;
        }
        // Wait for fullscreen exit to complete
        liveFullWindow.once("leave-full-screen", () => {
            resolve();
        });
        liveFullWindow.setFullScreen(false);
    });
}
// Enter fullscreen on the full window
// Returns a Promise that resolves when fullscreen enter is complete
function enterLiveFullWindowFullscreen() {
    return new Promise((resolve) => {
        if (!liveFullWindow || liveFullWindow.isDestroyed()) {
            resolve();
            return;
        }
        if (liveFullWindow.isFullScreen()) {
            resolve();
            return;
        }
        // Wait for fullscreen enter to complete
        liveFullWindow.once("enter-full-screen", () => {
            resolve();
        });
        liveFullWindow.setFullScreen(true);
    });
}
// Get the BrowserView's webContents to send messages to the React app
function getLiveBrowserViewWebContents() {
    return liveBrowserView?.webContents || null;
}
function isLiveViewHostFullscreen() {
    const host = liveViewReparentedToMain ? exports.mainWindow : liveFullWindow;
    return Boolean(host && !host.isDestroyed() && host.isFullScreen());
}
// Marks that the Live window ended its recording and now shows the notepad in
// place, so closing it should return home instead of collapsing to the compact
// recording bar.
function markLiveMeetingEndedInPlace() {
    liveMeetingEndedInPlace = true;
    // The recording is finished even though this window lives on to show the
    // notepad. The pill must go back to offering its launcher.
    setLiveSessionOpen(false);
}
/**
 * Reparent the live WebContentsView into the main window as an overlay.
 * This preserves all React state (socket connections, summary data, etc.)
 * while moving the content from the live window to the main window.
 */
async function reparentLiveViewToMain() {
    if (!liveBrowserView || !exports.mainWindow || exports.mainWindow.isDestroyed()) {
        electron_log_1.default.warn("[LIVE] Cannot reparent: missing liveBrowserView or mainWindow");
        return false;
    }
    if (liveViewReparentedToMain) {
        electron_log_1.default.info("[LIVE] Live view already reparented to main");
        return true;
    }
    electron_log_1.default.info("[LIVE] Reparenting live view to main window");
    // Hide the meeting end animation window if showing
    hideMeetingEndAnimationWindow();
    // Remove liveBrowserView from current host window
    const currentHost = exports.liveWindow;
    if (currentHost && !currentHost.isDestroyed()) {
        if (placeholderContentView) {
            currentHost.setContentView(placeholderContentView);
        }
        currentHost.hide();
    }
    // Dispose glass manager since we're leaving the live windows
    if (exports.liveGlassManager) {
        exports.liveGlassManager.dispose();
        exports.liveGlassManager = null;
    }
    // Set an opaque background so the main window content doesn't show through.
    // The live window uses transparent backgrounds for its compact/full window
    // styling, but when overlaid on the main window we need it fully opaque.
    liveBrowserView.setBackgroundColor("#000000");
    // Add the view to the main window but initially hidden (zero-size).
    // The renderer still shows the compact/floating panel layout until React
    // processes the "reparented-to-main" event and re-renders with the
    // PostMeetingPanel. We reveal the view only after that re-render.
    exports.mainWindow.contentView.addChildView(liveBrowserView);
    liveBrowserView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    // Notify the renderer that it's now on the main window.
    // The renderer will call markAsMainDesktopWindow() which triggers a
    // re-render from compact view → PostMeetingPanel.
    liveBrowserView.webContents.send("reparented-to-main");
    // Reveal the view after a short delay so React has time to process the
    // "reparented-to-main" event, update state, and re-render from compact
    // view to PostMeetingPanel.
    setTimeout(() => {
        if (!liveBrowserView || !exports.mainWindow || exports.mainWindow.isDestroyed())
            return;
        const bounds = exports.mainWindow.getContentBounds();
        liveBrowserView.setBounds({
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height,
        });
        // Focus the live view's webContents so it receives input events (clicks, keys).
        // Without this the main window's own webContents captures all input and the
        // overlay controls (back button, share, etc.) are not clickable.
        liveBrowserView.webContents.focus();
    }, 150);
    // Handle main window resize to keep live view filling
    liveViewResizeHandler = () => {
        if (!liveBrowserView || !exports.mainWindow || exports.mainWindow.isDestroyed())
            return;
        const newBounds = exports.mainWindow.getContentBounds();
        liveBrowserView.setBounds({
            x: 0,
            y: 0,
            width: newBounds.width,
            height: newBounds.height,
        });
    };
    exports.mainWindow.on("resize", liveViewResizeHandler);
    liveViewReparentedToMain = true;
    // Clean up live host windows (compact/full) without destroying liveBrowserView
    (0, ipc_1.resetLiveViewMode)();
    // The pill goes back to being its ordinary launcher rather than a marker
    // for a meeting that has moved on.
    setLiveSessionOpen(false);
    currentLiveUrl = null;
    lastDisplayId = null;
    if (moveDebounceTimeout) {
        clearTimeout(moveDebounceTimeout);
        moveDebounceTimeout = null;
    }
    if (liveCompactWindow && !liveCompactWindow.isDestroyed()) {
        // Emit "close" before removing listeners so cleanup handlers
        // (e.g. startIgnoreMouseEventsByAlpha interval) run first
        liveCompactWindow.emit("close");
        liveCompactWindow.removeListener("moved", onCompactWindowMoved);
        liveCompactWindow.removeAllListeners();
        liveCompactWindow.destroy();
    }
    if (liveFullWindow && !liveFullWindow.isDestroyed()) {
        // Exit fullscreen before destroying so macOS cleanly transitions
        // out of the fullscreen Space (same pattern as window-close-and-focus-main)
        try {
            await exitLiveFullWindowFullscreen();
        }
        catch (error) {
            electron_log_1.default.warn("[LIVE] Failed to exit fullscreen before destroy:", error);
        }
        liveFullWindow.removeAllListeners();
        liveFullWindow.destroy();
    }
    // Clean up placeholder (no longer needed)
    teardownWebContentsView(placeholderContentView);
    placeholderContentView = null;
    liveCompactWindow = null;
    liveFullWindow = null;
    exports.liveWindow = null;
    // Focus main window
    if (process.platform === "darwin") {
        electron_1.app.focus({ steal: true });
    }
    showMainWindow();
    electron_log_1.default.info("[LIVE] Live view reparented to main window successfully");
    return true;
}
/**
 * Detach the live WebContentsView from the main window and clean up.
 * Called when the user dismisses the post-meeting summary.
 */
function detachLiveViewFromMain() {
    if (!liveViewReparentedToMain) {
        return;
    }
    electron_log_1.default.info("[LIVE] Detaching live view from main window");
    // Remove resize handler
    if (liveViewResizeHandler) {
        if (exports.mainWindow && !exports.mainWindow.isDestroyed()) {
            exports.mainWindow.off("resize", liveViewResizeHandler);
        }
        liveViewResizeHandler = null;
    }
    // Remove live view from main window and tear it down
    if (liveBrowserView) {
        if (exports.mainWindow && !exports.mainWindow.isDestroyed()) {
            exports.mainWindow.contentView.removeChildView(liveBrowserView);
        }
        teardownWebContentsView(liveBrowserView);
        liveBrowserView = null;
    }
    liveViewReparentedToMain = false;
    electron_log_1.default.info("[LIVE] Live view detached from main window");
}
/**
 * Check whether the live view is currently reparented to the main window.
 */
function isLiveViewOnMain() {
    return liveViewReparentedToMain;
}
function createChildWindow(url, floating, initialMode) {
    const { pathname, search, hash } = new URL(url, "http://localhost");
    // Build route with hash included
    const rawRoute = `${pathname}${search}${hash}`;
    // Normalize the route: ensure single leading slash, collapse duplicates, remove trailing slash
    let route = rawRoute
        .replace(/\/+/g, "/") // Collapse multiple slashes into one
        .replace(/^(?!\/)/, "/"); // Ensure leading slash
    // Remove trailing slash unless it's just "/"
    if (route.length > 1 && route.endsWith("/")) {
        route = route.slice(0, -1);
    }
    // Get the first segment of the path
    const firstSegment = pathname.split("/")[1]?.split("?")[0];
    // IMPORTANT: Don't check mainWindow properties until we know what type of window we're creating
    // Checking mainWindow.isVisible() can trigger space switching on macOS!
    let mainWindowWasVisible = false;
    if (firstSegment === "live") {
        const urlToLoad = (0, utils_1.getUrlToLoad)(route);
        // Restore the shared zoom on the home screen when this live session ends.
        restoreMainZoomPending = true;
        // If the live view was reparented to main (post-meeting overlay), detach
        // and tear it down before creating a new live window. After reparenting,
        // liveWindow is null so the URL-change guard below would skip cleanup,
        // leaving the old overlay and resize handler attached to mainWindow.
        if (liveViewReparentedToMain) {
            electron_log_1.default.info("[LIVE] Detaching reparented live view before opening new meeting");
            detachLiveViewFromMain();
        }
        // Check if we have an existing live window with a different URL (different meeting)
        if (exports.liveWindow &&
            !exports.liveWindow.isDestroyed() &&
            currentLiveUrl !== urlToLoad) {
            electron_log_1.default.info("[LIVE] URL changed, resetting live window for new meeting");
            destroyLiveWindow();
        }
        if (exports.liveWindow && !exports.liveWindow.isDestroyed()) {
            // Same URL - reuse existing window
            // DO NOT interact with main window AT ALL - even checking isFocused() or calling blur()
            // can cause macOS to switch spaces to that window
            // Ensure the window stays always on top. This must be done BEFORE any
            // show/restore operations. Only the compact bar follows the active
            // Space; the full window is an ordinary window that keeps its Space.
            if (floating) {
                exports.liveWindow.setAlwaysOnTop(true, "screen-saver");
                if (exports.liveWindow === liveCompactWindow) {
                    (0, macos_spaces_1.keepWindowOnActiveSpace)(exports.liveWindow);
                }
            }
            // Reposition the window to the screen where cursor is currently located
            // Do this BEFORE restoring/showing to avoid visual jumps
            try {
                const display = electron_1.screen.getDisplayNearestPoint(electron_1.screen.getCursorScreenPoint());
                const wa = display.workArea;
                const bounds = exports.liveWindow.getBounds();
                const size = { width: bounds.width, height: bounds.height };
                // Only the compact bar docks. The full window is an ordinary window and
                // must never be positioned as though it were the bar.
                if (exports.liveWindow === liveCompactWindow) {
                    exports.liveWindow.setBounds(reopenedLiveBarBounds(size, wa), false);
                }
                else {
                    exports.liveWindow.setBounds((0, dictation_live_anchor_1.legacyLiveBarBounds)(size, wa), false);
                }
                electron_log_1.default.info("[FLOAT] Positioned live window:", exports.liveWindow.getBounds());
            }
            catch (error) {
                electron_log_1.default.warn("[FLOAT] Failed to reposition live window to cursor screen:", error);
            }
            // Restore the window if it's minimized
            if (exports.liveWindow.isMinimized()) {
                exports.liveWindow.restore();
            }
            // Show without activating to prevent macOS space switching
            // Always use showInactive on macOS regardless of current visibility
            if (!exports.liveWindow.isVisible()) {
                if (process.platform === "darwin") {
                    exports.liveWindow.showInactive();
                }
                else {
                    exports.liveWindow.show();
                    exports.liveWindow.focus();
                }
            }
            else {
                // Window is already visible, just ensure it's on top
                if (process.platform === "darwin") {
                    exports.liveWindow.moveTop?.();
                }
                else {
                    exports.liveWindow.focus();
                }
            }
            hideMainWindowToTray();
            return exports.liveWindow;
        }
        // Create new dual-window setup for live mode
        currentLiveUrl = urlToLoad;
        createLiveDualWindowSetup(urlToLoad, initialMode);
        // Return the current live window (compact window initially)
        return exports.liveWindow || undefined;
    }
    else {
        // Check if main window was visible (safe to check now since we're not in floating mode)
        mainWindowWasVisible = !!(exports.mainWindow &&
            !exports.mainWindow.isDestroyed() &&
            exports.mainWindow.isVisible());
        if (mainWindowWasVisible) {
            if (process.platform === "darwin") {
                exports.mainWindow?.showInactive();
            }
            else {
                exports.mainWindow?.show();
            }
        }
        return;
    }
}
/**
 * Hide the main window to the tray. Used typically to make the floating live window be the only one on screen.
 */
function hideMainWindowToTray() {
    try {
        if (!exports.mainWindow || exports.mainWindow.isDestroyed())
            return;
        exports.mainWindow.hide();
        exports.mainWindow.setSkipTaskbar(true);
    }
    catch (error) {
        electron_log_1.default.error("[WINDOW] Failed to hide main window for live view:", error);
    }
}
/**
 * Bring the active live session window (the floating bar or the fullscreen
 * realtime panel) to the front.
 */
function focusLiveWindow() {
    if (!exports.liveWindow || exports.liveWindow.isDestroyed())
        return;
    try {
        if (exports.liveWindow.isMinimized())
            exports.liveWindow.restore();
        exports.liveWindow.show();
        exports.liveWindow.focus();
    }
    catch (error) {
        electron_log_1.default.error("[WINDOW] Failed to focus live window:", error);
    }
}
/**
 * Bring the main window to front and ensure it appears in the dock/taskbar.
 * If the main window doesn't exist yet, create it and let its ready handler show it.
 */
function showMainWindow() {
    if (exports.liveWindow && !exports.liveWindow.isDestroyed()) {
        focusLiveWindow();
        return;
    }
    revealMainWindow();
}
/**
 * Bring the main window itself forward even while a live session window is
 * open, for flows that continue on the home screen (e.g. Talk onboarding).
 */
function revealMainWindow() {
    try {
        if (!exports.mainWindow || exports.mainWindow.isDestroyed()) {
            createWindow();
            return;
        }
        if (exports.mainWindow.isMinimized())
            exports.mainWindow.restore();
        // Ensure it shows in dock/taskbar
        try {
            exports.mainWindow.setSkipTaskbar(false);
        }
        catch (error) {
            electron_log_1.default.error("[WINDOW] Failed to set skip taskbar", error);
        }
        exports.mainWindow.show();
        exports.mainWindow.focus();
    }
    catch (error) {
        electron_log_1.default.error("[WINDOW] Failed to show main window:", error);
    }
}
function meetingEndAnimationPlacement(size) {
    const pill = visibleDictationPill();
    const display = pill
        ? electron_1.screen.getDisplayMatching(pill.bounds)
        : getCursorDisplay();
    return (0, meeting_end_animation_position_1.meetingEndAnimationBounds)(size, display.workArea, pill);
}
/**
 * Show a small floating window with the meeting end animation
 */
function showMeetingEndAnimationWindow() {
    try {
        electron_log_1.default.info("[ANIMATION] showMeetingEndAnimationWindow called");
        // If window already exists, just show it
        if (meetingEndAnimationWindow && !meetingEndAnimationWindow.isDestroyed()) {
            electron_log_1.default.info("[ANIMATION] Window already exists, showing it");
            meetingEndAnimationWindow.setBounds(meetingEndAnimationPlacement(meetingEndAnimationWindow.getBounds()));
            meetingEndAnimationWindow.show();
            meetingEndAnimationWindow.moveTop();
            return;
        }
        // Hide the live window while animation is showing
        if (exports.liveWindow && !exports.liveWindow.isDestroyed()) {
            electron_log_1.default.info("[ANIMATION] Hiding live window");
            exports.liveWindow.hide();
        }
        // Create a small floating panel for the animation
        // Size calculated to exactly fit content (no gray background)
        // Content: [12px logo] + [8px gap] + [~160px text] + [32px padding] + [2px border] = ~214px
        // Content: [20px line-height] + [24px padding] + [2px border] = ~46px
        const placement = meetingEndAnimationPlacement({ width: 195, height: 46 });
        const windowConfig = {
            ...placement,
            type: "panel", // Makes it a floating panel
            show: false,
            maximizable: false,
            minimizable: false,
            resizable: false,
            fullscreenable: false,
            alwaysOnTop: true,
            frame: false,
            skipTaskbar: true, // Don't show in taskbar
            transparent: true,
            backgroundColor: "#00000000",
            hasShadow: false, // No window shadow, we use CSS shadows instead
            focusable: false, // Don't steal focus
            ...(process.platform === "darwin" && {
                vibrancy: "under-window", // macOS transparency
                visualEffectState: "active",
            }),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                preload: path.join(__dirname, "preload.js"),
            },
        };
        electron_log_1.default.info("[ANIMATION] Creating window with config:", windowConfig);
        meetingEndAnimationWindow = new electron_1.BrowserWindow(windowConfig);
        (0, macos_spaces_1.keepWindowOnActiveSpace)(meetingEndAnimationWindow);
        // Load the standalone animation HTML file (no React app)
        // __dirname is electron/dist/src, so go up two levels to get to electron/
        const animationHtmlPath = path.join(__dirname, "..", "..", "animation.html");
        electron_log_1.default.info(`[ANIMATION] Loading HTML from: ${animationHtmlPath}`);
        // Check if file exists
        if (!fsSync.existsSync(animationHtmlPath)) {
            electron_log_1.default.error(`[ANIMATION] HTML file not found at: ${animationHtmlPath}`);
            // Try alternative paths
            const paths = [
                path.join(__dirname, "..", "animation.html"), // dist/animation.html
                path.join(__dirname, "animation.html"), // dist/src/animation.html
            ];
            let foundPath = null;
            for (const altPath of paths) {
                electron_log_1.default.info(`[ANIMATION] Trying alternative path: ${altPath}`);
                if (fsSync.existsSync(altPath)) {
                    foundPath = altPath;
                    break;
                }
            }
            if (foundPath) {
                electron_log_1.default.info(`[ANIMATION] Found HTML at: ${foundPath}`);
                meetingEndAnimationWindow.loadFile(foundPath);
            }
            else {
                throw new Error("Animation HTML file not found in any expected location");
            }
        }
        else {
            electron_log_1.default.info(`[ANIMATION] HTML file found, loading...`);
            meetingEndAnimationWindow.loadFile(animationHtmlPath);
        }
        // Show when ready
        meetingEndAnimationWindow.once("ready-to-show", () => {
            electron_log_1.default.info("[ANIMATION] Window ready-to-show event fired");
            if (meetingEndAnimationWindow &&
                !meetingEndAnimationWindow.isDestroyed()) {
                meetingEndAnimationWindow.show();
                // A non-focusable show does not raise the window above the other
                // always-on-top surfaces (dictation pill, Live Assist).
                meetingEndAnimationWindow.moveTop();
                electron_log_1.default.info("[ANIMATION] Window shown");
            }
        });
        // Log when window is actually shown
        meetingEndAnimationWindow.once("show", () => {
            electron_log_1.default.info("[ANIMATION] Window show event fired");
        });
        // Handle load errors
        meetingEndAnimationWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
            electron_log_1.default.error(`[ANIMATION] Failed to load: ${errorCode} - ${errorDescription}`);
        });
        // Clean up reference when closed
        meetingEndAnimationWindow.on("closed", () => {
            electron_log_1.default.info("[ANIMATION] Window closed");
            meetingEndAnimationWindow = null;
        });
        electron_log_1.default.info("[ANIMATION] Meeting end animation window created");
    }
    catch (error) {
        electron_log_1.default.error("[ANIMATION] Failed to show animation window:", error);
    }
}
/**
 * Hide and destroy the meeting end animation window
 */
function hideMeetingEndAnimationWindow() {
    try {
        if (meetingEndAnimationWindow && !meetingEndAnimationWindow.isDestroyed()) {
            meetingEndAnimationWindow.close();
            meetingEndAnimationWindow = null;
            electron_log_1.default.info("[ANIMATION] Meeting end animation window closed");
        }
        // Don't automatically show the live window here
        // Let the view mode switching logic (switchToFullView) handle showing the appropriate window
        // This prevents showing the compact window when we should be switching to full view
        electron_log_1.default.info("[ANIMATION] Animation closed, waiting for view mode switch to show window");
    }
    catch (error) {
        electron_log_1.default.error("[ANIMATION] Failed to hide animation window:", error);
    }
}
/**
 * Show the floating dictation pill. Created once and shown only while a user
 * is signed in (see setDictationEnabled). A collapsed grabber while idle,
 * expanding on hover or while the dictation hotkey is held (see
 * setDictationPillState). The pill's own DictationPill route renders inside a
 * WebContentsView hosted in a fixed, larger transparent window (the same
 * technique as the Live compact bar). The route floats its pill bottom-centered
 * inside this window, so macOS's corner mask stays at the (transparent,
 * invisible) host-window corners and never clips the pill, and the surrounding
 * transparent area composites truly see-through.
 * Alpha-based click-through forwards clicks over that transparent margin to the
 * app behind, so only the pill itself is interactive. The host docks to the
 * bottom, left, or right of the display the cursor is on (see
 * positionDictationPill).
 */
function showDictationPill() {
    if (!dictationPillAllowed)
        return;
    try {
        if (dictationPillWindow && !dictationPillWindow.isDestroyed()) {
            positionDictationPill();
            sendDictationPillSide(dictationPillSide);
            sendDictationMeetingActive();
            sendDictationPillMinimized();
            sendDictationPillTeaser();
            startDictationHoverTracking();
            (0, windows_overlay_owner_1.adoptWindowsOverlay)(dictationPillWindow);
            dictationPillWindow.showInactive();
            startDictationPillRepositionLoop();
            rescueWindowsDictationPill();
            // The guide opens first: a card synced before it would flash on screen
            // and spend its offer before the guide covers it.
            if (process.platform === "darwin" && !isDictationIntroCardUp()) {
                (0, dictation_accessibility_window_1.showDictationAccessibilityPromptIfNeeded)(dictationPillWindow.getBounds(), dictationPillSide);
            }
            syncDictationPillCards();
            return;
        }
        const restoreAnchor = restoreDictationPillDock();
        const pillBounds = getDictationPillBounds(dictationPillSide, restoreAnchor);
        dictationPillWindow = new electron_1.BrowserWindow({
            ...pillBounds,
            ...(process.platform === "darwin" ? { type: "panel" } : {}),
            show: false,
            maximizable: false,
            minimizable: false,
            resizable: false,
            fullscreenable: false,
            movable: true,
            alwaysOnTop: true,
            frame: false,
            skipTaskbar: true,
            transparent: true,
            hasShadow: false,
            backgroundColor: "#00000000",
            acceptFirstMouse: true,
            // Mic/stop clicks must not make this the key window — Cmd+V would
            // land here instead of Slack/Chrome. Mouse events still fire.
            focusable: false,
        });
        dictationPillWindow.setFocusable(false);
        (0, dictation_pill_screen_1.raiseDictationPillAboveDock)(dictationPillWindow);
        (0, macos_spaces_1.keepWindowOnActiveSpace)(dictationPillWindow);
        dictationPillWindow.setIgnoreMouseEvents(true, { forward: true });
        (0, windows_overlay_owner_1.adoptWindowsOverlay)(dictationPillWindow);
        (0, windows_overlay_activation_1.keepWindowsOverlayClickable)(dictationPillWindow);
        (0, macos_panel_activation_1.keepMacPanelFromActivating)(dictationPillWindow);
        setupDictationPillDrag();
        // Same renderer prefs as the main/Live windows. Omitting webSecurity:
        // !isDev() left CORS on in development, so the pill's GraphQL bootstrap
        // (feature flags, etc.) failed with "Failed to fetch" and toasted into
        // this always-on-top window on every launch.
        dictationPillView = new electron_1.WebContentsView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "..", "preload.js"),
                webSecurity: !(0, utils_1.isDev)(),
                sandbox: !(0, utils_1.isDev)(),
                allowRunningInsecureContent: false,
                experimentalFeatures: false,
                backgroundThrottling: false,
                devTools: (0, utils_1.shouldEnableDevTools)(),
            },
        });
        // Transparent backing on all platforms — otherwise Windows paints an opaque
        // white WebContentsView rect around the pill.
        dictationPillView.setBackgroundColor("#00000000");
        (0, dictation_pill_context_menu_1.suppressDictationPillContextMenus)(dictationPillWindow, dictationPillView.webContents);
        dictationPillWindow.setContentView(dictationPillView);
        dictationPillView.setBounds({
            x: 0,
            y: 0,
            width: pillBounds.width,
            height: pillBounds.height,
        });
        dictationPillView.webContents.loadURL((0, utils_1.getUrlToLoad)("/dictation-pill"));
        dictationPillView.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
            electron_log_1.default.error(`[DictationPill] Failed to load: ${errorCode} - ${errorDescription}`);
        });
        dictationPillView.webContents.once("did-finish-load", () => {
            if (!dictationPillWindow || dictationPillWindow.isDestroyed())
                return;
            if (!dictationPillAllowed) {
                // Drop a half-initialized host so the next show creates a fresh window
                // with alpha click-through installed.
                teardownWebContentsView(dictationPillView);
                dictationPillWindow.destroy();
                return;
            }
            // showInactive so the pill never takes focus from the app being
            // dictated into.
            (0, windows_overlay_owner_1.adoptWindowsOverlay)(dictationPillWindow);
            dictationPillWindow.showInactive();
            dictationPillView?.webContents.send("dictation:shortcut", dictationShortcutHint);
            // Transparent margin is click-through; the opaque pill stays interactive
            // (for hover-to-expand and the cancel button). Capture from the view's
            // webContents since that's where the pill is rendered. A faster poll
            // keeps hover-to-expand responsive; focusOnInteract:false so the pill
            // never steals focus and hovering it doesn't flicker.
            restoreDictationClickThrough = (0, mouse_1.startIgnoreMouseEventsByAlpha)(dictationPillWindow, dictationPillView?.webContents, 150, false, () => dictationPillDragging || dictationLauncherHovered).restoreClickThrough;
            sendDictationPillSide(dictationPillSide);
            sendDictationPillTeaser();
            if (!dictationPillAllowed)
                return;
            startDictationHoverTracking();
            startDictationPillRepositionLoop();
            rescueWindowsDictationPill();
            // Detached action runs get their own corner window. It is transparent
            // and click-through until an orb appears in it.
            (0, dictation_action_orb_window_1.ensureDictationActionOrbWindow)(dictationPillWindow.getBounds());
            if (process.platform === "darwin" && !isDictationIntroCardUp()) {
                (0, dictation_accessibility_window_1.showDictationAccessibilityPromptIfNeeded)(dictationPillWindow.getBounds(), dictationPillSide);
            }
            syncDictationPillCards();
        });
        dictationPillWindow.on("closed", () => {
            stopDictationPillChrome();
            (0, dictation_accessibility_window_1.hideDictationAccessibilityPrompt)();
            (0, dictation_talk_teaser_window_1.hideDictationTalkTeaser)();
            (0, dictation_feedback_window_1.hideDictationFeedbackPopover)();
            (0, dictation_email_assistant_window_1.hideDictationEmailAssistantNudge)();
            (0, dictation_slack_assistant_window_1.hideDictationSlackAssistantNudge)();
            (0, dictation_action_orb_window_1.hideDictationActionOrbWindow)();
            restoreDictationClickThrough = null;
            dictationPillWindow = null;
            dictationPillView = null;
        });
    }
    catch (error) {
        electron_log_1.default.error("[DictationPill] Failed to show pill window:", error);
    }
}
/** Hide the pill without destroying it — shown again on the next sign-in. */
function hideDictationPill() {
    stopDictationPillChrome();
    if (dictationPillWindow && !dictationPillWindow.isDestroyed()) {
        dictationPillWindow.hide();
    }
    (0, dictation_talk_teaser_window_1.hideDictationTalkTeaser)();
    (0, dictation_feedback_window_1.hideDictationFeedbackPopover)();
    (0, dictation_email_assistant_window_1.hideDictationEmailAssistantNudge)();
    (0, dictation_slack_assistant_window_1.hideDictationSlackAssistantNudge)();
    (0, dictation_accessibility_window_1.hideDictationAccessibilityPrompt)();
}
/** True when these ipc messages came from the app's own main renderer. */
function isDictationRendererSender(sender) {
    const own = [exports.mainWindow?.webContents, dictationPillView?.webContents];
    return own.some((contents) => contents && !contents.isDestroyed() && contents.id === sender.id);
}
function stopDictationPillChrome() {
    stopDictationManualDrag();
    stopDictationPillRepositionLoop();
    stopDictationPointerPoll();
    if (dictationHoverInterval) {
        clearInterval(dictationHoverInterval);
        dictationHoverInterval = null;
    }
    if (dictationCollapseTimer) {
        clearTimeout(dictationCollapseTimer);
        dictationCollapseTimer = null;
    }
    if (dictationDragSnapTimer) {
        clearTimeout(dictationDragSnapTimer);
        dictationDragSnapTimer = null;
    }
    if (dictationDragHighlightTimer) {
        clearInterval(dictationDragHighlightTimer);
        dictationDragHighlightTimer = null;
    }
    cancelSnapAnimation();
    (0, dictation_pill_overlay_1.destroyDictationDragOverlay)();
    sendDictationDragging(false);
    dictationPillDragging = false;
    dictationWinDragOrigin = null;
    dictationCaptionLoopActive = false;
    restoreDictationClickThrough?.();
}
/**
 * Drive the pill's hover-to-expand from the main process via a cursor hit-test,
 * instead of DOM mouse events. The alpha click-through poll toggles the pill
 * window's mouse-event forwarding, which makes DOM hover unreliable — a
 * stationary cursor never receives a fresh mouseenter after the window flips
 * back to interactive, so the pill would collapse under the cursor.
 *
 * Two behaviours make it feel deliberate rather than twitchy:
 *  - The expand region comfortably covers the collapsed grabber, so any cursor
 *    over the visible pill always expands it (never collapsed under the cursor);
 *    a larger region keeps it expanded (spatial hysteresis).
 *  - After the cursor leaves, it stays expanded for COLLAPSE_GRACE_MS so a
 *    brief exit (or moving between the grabber and the pill edge) doesn't
 *    collapse it; re-entering cancels the pending collapse.
 */
const DICTATION_COLLAPSE_GRACE_MS = 500;
function startDictationHoverTracking() {
    if (dictationHoverInterval)
        clearInterval(dictationHoverInterval);
    let inside = false;
    let sentHover = false;
    const sendHover = (value) => {
        if (sentHover === value)
            return;
        sentHover = value;
        if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
            dictationPillView.webContents.send("dictation:hover", value);
        }
    };
    dictationHoverInterval = setInterval(() => {
        try {
            if (!dictationPillWindow || dictationPillWindow.isDestroyed())
                return;
            if (!dictationPillView || dictationPillView.webContents.isDestroyed())
                return;
            if (dictationPillDragging)
                return;
            const region = (0, dictation_pill_layout_1.getDictationHoverRegion)(dictationPillSide, process.platform, (0, dictation_pill_minimized_1.isDictationPillMinimized)());
            const cursor = electron_1.screen.getCursorScreenPoint();
            const [winX, winY] = dictationPillWindow.getPosition();
            const dx = Math.abs(cursor.x - (winX + region.centerX));
            const dy = Math.abs(cursor.y - (winY + region.centerY));
            // Over the open launcher's box the window is simply clickable. The
            // per-pixel alpha sampling that otherwise decides this runs on mouse
            // moves and a poll, and a hand that lands on a button and clicks at
            // once beat it, so the click fell through to the app behind.
            const overLauncher = (inside || dictationLauncherHovered) &&
                (0, dictation_pill_layout_1.isPointInRect)({ x: cursor.x - winX, y: cursor.y - winY }, (0, dictation_pill_layout_1.getDictationLauncherBounds)(dictationPillSide, process.platform));
            if (overLauncher !== dictationLauncherHovered) {
                dictationLauncherHovered = overLauncher;
                if (overLauncher)
                    dictationPillWindow.setIgnoreMouseEvents(false);
                else
                    restoreDictationClickThrough?.();
            }
            const nowInside = inside
                ? dx <= region.collapseHalfW && dy <= region.collapseHalfH
                : dx <= region.expandHalfW && dy <= region.expandHalfH;
            if (nowInside === inside)
                return;
            inside = nowInside;
            if (inside) {
                if (dictationCollapseTimer) {
                    clearTimeout(dictationCollapseTimer);
                    dictationCollapseTimer = null;
                }
                sendHover(true);
            }
            else {
                if (dictationCollapseTimer)
                    clearTimeout(dictationCollapseTimer);
                dictationCollapseTimer = setTimeout(() => {
                    dictationCollapseTimer = null;
                    if (!inside)
                        sendHover(false);
                }, DICTATION_COLLAPSE_GRACE_MS);
            }
        }
        catch (error) {
            electron_log_1.default.warn("[DictationPill] hover tracking failed:", error);
        }
    }, 60);
}
let dictationPillState = "idle";
function setDictationPillState(state, mode) {
    const wasIdle = dictationPillState === "idle";
    dictationPillState = state;
    if (state !== "idle")
        positionDictationPill();
    syncPillCardsForPillState(wasIdle, state);
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:state", state, mode);
    }
    (0, dictation_action_orb_window_1.sendDictationStateToActionOrbs)(state, mode);
}
function sendDictationLevel(level) {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:level", level);
    }
}
function sendDictationPhase(phase) {
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:phase", phase);
    }
}
function setDictationShortcutHint(hint) {
    dictationShortcutHint = hint;
    if (dictationPillView && !dictationPillView.webContents.isDestroyed()) {
        dictationPillView.webContents.send("dictation:shortcut", hint);
    }
}
function dictationAccessibilityPromptBounds() {
    return dictationPillWindow && !dictationPillWindow.isDestroyed()
        ? dictationPillWindow.getBounds()
        : getDictationPillBounds(dictationPillSide);
}
/** Hotkey pressed without permission: the guide is what the user needs now. */
function sendDictationNeedsAccessibility() {
    if (process.platform !== "darwin")
        return;
    (0, dictation_accessibility_window_1.showDictationAccessibilityPrompt)(dictationAccessibilityPromptBounds(), dictationPillSide);
    syncDictationPillCards();
}
function promptDictationAccessibilityIfNeeded() {
    if (process.platform !== "darwin")
        return;
    (0, dictation_accessibility_window_1.showDictationAccessibilityPromptIfNeeded)(dictationAccessibilityPromptBounds(), dictationPillSide);
    syncDictationPillCards();
}
//# sourceMappingURL=windowing.js.map
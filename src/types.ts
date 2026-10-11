import type {
  DictationBinding,
  DictationShortcutSnapshot,
} from "./dictation/dictation-binding";
import type { PolishBinding } from "./dictation/polish-binding";
import type {
  SpeakerParticipant,
  SpeakerSourceBridgeAPI,
  SpeakerSourceConfig,
  SpeakerSourceConfigInput,
  SpeakerSourceState,
  SpeakerSourceTelemetry,
} from "./speaker-source/types";

export type { DictationBinding, DictationShortcutSnapshot, PolishBinding };
export type {
  SpeakerParticipant,
  SpeakerSourceBridgeAPI,
  SpeakerSourceConfig,
  SpeakerSourceConfigInput,
  SpeakerSourceState,
  SpeakerSourceTelemetry,
};

export interface NotificationConfig {
  showProgress?: boolean;
  showCloseAlways?: boolean;
  timeout?: number;
}

/**
 * Notification API exposed to the renderer.
 */
export interface NotificationAPI {
  show: (
    title: string,
    body: string,
    actionUrl?: string,
    actionText?: string,
    notificationConfig?: NotificationConfig,
  ) => Promise<boolean>;
  showMeeting: (payload: MeetingNotificationPayload) => Promise<boolean>;
  showUpcoming: (
    payload: UpcomingMeetingNotificationPayload,
  ) => Promise<boolean>;
  showCalendarEvent: (
    payload: CalendarEventNotificationPayload,
  ) => Promise<boolean>;
  action: (actionUrl: string) => Promise<boolean>;
  close: (actionUrl?: string | null) => Promise<boolean>;
  focus: () => Promise<boolean>;
  reportHeight: (height: number) => Promise<boolean>;
}

export interface NotificationActionPayload {
  text: string;
  url: string;
  icon?: string;
}

export interface MeetingNotificationPayload {
  title: string;
  body: string;
  primaryAction: NotificationActionPayload;
  secondaryAction?: NotificationActionPayload;
  titleIcon?: string;
  orText?: string;
  notificationConfig?: NotificationConfig;
}

export interface UpcomingMeetingNotificationPayload {
  meetingName: string;
  eventId: string;
  iCalUID?: string;
  calendarType?: string;
  hasMeetingPrep: boolean;
  hasAutoJoin: boolean;
  prepUrl?: string;
  notificationConfig?: NotificationConfig;
}

export interface CalendarEventNotificationPayload {
  meetingName: string;
  eventId: string;
  timeLabel: string;
  primaryAction: NotificationActionPayload;
  menuAction?: NotificationActionPayload;
  notificationConfig?: NotificationConfig;
}

/**
 * Notifications event API for renderer-initiated navigation from notification actions.
 */
export interface NotificationsAPI {
  onNavigate: (callback: (path: string) => void) => () => void;
  onDismissed: (callback: (actionUrl: string) => void) => () => void;
}

/**
 * Window controls API exposed to the renderer.
 */
export interface WindowAPI {
  showMain: () => Promise<void>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  closeAndFocusMain: (options?: {
    skipNavigateHome?: boolean;
  }) => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  isMainWindow: () => boolean;
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => Promise<void>;
  resizeToContent: (width: number, height: number) => Promise<void>;
  snapToTop: () => Promise<void>;
  moveBy: (dx: number, dy: number) => Promise<void>;
  setContentProtection: (enable: boolean) => Promise<void>;
  // `mode` forces the initial live view mode (e.g. "compact" to pop out the
  // floating Live Assist bar directly); omit to use the user's saved preference.
  openLive: (url: string, mode?: LiveViewMode) => Promise<void>;
  getScaleFactor: () => Promise<number>;
  getZoomFactor: () => Promise<number>;
  onZoomFactorChanged: (callback: (zoomFactor: number) => void) => () => void;
}

/**
 * Live view modes for the floating Live window.
 */
export type LiveViewMode = "compact" | "full";

/**
 * API to control and observe the Live view mode.
 */
export interface LiveViewAPI {
  /** Which screen edge the floating bar is docked to. */
  getBarSide: () => Promise<DictationPillSide>;
  /** Fires when the floating bar snaps to a different edge. */
  onBarSide: (callback: (side: DictationPillSide) => void) => () => void;
  /** Asks the main process to dock the floating bar to an edge. */
  dockBar: (side: DictationPillSide) => void;
  /** Begins following the cursor after the renderer sees a drag gesture. */
  startBarDrag: () => void;
  /** Ends the drag; the bar snaps to the nearest edge. */
  endBarDrag: () => void;
  getMode: () => Promise<LiveViewMode>;
  // `persist` saves the mode as the user's preferred default for future
  // meetings. Only pass it for explicit user toggles, not system transitions.
  setMode: (mode: LiveViewMode, persist?: boolean) => Promise<void>;
  // The mode the user last explicitly selected, or null when never chosen.
  getPreferredMode: () => Promise<LiveViewMode | null>;
  // Saves the preferred default without switching the current view. Used when
  // the mode change is not a `setMode` call (e.g. the one-window model opens a
  // separate floating live window instead of switching an existing one).
  setPreferredMode: (mode: LiveViewMode) => Promise<void>;
  onModeChanged: (callback: (mode: LiveViewMode) => void) => () => void;
  isWindowAlive: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  showWindow: () => Promise<void>;
  getMeetingId: () => Promise<string | null>;
  enterFullscreen: () => Promise<void>;
  reparentToMain: () => Promise<boolean>;
  detachFromMain: () => Promise<void>;
  onReparentedToMain: (callback: () => void) => () => void;
  /**
   * Notify the main process that the main window's renderer navigated.
   * Used to tear down the post-meeting live overlay when the main window
   * navigates underneath it. No-op unless an overlay is currently reparented
   * onto the real main window.
   */
  notifyMainNavigated: () => void;
  /**
   * Notify the main process that the recording ended and the expanded Live
   * window is now showing the notepad in place. Switches the window's close
   * behavior from "collapse to compact" to a real close that focuses main.
   */
  notifyMeetingEndedInPlace: () => void;
}

/**
 * API to control the meeting end animation floating window.
 */
export interface MeetingEndAnimationAPI {
  show: () => Promise<void>;
  hide: () => Promise<void>;
}

export interface ChatInjectionResult {
  success: boolean;
  error?: string;
}

/**
 * Browser meeting detection API exposed to the renderer.
 */
export interface BrowserMeetingsAPI {
  onMeetingsChanged: (
    callback: (data: BrowserMeetingsData) => void,
  ) => () => void;
  scan: () => Promise<BrowserMeetingsData>;
  /**
   * Which browser has a Google Meet meeting open right now, asked on demand.
   * Unlike `scan`, the answer is not held back by the stability filtering that
   * suppresses a freshly opened tab, so it can gate an action taken now.
   */
  findGoogleMeetBrowser: () => Promise<GoogleMeetBrowserLookup>;
  /**
   * Whether Apple Events automation permission is available for Chromium browsers.
   * If true, AppleScript-based browser URL detection should be reliable and fast.
   */
  isAutomationAvailable: () => Promise<boolean>;
  /**
   * Send a consent message to a Google Meet chat via keyboard shortcuts.
   * Uses CGEvent to simulate Ctrl+Cmd+C (toggle chat) + clipboard paste.
   */
  sendChatMessage: (
    browser: BrowserName,
    message: string,
  ) => Promise<ChatInjectionResult>;
  /**
   * Send a consent message to Zoom native app chat via keyboard shortcuts.
   * Uses CGEvent to simulate Cmd+Shift+H (toggle chat) + clipboard paste.
   */
  sendZoomNativeChat: (message: string) => Promise<ChatInjectionResult>;
  /**
   * Whether the native keyboard module is available and has accessibility permission.
   */
  isKeyboardAvailable: () => Promise<boolean>;
  /**
   * Check if macOS Accessibility permission is granted.
   */
  checkAccessibilityPermission: () => Promise<boolean>;
  /**
   * Open macOS System Settings to the Accessibility permission pane.
   */
  openAccessibilitySettings: () => Promise<void>;
  /**
   * Force a macOS Accessibility permission request. Unlike
   * checkAccessibilityPermission, this registers the app in Privacy &
   * Security > Accessibility and surfaces the system prompt if not already
   * trusted. Returns the resulting trusted state.
   */
  requestAccessibilityPermission: () => Promise<boolean>;
}

/**
 * Browser meeting detection data structure.
 *
 * Note: This type is derived from the unified constants in
 * src/features/meeting-detection/constants.ts (BROWSERS_WITH_URL_SUPPORT).
 * Only includes browsers that support URL extraction via AppleScript.
 */
export type BrowserName =
  | "chrome"
  | "edge"
  | "brave"
  | "vivaldi"
  | "safari"
  | "arc"
  | "comet"
  | "chatgpt-atlas";

/**
 * Maps macOS process names to BrowserName.
 * Shared by main process (keyboard chat targeting) and renderer (dispatch routing).
 */
export const MACOS_PROCESS_TO_BROWSER: Record<string, BrowserName> = {
  "Google Chrome": "chrome",
  "Microsoft Edge": "edge",
  "Brave Browser": "brave",
  Vivaldi: "vivaldi",
  Safari: "safari",
  Arc: "arc",
  Comet: "comet",
  "ChatGPT Atlas": "chatgpt-atlas",
};

export type MeetingUrlWithBrowser = {
  url: string;
  browser: BrowserName;
};

/**
 * Which browser is hosting a Google Meet meeting right now.
 *
 * `browser: null` means two different things, so `readable` separates them: the
 * tabs were read and no meeting was open, versus the tabs could not be read at
 * all — Automation permission denied, or no browser answered. Only the first is
 * proof that there is no meeting.
 */
export type GoogleMeetBrowserLookup = {
  browser: BrowserName | null;
  readable: boolean;
};

/**
 * Windows-specific meeting detection info from window titles.
 * Used when direct URL access is not available.
 */
export interface WindowMeetingInfo {
  windowTitle: string;
  browser: BrowserName;
  meetingType: string;
  meetingCode?: string;
}

export interface BrowserMeetingsData {
  hasAnyMeeting: boolean;
  matchedUrls: string[];
  meetingsWithBrowser: MeetingUrlWithBrowser[];
  /**
   * True if Apple Events automation permission is available for Chromium browsers.
   * Used by the renderer to deprioritize/skip noisy audio-monitor events from browsers.
   * On Windows, whether the window-title addon loaded (no permission is involved).
   */
  automationAvailable?: boolean;
  /**
   * Windows-only: Meeting info detected from browser window titles.
   * Only populated on Windows where direct URL access is not available.
   */
  windowMeetings?: WindowMeetingInfo[];
}

/**
 * Recording API exposed to renderer process
 */
export interface RecordingTriggerPayload {
  source?: "notification" | "tray" | "manual" | "shortcut" | "pill";
  trigger?: "calendar_event";
  title?: string;
  processId?: number;
  processName?: string;
  parentProcessName?: string;
  parentProcessId?: number;
  platform?: string;
  displayName?: string;
  meetingUrl?: string;
  joinUrl?: string;
  calendarEventId?: string;
  iCalUID?: string;
}

export interface RecordingAPI {
  onStartRecording: (
    callback: (payload?: RecordingTriggerPayload) => void,
  ) => () => void;
}

export type DictationState = "idle" | "recording" | "processing";

export type DictationPillSide = "bottom" | "left" | "right" | "top";

/** What the floating pill is currently sitting over on screen. */
export type DictationPillBackdrop = "light" | "dark";

/**
 * How the pill presents to someone who has not made Talk theirs yet: the
 * normal launcher, an inert sliver under a "Try Talk" card, or not at all.
 */
export type DictationPillPresence = "interactive" | "teaser" | "hidden";

/** What the user did with the "Try Talk" card. */
export type DictationTeaserAction = "try" | "close";

/** The mailbox the Email Assistant card offers to connect. */
export type DictationEmailAssistantProvider = "gmail" | "outlook";

/** What the user did with the Email Assistant card. */
export type DictationEmailAssistantAction = "connect" | "close";

/** What the user did with the Slack Assistant card. */
export type DictationSlackAssistantAction = "connect" | "close";

/** What the user did with the pill-anchored feedback card. */
export type DictationFeedbackAction =
  | { type: "dismiss" }
  | {
      type: "submit";
      rating: number;
      comment: string;
      categories: string[];
      canQuote: boolean;
    };

/**
 * Which card is beside the pill. "intro" is the one that introduces Talk and
 * takes the pill over while it shows; a nudge such as "milestone" sits next to
 * a pill that still works, so it can be ignored.
 */
export type DictationTeaserVariant = "intro" | "milestone";

export interface DictationTeaserContent {
  variant: DictationTeaserVariant;
  /** The milestone just passed, named on the milestone card. */
  milestone?: string;
}

/**
 * Outcome of a dictation paste. `copiedToClipboard` means the keystroke went
 * out but nothing focused could take text, so the dictation was left on the
 * clipboard for a manual paste instead of being inserted.
 */
/** What ended a recording: the hotkey, the pill's stop button, or the app itself (time limit, lost mic). */
export type DictationStopSource = "hotkey" | "pill" | "auto";

export type DictationPasteResult = {
  success: boolean;
  error?: string;
  /** True when the guard dropped a duplicate without pasting. */
  skipped?: boolean;
  copiedToClipboard?: boolean;
  /**
   * The keystroke went out but its target could not be judged in time. It is
   * read again afterwards, and `onPasteMissed` reports a paste that landed
   * nowhere.
   */
  targetUnconfirmed?: boolean;
};

/**
 * Which push-to-talk mode a recording is in:
 * - "dictate": bare Fn — transcript is cleaned and pasted verbatim.
 * - "command": Fn+Shift — transcript is treated as a command to Fred, which
 *   uses the screen context to generate a response that's pasted instead.
 */
export type DictationMode = "dictate" | "command";

/**
 * The frontmost app/window at the moment a dictation started. Toggleable (see
 * useLocalSettings' `useScreenContextForDictation`, default true); used to
 * help Fred's cleanup pass get names/emails right.
 *
 * `visibleText` is read via the macOS Accessibility API (see
 * native-window-text-macos/) and can include the actual visible content of
 * that window — message text, participant names, anything rendered on
 * screen — not just its title bar. `siteUrl` is the address-bar URL when
 * dictating into a browser, also read via Accessibility, with the query
 * string removed. This is disclosed
 * explicitly in the Settings toggle's description; see
 * DictationSettingsUseScreenContext.tsx.
 */
export interface DictationScreenContext {
  appName: string;
  windowTitle: string;
  visibleText?: string;
  siteUrl?: string;
}

export interface DictationAPI {
  /**
   * Fires on macOS Fn-down to start silent mic capture before the hold is
   * confirmed. The start cue, pill, and Scribe session wait for `onStart`.
   */
  onCapture: (callback: () => void) => () => void;
  /**
   * Fires when a recording starts (Fn = "dictate", Fn+Shift = "command").
   * `handsFree` is true when the recording began already latched (pill mic
   * button) rather than as a push-to-talk hold.
   */
  onStart: (
    callback: (mode: DictationMode, handsFree: boolean) => void,
  ) => () => void;
  /**
   * Fires when Shift arrives during an in-progress push-to-talk hold so
   * command/action mode can still engage. Does not start a new recording.
   */
  onMode: (callback: (mode: DictationMode) => void) => () => void;
  /**
   * Fires when a double tap latches the recording into hands-free. Recording
   * already began on the first tap, so this says only that the gesture was a
   * double tap rather than a hold.
   */
  onLatched: (callback: () => void) => () => void;
  /**
   * Fires as the dictation hotkey physically goes down and up, independent of
   * whether that press starts, latches, or stops a recording.
   */
  onHotkeyHeld: (callback: (held: boolean) => void) => () => void;
  /** Fires when the dictation hotkey is released. Includes this stop's `pasteEpoch`. */
  onStop: (
    callback: (pasteEpoch: number, source: DictationStopSource) => void,
  ) => () => void;
  /** Sets the clipboard to `text` and pastes it. A second call with the same `pasteEpoch` is ignored. */
  paste: (text: string, pasteEpoch: number) => Promise<DictationPasteResult>;
  /** Fires in the floating pill window when a paste landed nowhere and the text was left on the clipboard. */
  onPasteFallbackToast: (callback: () => void) => () => void;
  /** Fires in the main window with the epoch of a paste found, after it was reported, to have landed nowhere. */
  onPasteMissed: (callback: (pasteEpoch: number) => void) => () => void;
  /** Reports a live mic amplitude sample (0-1) while recording, for the floating pill's waveform. */
  reportLevel: (level: number) => void;
  /** Fires in the floating pill window with the latest mic amplitude (0-1). */
  onLevel: (callback: (level: number) => void) => () => void;
  /** Reports the dictation state machine's current state (and mode), for the floating pill. */
  reportState: (state: DictationState, mode: DictationMode) => void;
  /** Fires in the floating pill window when the dictation state changes. */
  onState: (
    callback: (state: DictationState, mode: DictationMode) => void,
  ) => () => void;
  /** Reports a short processing sub-stage label (e.g. "Transcribing", "Thinking", "Pasting") for the pill. */
  reportPhase: (phase: string) => void;
  /** Reports that the microphone tracks were stopped, so paused media can resume. */
  reportCaptureReleased: () => void;
  /** Fires in the floating pill window with the latest processing sub-stage label. */
  onPhase: (callback: (phase: string) => void) => () => void;
  /** Fires in the main window when the user presses the polish shortcut. Includes this polish's `pasteEpoch`. */
  onPolishSelection: (
    callback: (text: string, pasteEpoch: number) => void,
  ) => () => void;
  /** Fires in the floating pill window when the cursor enters/leaves the pill (main-process hit-test), driving hover-to-expand. */
  onHover: (callback: (isHovered: boolean) => void) => () => void;
  /** Fires in the pill and main windows when the pill docks to a different screen edge. */
  onSide: (callback: (side: DictationPillSide) => void) => () => void;
  /** Fires in the floating pill window when a drag starts/ends. */
  onDragging: (callback: (dragging: boolean) => void) => () => void;
  /** Fires in the floating pill window when a live meeting starts or ends. */
  onMeetingActive: (callback: (active: boolean) => void) => () => void;
  /** Whether a meeting is running. Pulled on pill load so it cannot miss the push. */
  getMeetingActive: () => Promise<boolean>;
  /** Reports live transcript activity, for the meeting pill's meter. */
  reportMeetingActivity: (transcribing: boolean) => void;
  /** Fires in the floating pill window as transcript activity starts and stops. */
  onMeetingActivity: (callback: (transcribing: boolean) => void) => () => void;
  /** Brings the live bar back — the minimized meeting pill's press action. */
  showLiveBar: () => void;
  /** Current dock edge. Used on pill load so restore cannot miss the push event. */
  getSide: () => Promise<DictationPillSide>;
  /** Fires (in the main window) when a recording is cancelled — via Escape, Fn used as a modifier, or a click on the pill's cancel button — instead of being stopped normally. */
  onCancel: (callback: () => void) => () => void;
  /** Requests cancellation of an in-progress recording — called from the floating pill window. */
  requestCancel: () => void;
  /** Requests the start of a hands-free dictation — pill mic, or a double-tap of the hotkey. */
  requestStart: () => void;
  /**
   * Requests a new note-taking recording — the pill's notes half. Focuses the
   * main window and hands off to the same `start-recording` path the tray and
   * quick-note shortcut use.
   */
  requestStartNotes: () => void;
  /** Begins following the cursor after the renderer sees a drag gesture. */
  startManualDrag: () => void;
  /** Ends the manual drag; the pill snaps to the nearest edge. */
  endManualDrag: () => void;
  /** Holds the action-orb overlay interactive for the length of a drag. */
  startActionOrbDrag?: () => void;
  /** Ends that drag and lets the overlay go back to passing clicks through. */
  endActionOrbDrag?: () => void;
  /**
   * Where the pill sits inside the action-orb overlay, so a new orb can fly
   * out of it. Null when either window is not up.
   */
  getActionOrbSpawnPoint?: () => Promise<{ x: number; y: number } | null>;
  /**
   * The app renderer owns detached action runs and republishes the whole set
   * on every change; the orb overlay only ever renders the latest snapshot.
   */
  publishActionRuns?: (runs: unknown[]) => void;
  onActionRuns?: (callback: (runs: unknown[]) => void) => () => void;
  /**
   * Pastes a detached run's result into whatever the user has focused. The
   * overlay never takes focus, so the frontmost app is still theirs.
   */
  pasteActionResult?: (text: string) => Promise<DictationPasteResult>;
  /**
   * Opens a destination a run mentioned. The scheme is re-checked in the main
   * process — the address came from model output, not from us.
   */
  openActionLink?: (url: string) => Promise<boolean>;
  /**
   * Overlay → owner: republish everything. The overlay only receives future
   * snapshots, so a reload would otherwise show nothing until a run happens to
   * change.
   */
  requestActionRuns?: () => void;
  onActionRunsRequested?: (callback: () => void) => () => void;
  /**
   * Signing out or switching dictation off ends every detached run — they no
   * longer mirror the pill's gate, so nothing else would stop them.
   */
  onActionRunsAborted?: (callback: () => void) => () => void;
  /** Overlay → owner: the user has cleared this run. */
  dismissActionRun?: (id: string) => void;
  onActionRunDismissed?: (callback: (id: string) => void) => () => void;
  /** Requests that an in-progress recording stop and transcribe (finalize) — called from the pill's stop button. */
  /** Stops the recording; the pill's button by default, `"auto"` when the app stops it itself. */
  requestStop: (source?: Exclude<DictationStopSource, "hotkey">) => void;
  /** Shows the pill and enables the hotkey when signed in; hides both when signed out. */
  setEnabled: (enabled: boolean) => void;
  /** Shows or hides the floating pill without affecting the hotkey. */
  setPillVisible: (visible: boolean) => void;
  /** Rest the pill as a slim nub, or as a pill bearing the mark. */
  setPillMinimized: (minimized: boolean) => void;
  /** Docks the pill at the default spot of that screen edge, on the display it is on, and remembers it. */
  setPillSide: (side: DictationPillSide) => void;
  /** Fires in the floating pill window when that preference changes. */
  onPillMinimized: (callback: (minimized: boolean) => void) => () => void;
  /** Pulled on pill load so it cannot miss the push. */
  getPillMinimized: () => Promise<boolean>;
  /** Fires in the floating pill window when the screen under it turns light or dark. */
  onPillBackdrop: (
    callback: (backdrop: DictationPillBackdrop) => void,
  ) => () => void;
  /** Pulled on pill load so it cannot miss the push. */
  getPillBackdrop: () => Promise<DictationPillBackdrop>;
  /**
   * On by default (see useLocalSettings' `dictationPauseMediaEnabled`):
   * pause system Now Playing when dictation starts and resume when it stops.
   */
  setPauseMediaEnabled: (enabled: boolean) => void;
  /** Reads the frontmost app's name, window title, visible text, and browser URL — see DictationScreenContext. */
  getScreenContext: () => Promise<DictationScreenContext | null>;
  /** Current push-to-talk shortcut (label + hint for the pill). */
  getShortcut: () => Promise<DictationShortcutSnapshot>;
  /** Apply a custom or preset dictation shortcut and restart the hotkey listener. */
  setShortcut: (
    binding: DictationBinding,
  ) => Promise<DictationShortcutSnapshot>;
  /** Apply a custom or preset action-mode shortcut. Null clears it on Mac. */
  setActionShortcut: (
    binding: DictationBinding | null,
  ) => Promise<DictationShortcutSnapshot | null>;
  /** Apply the optional hands-free shortcut. Null clears it. */
  setHandsFreeShortcut: (
    binding: DictationBinding | null,
  ) => Promise<DictationBinding | null>;
  /** Master switch for action mode. Off disables both action-mode shortcuts. */
  setActionModeEnabled: (enabled: boolean) => void;
  /** Feature-flag gate for polish. Off ignores the polish shortcut. */
  setPolishActionEnabled: (enabled: boolean) => void;
  /** macOS only — Fn or modifier chord that rewrites the selected text. Null clears it. */
  setPolishShortcut: (
    binding: PolishBinding | null,
  ) => Promise<PolishBinding | null>;
  /** Pause dictation while settings records a shortcut. Windows swallows Win and side mouse buttons. */
  pauseHotkey: () => void;
  /** Resume the global dictation hotkey after shortcut capture ends. */
  resumeHotkey: () => void;
  /** Win pressed/released while recording a shortcut. */
  onCaptureWin: (callback: (down: boolean) => void) => () => void;
  /** Mouse 4/5 pressed/released while recording a shortcut. */
  onCaptureMouse: (
    callback: (
      button: 4 | 5,
      down: boolean,
      flags?: {
        altKey: boolean;
        ctrlKey: boolean;
        metaKey: boolean;
        shiftKey: boolean;
      },
    ) => void,
  ) => () => void;
  /**
   * Fn pressed/released while recording a shortcut. macOS only — Chromium
   * exposes no modifier flag for Fn, so the Globe listener reports it.
   */
  onCaptureFn: (callback: (down: boolean) => void) => () => void;
  /** macOS only — virtual key code pressed with Fn while recording. */
  onCaptureFnChord: (callback: (keyCode: number) => void) => () => void;
  /** Fires in the floating pill when the dictation shortcut hint changes. */
  onShortcutChanged: (callback: (hint: string) => void) => () => void;
  /** macOS only — whether Accessibility is granted for paste and the hotkey. */
  hasAccessibilityPermission: () => Promise<boolean>;
  /** Opens System Settings to Privacy & Security → Accessibility. */
  openAccessibilitySettings: () => Promise<void>;
  /** Closes the standalone Accessibility guide window. */
  closeAccessibilityPrompt: () => void;
  /** Main window: how the pill should present for this user right now. */
  setPillPresence: (presence: DictationPillPresence) => void;
  /** Fires in the pill window when the "Try Talk" card appears or goes. */
  onTeaser: (callback: (active: boolean) => void) => () => void;
  /** Pulled on pill load so it cannot miss the push. */
  getTeaser: () => Promise<boolean>;
  /** Main window only: what the card beside the pill should say, if anything. */
  setTeaserContent: (content: DictationTeaserContent | null) => void;
  /** Card window only. */
  onTeaserContent: (
    callback: (content: DictationTeaserContent | null) => void,
  ) => () => void;
  /** Card window only. */
  getTeaserContent: () => Promise<DictationTeaserContent | null>;
  /** Called from the "Try Talk" card with what the user chose. */
  reportTeaserAction: (action: DictationTeaserAction) => void;
  /** Fires in the main window with the user's choice on the "Try Talk" card. */
  onTeaserAction: (
    callback: (action: DictationTeaserAction) => void,
  ) => () => void;
  /** Fires in the main window each time the "Try Talk" card comes on screen. */
  onTeaserShown: (callback: () => void) => () => void;
  /** Main window: whether the pill-anchored feedback card should be on screen. */
  setFeedbackPopoverActive: (active: boolean) => void;
  /** Called from the feedback card with what the user did on it. */
  reportFeedbackAction: (action: DictationFeedbackAction) => void;
  /** Fires in the main window with the user's action on the feedback card. */
  onFeedbackAction: (
    callback: (action: DictationFeedbackAction) => void,
  ) => () => void;
  /** Fires in the main window each time the feedback card comes on screen. */
  onFeedbackPopoverShown: (callback: () => void) => () => void;
  /**
   * Main window: offer the pill-anchored Email Assistant card for this
   * mailbox, or take it down with null. Resolves to whether that state
   * now holds.
   */
  setEmailAssistantNudgeActive: (
    provider: DictationEmailAssistantProvider | null,
  ) => Promise<boolean>;
  /** Pulled by the Email Assistant card on load: the mailbox it offers. */
  getEmailAssistantNudgeProvider: () => Promise<DictationEmailAssistantProvider | null>;
  /** Called from the Email Assistant card with what the user chose. */
  reportEmailAssistantNudgeAction: (
    action: DictationEmailAssistantAction,
  ) => void;
  /** Fires in the main window with the user's choice on the Email Assistant card. */
  onEmailAssistantNudgeAction: (
    callback: (action: DictationEmailAssistantAction) => void,
  ) => () => void;
  /** Fires in the main window each time the Email Assistant card comes on screen. */
  onEmailAssistantNudgeShown: (callback: () => void) => () => void;
  /**
   * Main window: offer the pill-anchored Slack Assistant card, or take it
   * down. Resolves to whether that state now holds.
   */
  setSlackAssistantNudgeActive: (active: boolean) => Promise<boolean>;
  /** Called from the Slack Assistant card with what the user chose. */
  reportSlackAssistantNudgeAction: (
    action: DictationSlackAssistantAction,
  ) => void;
  /** Fires in the main window with the user's choice on the Slack Assistant card. */
  onSlackAssistantNudgeAction: (
    callback: (action: DictationSlackAssistantAction) => void,
  ) => () => void;
  /** Fires in the main window each time the Slack Assistant card comes on screen. */
  onSlackAssistantNudgeShown: (callback: () => void) => () => void;
}

export type RecordingContextState = "inactive" | "recording" | "paused";

export type ConsentDeliveryStatus = "idle" | "pending" | "delivered" | "failed";

export interface RecordingContextSnapshot {
  meetingId?: string;
  finalizingMeetingId?: string;
  isFinalizing?: boolean;
  isStarting?: boolean;
  title?: string;
  notesPrivacy?: string;
  state: RecordingContextState;
  enableSystemAudio?: boolean;
  defaultShowLiveAssist?: boolean;
  defaultShowNotes?: boolean;
  isDemo?: boolean;
  consentDelivery?: ConsentDeliveryStatus;
  audioConsentDelivery?: ConsentDeliveryStatus;
  platform?: string;
}

export interface RecordingContextUpdate {
  meetingId: string;
  title?: string;
  notesPrivacy?: string;
}

export type VirtualCameraUnsupportedReason =
  | "os-version"
  /** macOS only: system extensions install only from /Applications. */
  | "not-in-applications"
  /** Windows only: the build shipped without the native camera payload. */
  | "payload-missing";

export interface VirtualCameraStatus {
  /** macOS 12.3+ from /Applications, or Windows with the payload present. */
  supported: boolean;
  /** The camera device is installed: an activated system extension on macOS, a
   * registered DirectShow filter on Windows. */
  installed: boolean;
  /** macOS only. Windows registration needs no approval, so it is never true. */
  awaitingApproval: boolean;
  /** How many apps are currently consuming the Fireflies camera. */
  consumers: number;
  relayHealthy: boolean;
  /**
   * Physical cameras in use outside the Fireflies Camera at this instant — the
   * consuming app's name on Windows, the device's on macOS.
   *
   * Only populated while a recording is running with the notice enabled, since
   * that is the only time it can change anything. A non-empty list means the
   * meeting is being filmed through a camera that carries no recording notice.
   */
  camerasInUse: string[];
  unsupportedReason?: VirtualCameraUnsupportedReason;
  /** OS-reported reason the camera device could not be installed, if any. */
  lastError?: string;
}

export interface VirtualCameraBridgeAPI {
  getStatus: () => Promise<VirtualCameraStatus>;
  /** Enables the camera device; macOS may require approval in System Settings. */
  enable: () => Promise<VirtualCameraStatus>;
  disable: () => Promise<VirtualCameraStatus>;
  onStatusChanged: (
    callback: (status: VirtualCameraStatus) => void,
  ) => () => void;
}

/**
 * A meeting was renamed in one window. Broadcast so every other window's
 * surfaces (home banners, live header, notepad) show the new title without
 * waiting for a server refetch — each renderer holds its own Apollo cache and
 * stores, so nothing crosses the process boundary on its own.
 */
export interface MeetingTitleUpdate {
  meetingId: string;
  title: string;
  /**
   * Set when a failed rename is being rolled back: the title that never
   * persisted. Receivers only revert surfaces still holding it, so a stale
   * failure can't clobber a newer rename.
   */
  revertedFrom?: string;
}

export interface MeetingBridgeAPI {
  broadcastTitleUpdate: (update: MeetingTitleUpdate) => void;
  onTitleUpdated: (
    callback: (update: MeetingTitleUpdate) => void,
  ) => () => void;
}

/** Reply the recorder renderer sends for any main-process request. */
export interface RecorderAckResult {
  meetingId?: string;
  success: boolean;
}

export interface RecordingContextBridgeAPI {
  get: () => Promise<RecordingContextSnapshot | null>;
  sync: (snapshot: RecordingContextSnapshot | null) => void;
  requestUpdate: (update: RecordingContextUpdate) => void;
  onUpdated: (
    callback: (snapshot: RecordingContextSnapshot | null) => void,
  ) => () => void;
  onUpdateRequested: (
    callback: (update: RecordingContextUpdate) => void,
  ) => () => void;
  stop: (meetingId?: string) => Promise<boolean>;
  onStopRequested: (
    callback: (payload?: {
      meetingId?: string;
      /** True when the stop is part of app shutdown. */
      forShutdown?: boolean;
    }) => void,
  ) => () => void;
  notifyStopCompleted: (payload: RecorderAckResult) => void;
  // Stop the recorder without uploading or finalizing the meeting.
  discardRecording: (meetingId?: string) => Promise<boolean>;
  onDiscardRequested: (
    callback: (payload?: { meetingId?: string }) => void,
  ) => () => void;
  // Acknowledge that the recorder has finished discarding, so the main process
  // can resolve the pending discardRecording() call once teardown is complete.
  notifyDiscarded: (payload: RecorderAckResult) => void;
  notifyEnded: (payload: { meetingId: string }) => void;
  onEnded: (callback: (payload: { meetingId: string }) => void) => () => void;
  togglePauseResume: () => void;
  onTogglePauseResumeRequested: (callback: () => void) => () => void;
  setInputDevice: (deviceId: string) => void;
  onSetInputDeviceRequested: (
    callback: (deviceId: string) => void,
  ) => () => void;
}

/**
 * Audio event data structure from the native audio monitor.
 */
export interface AudioEvent {
  type: "mic_started" | "mic_stopped";
  processName: string;
  processID: number;
  parentProcessName?: string;
  parentProcessID?: number;
  timestamp: string;
  /** Enriched by main process: meeting URL if detected from browser */
  meetingUrl?: string;
  /** Enriched by main process: browser name if process is a known browser */
  browserName?: string;
  /** True if main process attempted URL lookup (even if no URL found) */
  enriched?: boolean;
}

/**
 * Audio event handler function type.
 */
export type AudioEventHandler = (event: AudioEvent) => void;

/**
 * Audio monitor API exposed to the renderer.
 */
export interface AudioMonitorAPI {
  start: () => Promise<boolean>;
  stop: () => Promise<boolean>;
  isActive: () => Promise<boolean>;
  requestSystemAudioPermission: () => Promise<boolean>;
  onAudioEvent: (callback: AudioEventHandler) => () => void;
}

/**
 * Result from enabling audio loopback.
 */
export interface AudioLoopbackEnableResult {
  /** Whether loopback was successfully enabled */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** macOS screen recording permission status if relevant */
  permissionStatus?: string;
}

export interface AudioLoopbackEnableOptions {
  /** Windows only: capture all output devices via process loopback instead of the default endpoint */
  loopbackAllDevices?: boolean;
}

/**
 * Audio loopback configuration.
 */
export interface AudioLoopbackConfig {
  /**
   * Whether CoreAudioTap is being used for system audio capture.
   * - true: Uses CoreAudioTap (macOS 14.2+), requires kTCCServiceAudioCapture permission
   * - false: Uses ScreenCaptureKit (older macOS), requires screen recording permission
   */
  forceCoreAudioTap: boolean;
}

/**
 * Audio loopback API for capturing system audio.
 * Uses Chromium's audio loopback feature for system audio capture.
 */
export interface AudioLoopbackAPI {
  /**
   * Enable audio loopback capturing for system audio.
   * Must be called before calling getDisplayMedia to capture system audio.
   * On macOS, requires screen recording permission.
   * @returns Result indicating success/failure and permission status
   */
  enable: (
    options?: AudioLoopbackEnableOptions,
  ) => Promise<AudioLoopbackEnableResult>;

  /**
   * Disable audio loopback capturing.
   * Restores normal getDisplayMedia functionality.
   */
  disable: () => Promise<void>;

  /**
   * Get the current audio loopback configuration.
   * Use this to determine which capture method is active and adjust
   * getDisplayMedia constraints accordingly.
   */
  getConfig: () => Promise<AudioLoopbackConfig>;

  /**
   * Check if CoreAudioTap should be used for system audio capture.
   * Returns true on macOS 14.2+ where CoreAudioTap is available.
   * Used to determine video constraint for getDisplayMedia:
   * - CoreAudioTap: video: false (audio-only)
   * - ScreenCaptureKit: video: true (needs video initially)
   */
  shouldUseCoreAudioTap: () => Promise<boolean>;
}

export type StreamingConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "CLOSING"
  | "ERROR";

export interface StreamingStartPayload {
  baseUrl: string;
  meetingId: string;
  source?: string;
  intentions?: string[];
  language?: string;
  emitTranscripts?: boolean;
  userId?: string;
  platform?: string;
}

export interface StreamingErrorPayload {
  message: string;
  /** Stable code from the streaming client, e.g. "STREAMING_AUTH_FAILED". */
  code?: string;
  /**
   * True when streaming has stopped for good. Non-terminal errors are followed
   * by a reconnect attempt, so they must not be shown to the user.
   */
  terminal: boolean;
}

/** Answers main's token requests; returning null/throwing fails the attempt. */
export type StreamingTokenProvider = () => Promise<string | null>;

export interface StreamingStartResult {
  success: boolean;
  error?: string;
  /** Set when the failure is terminal, e.g. "STREAMING_AUTH_FAILED". */
  code?: string;
}

export interface StreamingAPI {
  start: (config: StreamingStartPayload) => Promise<StreamingStartResult>;
  sendChunk: (chunk: ArrayBuffer | Uint8Array) => void;
  sendMicActivity: (
    micActivity: Array<{ time: number; micState: "on" | "off" }>,
  ) => void;
  /**
   * Gracefully terminates the stream. Flushes any pending audio chunks
   * and signals the server that the media stream has ended, allowing
   * the server to complete processing before closing the connection.
   */
  end: () => Promise<void>;
  /**
   * Immediately terminates the stream. Aborts the connection and discards
   * any pending data without waiting for server acknowledgment. Use this
   * for user-initiated cancellation or error recovery.
   */
  stop: () => Promise<void>;
  onStateChange: (
    callback: (state: StreamingConnectionState) => void,
  ) => () => void;
  onError: (callback: (error: StreamingErrorPayload) => void) => () => void;
  onComplete: (callback: (data: unknown) => void) => () => void;
  onTranscript: (callback: (data: unknown) => void) => () => void;
  /**
   * Registers the renderer as the source of access tokens: main asks for one
   * before every connect and reconnect, so a long meeting never dials with the
   * token it started with. The renderer owns refreshing and auth state; main
   * only ever sees the resulting access token.
   */
  onTokenRequest: (provider: StreamingTokenProvider) => () => void;
  /** Null while no stream is open. */
  getHealth: () => Promise<StreamingHealth | null>;
}

/** The main-process side of a stream, as the recording heartbeat reports it. */
export interface StreamingHealth {
  wsState: string;
  wsBytesSent: number;
  wsChunksSent: number;
  wsChunksFailed: number;
  wsBytesDropped: number;
  wsReconnectAttempts: number;
  /** Transcript messages received over the socket this session. */
  transcriptEvents: number;
  /**
   * Sentences, each counted once. A sentence is re-sent as it grows, under
   * the same parseId, so this and transcriptChars take its latest form.
   */
  transcriptSegments: number;
  transcriptChars: number;
  /** Milliseconds since the last transcript message; null before the first. */
  transcriptAgeMs: number | null;
}

/**
 * Permission types supported by the app.
 * - microphone: Access to the device microphone
 * - screen: Screen recording permission (for video capture)
 * - systemAudio: System audio capture (kTCCServiceAudioCapture, macOS 14.2+ only)
 */
export type PermissionType = "microphone" | "screen" | "systemAudio";

/**
 * Permission status values.
 */
export type PermissionStatus =
  | "granted"
  | "denied"
  | "restricted"
  | "unknown"
  | "not-determined";

/**
 * State of all permissions.
 */
export interface PermissionState {
  microphone: PermissionStatus;
  screen: PermissionStatus;
  systemAudio: PermissionStatus;
}

/**
 * Permissions API exposed to the renderer.
 */
export interface PermissionsAPI {
  check: (type: PermissionType) => Promise<PermissionStatus>;
  checkAll: () => Promise<PermissionState>;
  request: (type: PermissionType) => Promise<boolean>;
  openSettings: (type: PermissionType) => Promise<void>;
}

export type SystemIdleState = "active" | "idle" | "locked" | "unknown";

export type WindowDisplayState = "visible" | "minimized" | "hidden";

/**
 * How the calling window is shown and what powers the machine. Both change
 * how Windows schedules the app; reported with recording diagnostics.
 */
export interface WindowPowerState {
  /** null when the caller is not hosted in a BrowserWindow. */
  windowState: WindowDisplayState | null;
  onBatteryPower: boolean;
}

/** One of the app's processes, from app.getAppMetrics(). */
export interface ProcessHealthSample {
  /** Electron process type, with the service for utilities: "Utility:audio.mojom.AudioService". */
  type: string;
  pid: number;
  /** CPU used since the previous reading; 100 is one full core. */
  cpuPercent: number;
  /** Private bytes on Windows, working set elsewhere. */
  memoryMB: number;
}

/**
 * The machine and the app's processes as a heartbeat sees them. Read beside
 * the audio clock ratio: a starved CPU slows the render loop the same way a
 * coarse timer does, and these numbers tell the two apart.
 */
export interface ProcessHealth {
  /** Kernel release: the Windows build ("10.0.26100") or Darwin ("24.3.0"). */
  osRelease: string;
  /** Marketed version: the same build on Windows, "15.3.1" on macOS. */
  osVersion: string;
  arch: string;
  cpuCount: number;
  cpuModel: string;
  memoryTotalMB: number;
  /** Memory not held by applications or the disk cache. */
  memoryAvailableMB: number;
  /** 0 on macOS, which reports no swap. */
  swapUsedMB: number;
  /** All app processes together; 100 is one full core. */
  appCpuPercent: number;
  appMemoryMB: number;
  processCount: number;
  /** The calling renderer, which hosts the recording. */
  rendererCpuPercent: number | null;
  rendererMemoryMB: number | null;
  processes: ProcessHealthSample[];
}

/**
 * "unthrottled" opts the recording's processes out of Windows power
 * throttling (EcoQoS); "default" hands them back to the system.
 */
export type PowerPolicyMode = "unthrottled" | "default";

/**
 * Power throttling of one process as the kernel reports it after the policy
 * call: "system" means Windows decides, "throttled" that it is forced on.
 * Before Windows 11 22H2 the kernel cannot be asked, so a write reports what
 * it set and a query reports "unreported". "absent" is a process that does
 * not exist yet, "unsupported" an addon or Windows build without the call.
 */
export type PowerThrottlingState =
  | "unthrottled"
  | "throttled"
  | "system"
  | "unreported"
  | "absent"
  | "unsupported"
  | "error";

/** The processes that carry a recording: main, its renderer, Chromium's audio service. */
export interface RecordingPowerPolicy {
  main: PowerThrottlingState;
  renderer: PowerThrottlingState;
  audioService: PowerThrottlingState;
}

/**
 * App settings API exposed to the renderer.
 */
export interface AppAPI {
  setLoginItemSettings: (enable: boolean) => Promise<void>;
  getLoginItemSettings: () => Promise<boolean>;
  setQuickNoteShortcut: (enabled: boolean, key: string) => Promise<void>;
  getSystemIdleState: (
    idleThresholdSeconds?: number,
  ) => Promise<SystemIdleState>;
  getWindowPowerState: () => Promise<WindowPowerState>;
  getProcessHealth: () => Promise<ProcessHealth>;
  /**
   * Applies the recording power policy to main, the calling renderer and the
   * audio service, and reports what is in force. Null off Windows.
   */
  setRecordingPowerPolicy: (
    mode: PowerPolicyMode,
  ) => Promise<RecordingPowerPolicy | null>;
}

/**
 * Update status information.
 */
export interface UpdateInfo {
  version: string;
  releaseName?: string | null;
  releaseNotes?: string | null;
}

export interface UpdateStatus {
  updateAvailable: boolean;
  updateDownloaded: boolean;
  updateInfo: UpdateInfo | null;
  updateError: string | null;
  currentVersion: string;
  postUpdateReleaseNotes: UpdateInfo | null;
  /**
   * False when the app cannot replace its own bundle — e.g. a .pkg or
   * MDM-managed install owned by root. The updater UI hides update controls.
   */
  selfUpdateSupported: boolean;
}

export interface TrayCalendarEvent {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  fredAdded: boolean;
  url?: string | null;
  meetingId?: string | null;
  iCalUID?: string | null;
  hasMeetingPrep?: boolean;
}

export interface TrayLiveMeeting {
  meetingId: string;
  title: string;
  url?: string | null;
}

export interface TrayCalendarState {
  upcomingEvents: TrayCalendarEvent[];
  liveMeetings: TrayLiveMeeting[];
}

/**
 * Unified renderer→main calendar payload. A single sync feeds both the tray
 * menu and the auto-updater's restart-blocking logic so they can never drift
 * apart and the renderer only crosses the IPC boundary once per change.
 */
export interface DesktopCalendarSyncState {
  events: TrayCalendarEvent[];
  liveMeetings: TrayLiveMeeting[];
  isLoadingEvents: boolean;
}

export interface CalendarBridgeAPI {
  sync: (
    state: DesktopCalendarSyncState,
  ) => Promise<{ success: boolean; error?: string }>;
}

export interface TrayBridgeAPI {
  onOpenInviteModal: (callback: (url?: string) => void) => () => void;
  onInviteBotDirectly: (callback: (url: string) => void) => () => void;
}

/**
 * Auto-updater API exposed to the renderer.
 */
export interface UpdaterAPI {
  getVersion: () => Promise<string>;
  getStatus: () => Promise<UpdateStatus>;
  checkForUpdates: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean; error?: string }>;
  clearPostUpdateReleaseNotes: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  onStatusChanged: (callback: (status: UpdateStatus) => void) => () => void;
}

/**
 * Shell API for opening files and folders in the system file browser.
 */
export interface ShellAPI {
  showItemInFolder: (path: string) => void;
  openPath: (path: string) => Promise<string>;
}

/**
 * File stat information returned by fs.stat
 */
export interface FileStat {
  size: number;
  mtime: number;
  isDirectory: boolean;
  isFile: boolean;
}

/**
 * File system API for recording storage in Electron.
 * Uses Node's fs module for reliable file operations.
 */
export interface FsAPI {
  /**
   * Get the recordings directory path (in app's userData).
   */
  getRecordingsDir: () => Promise<string>;

  /**
   * Get the logs directory path.
   */
  getLogsDir: () => Promise<string>;

  /**
   * Ensure a directory exists, creating it if necessary.
   */
  mkdir: (path: string) => Promise<void>;

  /**
   * Write data to a file, creating it if it doesn't exist.
   */
  writeFile: (path: string, data: ArrayBuffer) => Promise<void>;

  /**
   * Append data to a file.
   */
  appendFile: (path: string, data: ArrayBuffer) => Promise<void>;

  /**
   * Read a file as ArrayBuffer.
   */
  readFile: (path: string) => Promise<ArrayBuffer>;

  /**
   * Read a byte range from a file.
   */
  readFileRange: (
    path: string,
    start: number,
    length: number,
  ) => Promise<ArrayBuffer>;

  /**
   * Get file stats.
   */
  stat: (path: string) => Promise<FileStat | null>;

  /**
   * Check if a file exists.
   */
  exists: (path: string) => Promise<boolean>;

  /**
   * Delete a file.
   */
  unlink: (path: string) => Promise<void>;

  /**
   * List files in a directory.
   */
  readdir: (path: string) => Promise<string[]>;
}

/**
 * Panel IDs for glass underlays.
 * Can be any string identifier - use descriptive names for debugging.
 */
export type PanelId = string;

/**
 * Glass underlay rectangle definition.
 */
export interface GlassRect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  appearance?: "dark" | "light" | "vibrantDark" | "vibrantLight" | "auto";
}

/**
 * Glass API for managing native blur underlays behind panels.
 * Available on macOS (NSVisualEffectView) and Windows (DWM Blur/Acrylic).
 */
export interface GlassAPI {
  upsert: (id: PanelId, rect: GlassRect) => void;
  hide: (id: PanelId) => void;
  remove: (id: PanelId) => void;
  getWindowPosition: () => Promise<{ x: number; y: number }>;
}

/**
 * Logger API for sending logs from renderer to main process.
 * Logs are written to files in the application directory.
 */
export interface LoggerAPI {
  write: (
    level: "info" | "warning" | "error" | "debug",
    tag: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) => void;
  getLogFiles: () => Promise<string[]>;
}

/**
 * Sentry config bridged from the preload context.
 * Provides DSN and release to @sentry/browser in the React app.
 */
export interface SentryAPI {
  dsn: string;
  release: string;
  setUser: (user: Record<string, unknown> | null) => void;
  setContext: (name: string, context: Record<string, unknown> | null) => void;
  setTag: (key: string, value: string) => void;
}

export interface CloudLogAPI {
  onFlush: (
    callback: (
      batch: Array<{
        level: string;
        tag: string;
        message: string;
        metadata?: Record<string, unknown>;
      }>,
    ) => void,
  ) => () => void;
}

/**
 * Clipboard API backed by Electron's native clipboard in the main process.
 */
export interface ClipboardAPI {
  writeText: (text: string) => Promise<void>;
  writeHtml: (html: string, text: string) => Promise<void>;
  writeMarkdown: (text: string) => Promise<void>;
  /** PNG data URL, written to the clipboard as an image, with an optional
   * caption written alongside it as text. */
  writeImage: (dataUrl: string, text?: string) => Promise<boolean>;
}

/**
 * Network reachability bridge. The probe runs in the main process (proxy-aware
 * Electron `net`; the renderer cannot open raw sockets) and reports whether we
 * can reach Fireflies / the internet by racing hardcoded HTTPS anchors.
 */
export interface NetworkAPI {
  isReachable: () => Promise<boolean>;
}

/**
 * Audio playback API for playing consent sounds through system speakers.
 */
export interface AudioPlaybackAPI {
  getConsentMessageData: () => Promise<Uint8Array | null>;
}

/**
 * Electron API exposed to the renderer process via contextBridge.
 * Provides secure access to platform information and native capabilities.
 */
export interface ElectronAPI {
  /**
   * The operating system platform.
   * @returns 'darwin' for macOS, 'win32' for Windows, 'linux' for Linux
   */
  readonly platform: NodeJS.Platform;

  /**
   * The OS version, e.g. "15.1.0" on macOS or "10.0.26200" on Windows. The
   * user agent can't stand in for it: Chromium freezes macOS there at 10.15.7.
   */
  readonly osVersion: string;

  /**
   * The packaged app's version, e.g. "0.5.50". Read this rather than
   * `Config.VERSION` on desktop: `expo-application` has no native version to
   * report on web, so that constant is always its "0.0.0" fallback here.
   */
  readonly appVersion: string;

  /**
   * Secure authentication token for the local CORS proxy.
   * Only accessible to the Electron app's renderer process.
   * External clients cannot obtain this token.
   */
  readonly proxyAuthToken: string;

  /**
   * The actual port the CORS proxy is running on.
   * May differ from the default (3033) if that port was already in use.
   * Returns null if proxy is not running (e.g., in dev mode).
   */
  readonly proxyPort: number | null;

  /**
   * Notification API for showing desktop notifications.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.notification) {
   *   const success = await window.electron.notification.show("Title", "Body", "/action-url");
   * }
   */
  readonly notification: NotificationAPI;
  /**
   * Notification events API for handling navigation on the renderer side.
   */
  readonly notifications: NotificationsAPI;

  /**
   * Window controls API for managing the application window.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.window) {
   *   await window.electron.window.minimize();
   * }
   */
  readonly window: WindowAPI;

  /**
   * Controls the Live window's view mode (compact/full) and notifies on changes.
   */
  readonly liveView: LiveViewAPI;

  /**
   * Controls the meeting end animation floating window.
   */
  readonly meetingEndAnimation?: MeetingEndAnimationAPI;

  /**
   * Browser meeting detection API for monitoring active meeting tabs.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.browserMeetings) {
   *   const cleanup = window.electron.browserMeetings.onMeetingsChanged((data) => {
   *     console.log('Meeting detected:', data);
   *   });
   * }
   */
  readonly browserMeetings: BrowserMeetingsAPI;

  /**
   * Recording API for triggering instant recording.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.recording) {
   *   const cleanup = window.electron.recording.onStartRecording(() => {
   *     console.log('Start recording triggered from tray');
   *   });
   * }
   */
  readonly recording: RecordingAPI;

  /**
   * Dictation: global-hotkey mic recording, ElevenLabs Scribe transcription
   * (renderer), and paste-into-focused-app.
   */
  readonly dictation: DictationAPI;

  /**
   * Recording context bridge for syncing recording state across windows.
   */
  readonly recordingContext: RecordingContextBridgeAPI;

  /**
   * Virtual camera bridge. Controls the "Fireflies Watermark" device that shows a
   * recording notice on the user's video on macOS and Windows.
   */
  readonly virtualCamera: VirtualCameraBridgeAPI;

  /** Who is talking in an open Google Meet tab (macOS only). */
  readonly speakerSource: SpeakerSourceBridgeAPI;

  /**
   * Meeting metadata bridge for syncing renames across windows.
   */
  readonly meeting: MeetingBridgeAPI;

  /**
   * Audio monitor API for monitoring system audio processes.
   * Only available when running in Electron environment on macOS.
   * @example
   * if (window?.electron?.audioMonitor) {
   *   const success = await window.electron.audioMonitor.start();
   *   const cleanup = window.electron.audioMonitor.onAudioEvent((event) => {
   *     console.log('Audio event:', event);
   *   });
   * }
   */
  readonly audioMonitor: AudioMonitorAPI;

  /**
   * Audio playback API for playing consent sounds.
   * Only available when running in Electron environment.
   */
  readonly audio?: AudioPlaybackAPI;

  /**
   * Audio loopback API for capturing system audio on macOS and Windows.
   * Uses Chromium's built-in audio loopback capability for stable system audio capture.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.audioLoopback) {
   *   await window.electron.audioLoopback.enable();
   *   // Now system audio can be captured in MediaRecorder
   *   await window.electron.audioLoopback.disable();
   * }
   */
  readonly audioLoopback: AudioLoopbackAPI;

  /**
   * Real-time streaming bridge for sending PCM from renderer to main (Node WS).
   * Only available in Electron. Guard before use in web.
   */
  readonly streaming?: StreamingAPI;

  /**
   * Cloud log forwarding — receives batched main-process log entries from the
   * main process so the renderer can forward them to the cloud logging service.
   */
  readonly cloudLog?: CloudLogAPI;

  /**
   * Permissions API for checking and requesting system permissions.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.permissions) {
   *   const status = await window.electron.permissions.check('microphone');
   *   if (status !== 'granted') {
   *     await window.electron.permissions.request('microphone');
   *   }
   * }
   */
  readonly permissions: PermissionsAPI;

  /**
   * Native clipboard writes routed through the main process, so copying works
   * regardless of renderer focus or Web Clipboard API permission state.
   */
  readonly clipboard?: ClipboardAPI;

  /**
   * Network reachability checks (main-process TCP-connect probe).
   */
  readonly network: NetworkAPI;

  /**
   * App settings API for configuring application behavior.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.app) {
   *   await window.electron.app.setLoginItemSettings(true);
   *   const enabled = await window.electron.app.getLoginItemSettings();
   * }
   */
  readonly app: AppAPI;

  /**
   * Auto-updater API for checking and installing updates.
   * Only available when running in Electron environment.
   * @example
   * if (window?.electron?.updater) {
   *   const status = await window.electron.updater.getStatus();
   *   if (status.updateAvailable) {
   *     await window.electron.updater.checkForUpdates();
   *   }
   * }
   */
  readonly updater: UpdaterAPI;

  /**
   * Glass API for managing native blur underlays behind UI panels.
   * Only available when running in Electron environment on macOS.
   * @example
   * if (window?.electron?.glass) {
   *   window.electron.glass.upsert('liveAssist', { x: 100, y: 100, width: 440, height: 445, radius: 8 });
   * }
   */
  readonly glass: GlassAPI;

  /**
   * Logger API for sending logs from renderer to main process.
   * Logs are written to files in the application directory.
   * @example
   * if (window?.electron?.logger) {
   *   window.electron.logger.write('info', 'MyComponent', 'Something happened', { userId: 123 });
   * }
   */
  readonly logger: LoggerAPI;

  /**
   * Shell API for opening files and folders in the system file browser.
   * @example
   * if (window?.electron?.shell) {
   *   window.electron.shell.showItemInFolder('/path/to/file.log');
   * }
   */
  readonly shell: ShellAPI;

  /**
   * File system API for recording storage.
   * Uses Node's fs module for reliable file operations instead of OPFS/IndexedDB.
   * @example
   * if (window?.electron?.fs) {
   *   const dir = await window.electron.fs.getRecordingsDir();
   *   await window.electron.fs.writeFile(`${dir}/recording.webm`, data);
   * }
   */
  readonly fs: FsAPI;

  /**
   * Listen for stop glass sync events from main process (e.g., when window is closing).
   * Returns a cleanup function to remove the listener.
   * @example
   * const cleanup = window.electron.onStopGlassSync(() => {
   *   console.log('Glass sync stopped');
   * });
   */
  readonly onStopGlassSync?: (callback: () => void) => () => void;

  /**
   * Listen for resume glass sync events from main process (e.g., when window is shown).
   * Returns a cleanup function to remove the listener.
   * @example
   * const cleanup = window.electron.onResumeGlassSync(() => {
   *   console.log('Glass sync resumed');
   * });
   */
  readonly onResumeGlassSync?: (callback: () => void) => () => void;

  /**
   * Listen for window focus events from main process.
   * Useful for refreshing data when user returns to the app.
   * Returns a cleanup function to remove the listener.
   * @example
   * const cleanup = window.electron.onWindowFocus(() => {
   *   refetch();
   * });
   */
  readonly onWindowFocus?: (callback: () => void) => () => void;

  /**
   * Trigger a refetch in the main window from another window.
   * Useful for cross-window cache synchronization.
   */
  readonly triggerMainRefetch?: () => void;

  /**
   * Ask the main window renderer to navigate to Live screen for a meeting.
   * This does not focus the main window.
   */
  readonly navigateMainToLive?: (meetingId: string) => void;

  /**
   * Ask the main window renderer to navigate to an in-app route (e.g.
   * "/DesktopNotepad/<id>?ref=instant_summary"). Reuses the same handler as
   * deeplinks and focuses the main window. Any post-meeting live overlay is torn
   * down automatically once the main window navigates.
   */
  readonly navigateMainToRoute?: (route: string) => void;

  /**
   * Listen for refetch trigger events from other windows.
   * Returns a cleanup function to remove the listener.
   */
  readonly onTriggerRefetch?: (callback: () => void) => () => void;

  /**
   * Hide a live meeting from the main window's list.
   * Called from live window when meeting ends to immediately remove it from the list.
   */
  readonly notifyLiveMeetingEnded?: (meetingId: string) => void;

  /**
   * Listen for hide live meeting events from other windows.
   * Returns a cleanup function to remove the listener.
   */
  readonly onLiveMeetingEnded?: (
    callback: (meetingId: string) => void,
  ) => () => void;

  /**

   * Listen for window blur events from main process.
   * Useful for closing popovers when the window loses focus.
   * Returns a cleanup function to remove the listener.
   * @example
   * const cleanup = window.electron.onWindowBlur(() => {
   *   closePopover();
   * });
   */
  readonly onWindowBlur?: (callback: () => void) => () => void;

  /** Listen for window minimize events (minimized to dock). */
  readonly onWindowMinimize?: (callback: () => void) => () => void;

  /** Listen for window restore events (restored from dock). */
  readonly onWindowRestore?: (callback: () => void) => () => void;

  /** Query whether the main window is currently in native fullscreen. */
  readonly isWindowFullscreen?: () => Promise<boolean>;

  /**
   * Listen for native fullscreen enter/leave on the main window.
   * Returns a cleanup function to remove the listener.
   */
  readonly onWindowFullscreenChange?: (
    callback: (isFullscreen: boolean) => void,
  ) => () => void;

  /** Listen for user becoming active (unlock-screen / resume from idle). */
  readonly onUserBecameActive?: (callback: () => void) => () => void;

  /**
   * Listen for display changes when window moves between monitors.
   * Returns a cleanup function to remove the listener.
   */
  readonly onDisplayChanged?: (
    callback: (scaleFactor: number, displayId: number) => void,
  ) => () => void;

  /**
   * Listen for navigate to home events from other windows.
   * Returns a cleanup function to remove the listener.
   * @example
   * const cleanup = window.electron.onNavigateToHome(() => {
   *   navigation.navigate('Home');
   * });
   */
  readonly onNavigateToHome?: (callback: () => void) => () => void;

  /**
   * Listen for deeplink-driven route navigation without a full page reload.
   * The route is the path portion of the fireflies:// URL (e.g. "/MainDesktop").
   */
  readonly onNavigateToRoute?: (
    callback: (route: string) => void,
  ) => () => void;

  /**
   * Listen for navigate to live events from other windows.
   * Returns a cleanup function to remove the listener.
   */
  readonly onNavigateToLive?: (
    callback: (meetingId: string) => void,
  ) => () => void;

  /**
   * Clear the host resolver (DNS) cache.
   * Best effort - may not affect renderer process DNS cache due to Electron limitations.
   * Useful for forcing fresh DNS resolution when reconnecting to services.
   * This helps to reconnect to a new realtime-ff pod in case previous one is killed.
   * @example
   * if (window?.electron?.clearHostResolverCache) {
   *   await window.electron.clearHostResolverCache();
   * }
   */
  readonly clearHostResolverCache?: () => Promise<void>;

  /** Sentry error reporting bridged from preload (@sentry/electron/renderer). */
  readonly sentry: SentryAPI;

  /**
   * Calendar state sync — push calendar + live-meeting state to the main
   * process once per change so the tray menu/title and the auto-updater's
   * restart-blocking logic stay current from a single source.
   */
  readonly calendar?: CalendarBridgeAPI;

  /** Tray invite callbacks pushed from the main process to the renderer. */
  readonly tray?: TrayBridgeAPI;
}

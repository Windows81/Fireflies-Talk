import { getCalendars } from "expo-localization";
import { Platform } from "react-native";
import { RouteNames } from "@/constants/route";

export function getTimeZone() {
  return getCalendars()?.[0]?.timeZone;
}

export const getActualPlatform = () => {
  if (window?.electron) {
    return window.electron.platform; // darwin, win32, linux
  } else {
    return Platform.OS; // web, ios, android
  }
};

export const getActualPlatformFriendly = () => {
  if (window?.electron) {
    if (window.electron.platform === "darwin") {
      return "macos";
    } else if (window.electron.platform === "win32") {
      return "windows";
    } else {
      return window.electron.platform; // darwin, win32, linux
    }
  } else {
    return Platform.OS === "web" ? "mobile-web" : Platform.OS; // mobile-web, ios, android
  }
};

export const isDesktop = Boolean(window?.electron);

// Native iOS/Android only. Platform.OS "web" matches desktop too, so
// isDesktop is the backstop.
export const isMobile = Platform.OS !== "web" && !isDesktop;

export function isWindowsDesktop(): boolean {
  return getActualPlatform() === "win32";
}
let cachedIsMainWindow: boolean | null = null;

/**
 * Mark this window as the main window (e.g. after reparenting to the main window).
 * Overrides the cached value used by isMainDesktopWindow().
 */
export function markAsMainDesktopWindow(): void {
  cachedIsMainWindow = true;
}

/**
 * Clear the cached window identity so the next call to isMainDesktopWindow()
 * re-queries the main process via IPC. Useful after reparenting when the
 * window role has changed.
 */
export function resetMainDesktopWindowCache(): void {
  cachedIsMainWindow = null;
}

/**
 * Check if CoreAudioTap should be used for system audio capture.
 * Only applicable on macOS 14.2+ in desktop environment.
 *
 * CoreAudioTap:
 * - Uses kTCCServiceAudioCapture permission
 * - No video capture needed (video: false in getDisplayMedia)
 * - No scary screen recording warning
 *
 * ScreenCaptureKit (older macOS):
 * - Uses screen recording permission
 * - Requires video: true initially
 * - Shows screen recording warning to user
 *
 * @returns Promise<boolean> - true if CoreAudioTap should be used, false otherwise
 */
export const shouldUseCoreAudioTap = async (): Promise<boolean> => {
  if (!isDesktop || !window?.electron?.audioLoopback?.shouldUseCoreAudioTap) {
    return false;
  }
  return window.electron.audioLoopback.shouldUseCoreAudioTap();
};

/**
 * Check if this is the main application window (not a floating window).
 * Prefer Electron's window identity when available.
 * Falls back to route-based detection when identity is unavailable.
 */
/**
 * The dictation pill is a standalone always-on-top window that loads
 * `/dictation-pill`. It must not run main-app GraphQL bootstrap or toasts —
 * those queries fail visibly in a 260px overlay (see FeatureFlagProvider and
 * auth-retry-link).
 */
export function isDictationPillWindow(): boolean {
  if (!isDesktop) return false;
  try {
    return window.location.pathname === "/dictation-pill";
  } catch {
    return false;
  }
}

/** The "Try Talk" card's own window beside the pill, on macOS and Windows. */
export function isTalkPillTeaserWindow(): boolean {
  if (!isDesktop) return false;
  try {
    return window.location.pathname === "/dictation-talk-teaser";
  } catch {
    return false;
  }
}

/** The tenth-dictation feedback card's own window beside the pill. */
export function isDictationFeedbackWindow(): boolean {
  if (!isDesktop) return false;
  try {
    return window.location.pathname === "/dictation-feedback";
  } catch {
    return false;
  }
}

export function isDictationEmailAssistantWindow(): boolean {
  if (!isDesktop) return false;

  try {
    return window.location.pathname === "/dictation-email-assistant";
  } catch {
    return false;
  }
}

/** The Slack Assistant card's own window beside the pill. */
export function isDictationSlackAssistantWindow(): boolean {
  if (!isDesktop) return false;

  try {
    return window.location.pathname === "/dictation-slack-assistant";
  } catch {
    return false;
  }
}

/** Dedicated macOS overlay above the grabber — never the pill host. */
export function isAccessibilityPromptWindow(): boolean {
  if (!isDesktop) return false;
  if (getActualPlatform() !== "darwin") return false;
  try {
    return window.location.pathname === "/dictation-accessibility";
  } catch {
    return false;
  }
}

/**
 * The detached action orbs live in their own always-on-top window in the corner
 * of the screen. Like the pill, it must skip the main-app bootstrap — GraphQL
 * and toasts have nowhere to go in an overlay this small.
 */
export function isActionOrbsWindow(): boolean {
  if (!isDesktop) return false;
  try {
    return window.location.pathname === "/dictation-action-orbs";
  } catch {
    return false;
  }
}

export function isMainDesktopWindow(): boolean {
  if (!isDesktop) return false;

  try {
    if (cachedIsMainWindow !== null) {
      return cachedIsMainWindow;
    }

    const isMain = window?.electron?.window?.isMainWindow?.();
    if (typeof isMain === "boolean") {
      cachedIsMainWindow = isMain;
      return isMain;
    }
  } catch {
    // fall back to route-based detection below
  }

  try {
    const path = window?.location?.pathname;
    const isRootPath = path === "/" || path === `/${RouteNames.MainDesktop}`;

    return isRootPath;
  } catch {
    return false;
  }
}

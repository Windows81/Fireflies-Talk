export const MACOS_TRAFFIC_LIGHT_INSET = 94;
export const DEFAULT_WINDOW_CHROME_INSET = 16;
/** Vertical room the macOS window buttons need before content can start. */
export const MACOS_TITLEBAR_INSET = 40;

export const isMacDesktop =
  typeof window !== "undefined" && window.electron?.platform === "darwin";

export function getWindowChromeLeftInset(isFullscreen: boolean): number {
  return isMacDesktop && !isFullscreen
    ? MACOS_TRAFFIC_LIGHT_INSET
    : DEFAULT_WINDOW_CHROME_INSET;
}

/** Top inset for content that would otherwise sit under the window buttons. */
export function getWindowChromeTopInset(): number {
  return isMacDesktop ? MACOS_TITLEBAR_INSET : DEFAULT_WINDOW_CHROME_INSET;
}

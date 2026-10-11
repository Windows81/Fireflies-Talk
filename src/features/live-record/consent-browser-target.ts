import type { BrowserName, GoogleMeetBrowserLookup } from "electron/src/types";

/**
 * Which browser, if any, should receive the Google Meet consent message.
 *
 * Sending it is not a passive act: the main process hides Fireflies, pulls the
 * browser to the front, sends Ctrl+Cmd+C, pastes and presses Enter. Doing that
 * to a browser with no meeting in it steals the user's focus and types into
 * whatever happened to be focused, so a target has to be earned by evidence.
 */

export interface BrowserConsentTargetInput {
  /** What the browser listener knows about open Google Meet meetings. */
  lookup: GoogleMeetBrowserLookup;
  /** Browser hosting a detected meeting whose URL could not be read. */
  detectedBrowser?: BrowserName;
  /** Browser owning the process the recorded microphone belongs to. */
  micBrowser?: BrowserName;
}

/** A target to send to, or the reason there is none. */
export type BrowserConsentTarget =
  | { browser: BrowserName; reason: "meet-tab-open" | "tabs-unreadable" }
  | { browser: null; reason: "no-meet-tab" | "no-browser-candidate" };

export function resolveBrowserConsentTarget({
  lookup,
  detectedBrowser,
  micBrowser,
}: BrowserConsentTargetInput): BrowserConsentTarget {
  // The browser holding the meeting outranks the one holding the mic: a meeting
  // joined in a second browser is where the chat panel actually is.
  if (lookup.browser) {
    return { browser: lookup.browser, reason: "meet-tab-open" };
  }

  // Tabs were readable and held no meeting. That is a real answer — respect it.
  if (lookup.readable) {
    return { browser: null, reason: "no-meet-tab" };
  }

  // Tabs are unreadable, so a confirmed URL is unobtainable. Mic activity in a
  // browser is the only evidence left; without it there is nothing to aim at.
  const candidate = detectedBrowser ?? micBrowser;
  if (!candidate) {
    return { browser: null, reason: "no-browser-candidate" };
  }
  return { browser: candidate, reason: "tabs-unreadable" };
}

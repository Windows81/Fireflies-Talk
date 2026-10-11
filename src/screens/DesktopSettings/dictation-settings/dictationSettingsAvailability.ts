import type { DesktopSettingsContent } from "../../types";

/**
 * The route can still point at Dictation after Talk stops being offered under
 * it (a stale param, or the flag poll flipping mid-session); Notetaker takes
 * over so the header and the pane never disagree.
 */
export function resolveDesktopSettingsContent(
  requested: DesktopSettingsContent | undefined,
  dictationOffered: boolean,
): DesktopSettingsContent {
  if (requested === "dictation" && !dictationOffered) {
    return "meeting-preference";
  }
  return requested ?? "meeting-preference";
}

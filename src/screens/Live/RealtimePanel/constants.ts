import { Breakpoint } from "@/styles";

export type LeftTab = "notes" | "live-assist";
export type RightTab = "ask-fred" | "transcript";

// Centered notes column width (Arjan/Surya feedback). The default live window
// is sized so this column, the assistant pane, and body gutters all fit.
export const RTP_NOTES_COLUMN_MAX_WIDTH = 680;
export const RTP_BODY_PADDING_LEFT = 40;
export const RTP_BODY_PADDING_RIGHT = 16;

export const rtpNotesColumnPadding = (breakpoint: Breakpoint): number => {
  if (breakpoint === Breakpoint.Large) return 40;
  if (breakpoint === Breakpoint.Medium) return 24;
  return 16;
};

export const LEFT_TAB: Record<"NOTES" | "LIVE_ASSIST", LeftTab> = {
  NOTES: "notes",
  LIVE_ASSIST: "live-assist",
};

export const RIGHT_TAB: Record<"ASK_FRED" | "TRANSCRIPT", RightTab> = {
  ASK_FRED: "ask-fred",
  TRANSCRIPT: "transcript",
};

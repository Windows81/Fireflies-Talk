import type { DictationPillSide } from "../types";
import {
  DICTATION_PILL_SIDE_RAIL_INSET,
  DICTATION_PILL_TOOLTIP_MAX_WIDTH,
  dictationPillBottomRailInset,
} from "./dictation-pill-layout";

/**
 * The "Ready to paste" toast renders inside the pill's own host window,
 * in the room the host already keeps past the capsule for its tooltip. These
 * are its measurements, shared with the renderer so the two agree.
 */
export const DICTATION_PILL_TOAST_PADDING_Y = 6;
export const DICTATION_PILL_TOAST_LINE_HEIGHT = 16;
export const DICTATION_PILL_TOAST_KEYCAP_PAD_Y = 1;
/** A single "<label> · <keys>" line. */
export const DICTATION_PILL_TOAST_HEIGHT =
  DICTATION_PILL_TOAST_PADDING_Y * 2 + DICTATION_PILL_TOAST_LINE_HEIGHT;
export const DICTATION_PILL_TOAST_MAX_WIDTH = DICTATION_PILL_TOOLTIP_MAX_WIDTH;
/** Air between the pill and the toast it hangs off. */
export const DICTATION_PILL_TOAST_GAP = 4;

export type DictationPillToastPlatform = "win32" | "darwin";

export type DictationPillToastAnchor = {
  justifyContent: "flex-start" | "center" | "flex-end";
  alignItems: "flex-start" | "center" | "flex-end";
};

/**
 * Room between the docked edge and the toast that is not the pill itself: the
 * rail inset the pill sits at, plus the gap. The pill's thickness comes on top
 * (see `dictationPillToastDepth`) — it changes with the pill's shape, and the
 * toast keeps hugging whichever shape the pill wears while the toast is up.
 */
export function dictationPillToastInset(
  side: DictationPillSide,
  platform: DictationPillToastPlatform,
): number {
  const railInset =
    side === "left" || side === "right"
      ? DICTATION_PILL_SIDE_RAIL_INSET
      : dictationPillBottomRailInset(platform);
  return railInset + DICTATION_PILL_TOAST_GAP;
}

/** Where the toast's near edge sits, measured from the docked edge. */
export function dictationPillToastDepth(
  side: DictationPillSide,
  platform: DictationPillToastPlatform,
  pillThickness: number,
): number {
  return dictationPillToastInset(side, platform) + pillThickness;
}

/** Flex anchoring that pins the toast to the pill end of its slot. */
export function getDictationPillToastAnchor(
  side: DictationPillSide,
): DictationPillToastAnchor {
  switch (side) {
    case "bottom":
      return { justifyContent: "flex-end", alignItems: "center" };
    case "top":
      return { justifyContent: "flex-start", alignItems: "center" };
    case "left":
      return { justifyContent: "center", alignItems: "flex-start" };
    case "right":
      return { justifyContent: "center", alignItems: "flex-end" };
  }
}

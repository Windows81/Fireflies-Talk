import {
  DICTATION_PILL_CARD_ARROW_LENGTH as ARROW_LENGTH,
  DICTATION_PILL_CARD_ARROW_OVERLAP as ARROW_OVERLAP,
  DICTATION_PILL_CARD_ARROW_SPAN as ARROW_SPAN,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type { DictationPillSide } from "electron/src/types";
import type { ViewStyle } from "react-native";

/**
 * Shared geometry for the pill-anchored cards (the "Try Talk" teaser and the
 * feedback popover): the card and its arrow lie along the axis facing the
 * pill, so the arrow always hangs off the edge nearest it.
 */
export function pillCardRootDirection(side: DictationPillSide): ViewStyle {
  return side === "left" || side === "right"
    ? { flexDirection: "row" }
    : { flexDirection: "column" };
}

/**
 * The card hugs the pill-facing edge of its window. A window is sized for the
 * tallest card it may show (the feedback details step, the introduction), so a
 * shorter card must sit against that edge or its arrow would drift off the
 * pill. The gutter on the facing axis leaves room for the arrow tip, which
 * lands GAP from the pill's rail.
 */
export function pillCardEdgeAlignment(
  side: DictationPillSide,
  gutterX: number,
  gutterY: number,
): ViewStyle {
  switch (side) {
    case "bottom":
      return { justifyContent: "flex-end", paddingBottom: gutterY };
    case "top":
      return { justifyContent: "flex-start", paddingTop: gutterY };
    case "left":
      return {
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingLeft: gutterX,
      };
    case "right":
      return {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingRight: gutterX,
      };
  }
}

/** Invisible spacer reserving the arrow's footprint past the card's edge. */
export function pillCardArrowPlacement(side: DictationPillSide): ViewStyle {
  const sideways = side === "left" || side === "right";
  const margin = {
    bottom: { marginTop: -ARROW_OVERLAP },
    top: { marginBottom: -ARROW_OVERLAP },
    left: { marginRight: -ARROW_OVERLAP },
    right: { marginLeft: -ARROW_OVERLAP },
  };
  return {
    width: sideways ? ARROW_LENGTH : ARROW_SPAN,
    height: sideways ? ARROW_SPAN : ARROW_LENGTH,
    ...margin[side],
  };
}

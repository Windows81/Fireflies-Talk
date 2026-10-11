import type { DictationPillSide } from "../types";
import {
  getDictationPillAnchorBounds,
  type PillRect,
} from "./dictation-pill-layout";

/**
 * A transparent window that hangs off the pill on the side it is docked to,
 * with its visible card `gap` away from the pill's rail. The gutters are the
 * transparent margin the window keeps around that card on each axis, so the
 * card — not the window — is what sits `gap` from the pill.
 */
export type PillAnchoredSurface = {
  width: number;
  height: number;
  gap: number;
  gutterX: number;
  gutterY: number;
};

export const DICTATION_A11Y_PROMPT_WIDTH = 360;
export const DICTATION_A11Y_PROMPT_HEIGHT = 210;
export const DICTATION_A11Y_PROMPT_CARD_WIDTH = 320;
export const DICTATION_A11Y_PROMPT_GAP = 8;
export const DICTATION_A11Y_PROMPT_GUTTER_X = Math.floor(
  (DICTATION_A11Y_PROMPT_WIDTH - DICTATION_A11Y_PROMPT_CARD_WIDTH) / 2,
);
export const DICTATION_A11Y_PROMPT_GUTTER_Y = 4;

/** The arrow hangs past the card's edge, pointing at the pill. Shared by every pill-anchored card. */
export const DICTATION_PILL_CARD_ARROW_LENGTH = 11;
export const DICTATION_PILL_CARD_ARROW_OVERLAP = 4;
export const DICTATION_PILL_CARD_ARROW_SPAN = 20;

export const DICTATION_TALK_TEASER_CARD_WIDTH = 314;
export const DICTATION_TALK_TEASER_CARD_HEIGHT = 130;
export const DICTATION_TALK_TEASER_GAP = 6;
export const DICTATION_TALK_TEASER_WIDTH =
  DICTATION_TALK_TEASER_CARD_WIDTH +
  DICTATION_PILL_CARD_ARROW_LENGTH -
  DICTATION_PILL_CARD_ARROW_OVERLAP +
  20;
export const DICTATION_TALK_TEASER_HEIGHT =
  DICTATION_TALK_TEASER_CARD_HEIGHT +
  DICTATION_PILL_CARD_ARROW_LENGTH -
  DICTATION_PILL_CARD_ARROW_OVERLAP +
  20;
// The card and its arrow sit centred in the window, so the gutter on the axis
// facing the pill is whatever the window has left past the arrow's tip.
export const DICTATION_TALK_TEASER_GUTTER_X = Math.floor(
  (DICTATION_TALK_TEASER_WIDTH -
    DICTATION_TALK_TEASER_CARD_WIDTH -
    DICTATION_PILL_CARD_ARROW_LENGTH +
    DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2,
);
export const DICTATION_TALK_TEASER_GUTTER_Y = Math.floor(
  (DICTATION_TALK_TEASER_HEIGHT -
    DICTATION_TALK_TEASER_CARD_HEIGHT -
    DICTATION_PILL_CARD_ARROW_LENGTH +
    DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2,
);

export const DICTATION_EMAIL_ASSISTANT_CARD_WIDTH =
  DICTATION_TALK_TEASER_CARD_WIDTH;

export const DICTATION_EMAIL_ASSISTANT_CARD_HEIGHT =
  DICTATION_TALK_TEASER_CARD_HEIGHT;

export const DICTATION_EMAIL_ASSISTANT_GAP = DICTATION_TALK_TEASER_GAP;
export const DICTATION_EMAIL_ASSISTANT_WIDTH = DICTATION_TALK_TEASER_WIDTH;
export const DICTATION_EMAIL_ASSISTANT_HEIGHT = DICTATION_TALK_TEASER_HEIGHT;

export const DICTATION_EMAIL_ASSISTANT_GUTTER_X =
  DICTATION_TALK_TEASER_GUTTER_X;

export const DICTATION_EMAIL_ASSISTANT_GUTTER_Y =
  DICTATION_TALK_TEASER_GUTTER_Y;

export const DICTATION_SLACK_ASSISTANT_CARD_WIDTH =
  DICTATION_TALK_TEASER_CARD_WIDTH;

export const DICTATION_SLACK_ASSISTANT_CARD_HEIGHT =
  DICTATION_TALK_TEASER_CARD_HEIGHT;

export const DICTATION_SLACK_ASSISTANT_GAP = DICTATION_TALK_TEASER_GAP;
export const DICTATION_SLACK_ASSISTANT_WIDTH = DICTATION_TALK_TEASER_WIDTH;
export const DICTATION_SLACK_ASSISTANT_HEIGHT = DICTATION_TALK_TEASER_HEIGHT;

export const DICTATION_SLACK_ASSISTANT_GUTTER_X =
  DICTATION_TALK_TEASER_GUTTER_X;

export const DICTATION_SLACK_ASSISTANT_GUTTER_Y =
  DICTATION_TALK_TEASER_GUTTER_Y;

export const DICTATION_FEEDBACK_CARD_WIDTH = 320;
// Sized for the low-rating details step; the window takes the tallest step
// and shorter steps hug its pill-facing edge.
export const DICTATION_FEEDBACK_CARD_HEIGHT = 224;
/** The high-rating details step: same layout, a shorter chip list. */
export const DICTATION_FEEDBACK_POSITIVE_CARD_HEIGHT = 270;
const DICTATION_FEEDBACK_MAX_CARD_HEIGHT = Math.max(
  DICTATION_FEEDBACK_CARD_HEIGHT,
  DICTATION_FEEDBACK_POSITIVE_CARD_HEIGHT,
);
export const DICTATION_FEEDBACK_GAP = 6;
export const DICTATION_FEEDBACK_WIDTH =
  DICTATION_FEEDBACK_CARD_WIDTH +
  DICTATION_PILL_CARD_ARROW_LENGTH -
  DICTATION_PILL_CARD_ARROW_OVERLAP +
  20;
export const DICTATION_FEEDBACK_HEIGHT =
  DICTATION_FEEDBACK_MAX_CARD_HEIGHT +
  DICTATION_PILL_CARD_ARROW_LENGTH -
  DICTATION_PILL_CARD_ARROW_OVERLAP +
  20;
// The card hugs the pill-facing edge rather than centring, so this gutter is
// exactly the space the overlay leaves past the arrow's tip on that axis.
export const DICTATION_FEEDBACK_GUTTER_X = Math.floor(
  (DICTATION_FEEDBACK_WIDTH -
    DICTATION_FEEDBACK_CARD_WIDTH -
    DICTATION_PILL_CARD_ARROW_LENGTH +
    DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2,
);
export const DICTATION_FEEDBACK_GUTTER_Y = Math.floor(
  (DICTATION_FEEDBACK_HEIGHT -
    DICTATION_FEEDBACK_MAX_CARD_HEIGHT -
    DICTATION_PILL_CARD_ARROW_LENGTH +
    DICTATION_PILL_CARD_ARROW_OVERLAP) /
    2,
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// The card's page renders at the window's zoom, so the window is sized in
// the same scale.
function scalePillAnchoredSurface(
  surface: PillAnchoredSurface,
  zoom: number,
): PillAnchoredSurface {
  if (zoom === 1) return surface;
  return {
    width: Math.round(surface.width * zoom),
    height: Math.round(surface.height * zoom),
    gap: Math.round(surface.gap * zoom),
    gutterX: Math.round(surface.gutterX * zoom),
    gutterY: Math.round(surface.gutterY * zoom),
  };
}

export function getPillAnchoredBounds(
  pill: PillRect,
  side: DictationPillSide,
  workArea: PillRect,
  surface: PillAnchoredSurface,
  minimized: boolean,
  zoom = 1,
): PillRect {
  const { width, height, gap, gutterX, gutterY } = scalePillAnchoredSurface(
    surface,
    zoom,
  );
  const visual = getDictationPillAnchorBounds(pill, side, minimized);
  let x: number;
  let y: number;

  switch (side) {
    case "left":
      x = visual.x + visual.width + gap - gutterX;
      y = pill.y + Math.floor((pill.height - height) / 2);
      break;
    case "right":
      x = visual.x - width - gap + gutterX;
      y = pill.y + Math.floor((pill.height - height) / 2);
      break;
    case "top":
      x = pill.x + Math.floor((pill.width - width) / 2);
      y = visual.y + visual.height + gap - gutterY;
      break;
    case "bottom":
      x = pill.x + Math.floor((pill.width - width) / 2);
      y = visual.y - height - gap + gutterY;
      break;
  }

  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;
  return {
    x: clamp(x, workArea.x, maxX),
    y: clamp(y, workArea.y, maxY),
    width,
    height,
  };
}

export function getDictationAccessibilityPromptBounds(
  pill: PillRect,
  side: DictationPillSide,
  workArea: PillRect,
  minimized: boolean,
  zoom = 1,
): PillRect {
  return getPillAnchoredBounds(
    pill,
    side,
    workArea,
    {
      width: DICTATION_A11Y_PROMPT_WIDTH,
      height: DICTATION_A11Y_PROMPT_HEIGHT,
      gap: DICTATION_A11Y_PROMPT_GAP,
      gutterX: DICTATION_A11Y_PROMPT_GUTTER_X,
      gutterY: DICTATION_A11Y_PROMPT_GUTTER_Y,
    },
    minimized,
    zoom,
  );
}

export function getDictationTalkTeaserBounds(
  pill: PillRect,
  side: DictationPillSide,
  workArea: PillRect,
  minimized: boolean,
  zoom = 1,
): PillRect {
  return getPillAnchoredBounds(
    pill,
    side,
    workArea,
    {
      width: DICTATION_TALK_TEASER_WIDTH,
      height: DICTATION_TALK_TEASER_HEIGHT,
      gap: DICTATION_TALK_TEASER_GAP,
      gutterX: DICTATION_TALK_TEASER_GUTTER_X,
      gutterY: DICTATION_TALK_TEASER_GUTTER_Y,
    },
    minimized,
    zoom,
  );
}

export function getDictationEmailAssistantBounds(
  pill: PillRect,
  side: DictationPillSide,
  workArea: PillRect,
  minimized: boolean,
  zoom = 1,
): PillRect {
  return getPillAnchoredBounds(
    pill,
    side,
    workArea,
    {
      width: DICTATION_EMAIL_ASSISTANT_WIDTH,
      height: DICTATION_EMAIL_ASSISTANT_HEIGHT,
      gap: DICTATION_EMAIL_ASSISTANT_GAP,
      gutterX: DICTATION_EMAIL_ASSISTANT_GUTTER_X,
      gutterY: DICTATION_EMAIL_ASSISTANT_GUTTER_Y,
    },
    minimized,
    zoom,
  );
}

export function getDictationSlackAssistantBounds(
  pill: PillRect,
  side: DictationPillSide,
  workArea: PillRect,
  minimized: boolean,
  zoom = 1,
): PillRect {
  return getPillAnchoredBounds(
    pill,
    side,
    workArea,
    {
      width: DICTATION_SLACK_ASSISTANT_WIDTH,
      height: DICTATION_SLACK_ASSISTANT_HEIGHT,
      gap: DICTATION_SLACK_ASSISTANT_GAP,
      gutterX: DICTATION_SLACK_ASSISTANT_GUTTER_X,
      gutterY: DICTATION_SLACK_ASSISTANT_GUTTER_Y,
    },
    minimized,
    zoom,
  );
}

export function getDictationFeedbackPopoverBounds(
  pill: PillRect,
  side: DictationPillSide,
  workArea: PillRect,
  minimized: boolean,
  zoom = 1,
): PillRect {
  return getPillAnchoredBounds(
    pill,
    side,
    workArea,
    {
      width: DICTATION_FEEDBACK_WIDTH,
      height: DICTATION_FEEDBACK_HEIGHT,
      gap: DICTATION_FEEDBACK_GAP,
      gutterX: DICTATION_FEEDBACK_GUTTER_X,
      gutterY: DICTATION_FEEDBACK_GUTTER_Y,
    },
    minimized,
    zoom,
  );
}

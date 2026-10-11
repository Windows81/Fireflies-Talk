import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { MilestoneShareCard } from "./milestoneCardGeometry";
import {
  CENTRE,
  CONTENT_WIDTH,
  FONT_STACK,
  paintBackground,
} from "./milestoneCardGeometry";
import { paintPill } from "./milestoneCardPill";

export {
  MILESTONE_CARD_HEIGHT,
  MILESTONE_CARD_WIDTH,
} from "./milestoneCardGeometry";
export type { MilestoneShareCard } from "./milestoneCardGeometry";

const STAT_LABEL_Y = 244;
const STAT_VALUE_Y = 348;
const STAT_GUTTER = 128;

/** Label over figure, measured so the pair can be centred as one block. */
const measureStat = (
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
) => {
  ctx.save();
  ctx.letterSpacing = "3px";
  ctx.font = `700 24px ${FONT_STACK}`;
  const labelWidth = ctx.measureText(label).width;
  ctx.restore();

  ctx.font = `700 104px ${FONT_STACK}`;
  return Math.max(labelWidth, ctx.measureText(value).width);
};

const paintStat = (
  ctx: CanvasRenderingContext2D,
  centreX: number,
  label: string,
  value: string,
) => {
  ctx.textAlign = "center";

  ctx.save();
  ctx.letterSpacing = "3px";
  ctx.font = `700 24px ${FONT_STACK}`;
  ctx.fillStyle = DESKTOP_THEME.purple300;
  ctx.fillText(label, centreX, STAT_LABEL_Y);
  ctx.restore();

  ctx.font = `700 104px ${FONT_STACK}`;
  ctx.fillStyle = DESKTOP_THEME.grey100;
  ctx.fillText(value, centreX, STAT_VALUE_Y);

  ctx.textAlign = "left";
};

/**
 * The two figures side by side, split by a hairline: what was said, and what
 * that bought back. Centred as a pair rather than each in half the card, so
 * figures of different lengths still balance.
 */
const paintStats = (
  ctx: CanvasRenderingContext2D,
  card: MilestoneShareCard,
) => {
  const measured = card.layout ?? card;
  const savedLabel = `${measured.timeSaved.unit.toUpperCase()} SAVED`;
  const leftWidth = measureStat(ctx, "WORDS DICTATED", measured.totalWords);
  const rightWidth = measureStat(ctx, savedLabel, measured.timeSaved.amount);

  const startX = CENTRE - (leftWidth + STAT_GUTTER + rightWidth) / 2;
  const dividerX = startX + leftWidth + STAT_GUTTER / 2;

  paintStat(ctx, startX + leftWidth / 2, "WORDS DICTATED", card.totalWords);
  paintStat(
    ctx,
    dividerX + STAT_GUTTER / 2 + rightWidth / 2,
    savedLabel,
    card.timeSaved.amount,
  );

  ctx.fillStyle = withAlpha(DESKTOP_THEME.grey100, 0.16);
  ctx.fillRect(dividerX, STAT_LABEL_Y - 34, 1, 120);
};

/**
 * "That is more words than Hannah Gadsby's Nanette." — the milestone picked
 * out in purple, the rest in white, and the pair centred as one line. Shrinks
 * to fit rather than wrapping, so the shape of the card never changes.
 */
const paintComparison = (
  ctx: CanvasRenderingContext2D,
  card: MilestoneShareCard,
) => {
  const prefix = "That is more words than ";
  const name = `${card.milestone}.`;

  let size = 38;
  const measure = () => {
    ctx.font = `500 ${size}px ${FONT_STACK}`;
    const prefixWidth = ctx.measureText(prefix).width;
    ctx.font = `700 ${size}px ${FONT_STACK}`;
    return { prefixWidth, total: prefixWidth + ctx.measureText(name).width };
  };

  let { prefixWidth, total } = measure();
  while (total > CONTENT_WIDTH && size > 22) {
    size -= 2;
    ({ prefixWidth, total } = measure());
  }

  const startX = CENTRE - total / 2;
  ctx.font = `500 ${size}px ${FONT_STACK}`;
  ctx.fillStyle = withAlpha(DESKTOP_THEME.grey100, 0.82);
  ctx.fillText(prefix, startX, 460);

  ctx.font = `700 ${size}px ${FONT_STACK}`;
  ctx.fillStyle = DESKTOP_THEME.purple300;
  ctx.fillText(name, startX + prefixWidth, 460);
};

const FOOTER_TAGLINE = "Skip typing. Start talking.";

/**
 * The card travels further than the app does, so it carries the pitch and the
 * way back on the same line.
 */
const paintFooter = (
  ctx: CanvasRenderingContext2D,
  card: MilestoneShareCard,
) => {
  const gap = 16;

  ctx.font = `400 26px ${FONT_STACK}`;
  const taglineWidth = ctx.measureText(FOOTER_TAGLINE).width;
  const linkWidth = ctx.measureText(card.link).width;

  const startX = CENTRE - (taglineWidth + gap + linkWidth) / 2;

  ctx.fillStyle = withAlpha(DESKTOP_THEME.grey100, 0.75);
  ctx.fillText(FOOTER_TAGLINE, startX, 574);

  ctx.fillStyle = DESKTOP_THEME.grey100;
  ctx.fillText(card.link, startX + taglineWidth + gap, 574);
};

/** Paints the card onto a context already scaled to 1200×630 points. */
export const paintMilestoneCard = (
  ctx: CanvasRenderingContext2D,
  card: MilestoneShareCard,
  /** 0–1 through the waveform's cycle; left out for the still card. */
  phase?: number,
): void => {
  ctx.textBaseline = "alphabetic";
  paintBackground(ctx);
  paintPill(ctx, CENTRE, 84, phase);
  paintStats(ctx, card);
  paintComparison(ctx, card);
  paintFooter(ctx, card);
};

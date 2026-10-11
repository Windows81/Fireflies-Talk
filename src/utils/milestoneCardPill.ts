import { DESKTOP_THEME, LOGO_MARK_GRADIENT, withAlpha } from "@/styles/color";

/**
 * The Talk pill, drawn from DictationTalkPill's own geometry so the mark on
 * the card is the one people see in the product.
 */
const PILL_SCALE = 1.6;
const PILL_HEIGHT = 44 * PILL_SCALE;
const PILL_LOGO = 28 * PILL_SCALE;
const PILL_BAR_HEIGHTS = [6, 6, 9.8, 6, 15.7, 9.7, 6];

/**
 * The waveform at rest is the design's own bar heights. While the card is
 * being introduced they breathe, each bar on its own phase, the way the pill
 * does when Talk is listening.
 */
const waveformHeights = (phase: number | undefined): number[] => {
  if (phase === undefined) return PILL_BAR_HEIGHTS;
  return PILL_BAR_HEIGHTS.map((height, index) => {
    const swing = Math.sin(phase * Math.PI * 2 + index * 0.9);
    return Math.max(6, height * (0.55 + 0.45 * (swing + 1)));
  });
};

/** The four shapes of the Fireflies mark, as in IconLogo. */
const LOGO_MARK = [
  "M7.89 0H0v7.832h7.89V0Z",
  "M17.236 9.455h-7.89v7.832h7.89V9.455Z",
  "M17.236 0h-7.89v7.832H24v-1.12c0-1.78-.713-3.487-1.981-4.746A6.788 6.788 0 0 0 17.237 0h-.001Z",
  "M0 9.455v7.832c0 1.78.713 3.488 1.981 4.747A6.789 6.789 0 0 0 6.763 24H7.89V9.455H0Z",
];

/**
 * The mark's brand gradient, in the same 24-unit space as LOGO_MARK and with
 * IconLogo's own axis: it runs far past the mark, so what lands on the logo is
 * the pink end, and the blue only shades the top-left corner.
 */
const LOGO_GRADIENT = {
  from: [19.299, 19.815],
  to: [-13.867, -15.031],
  stops: LOGO_MARK_GRADIENT,
};

const paintLogo = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(PILL_LOGO / 24, PILL_LOGO / 24);

  // Built after the transform so its coordinates are the mark's own.
  const [fromX, fromY] = LOGO_GRADIENT.from;
  const [toX, toY] = LOGO_GRADIENT.to;
  const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
  for (const [offset, color] of LOGO_GRADIENT.stops) {
    gradient.addColorStop(offset, color);
  }

  ctx.fillStyle = gradient;
  for (const shape of LOGO_MARK) ctx.fill(new Path2D(shape));
  ctx.restore();
};

/** The Talk pill: brand mark and a still waveform on the dark lozenge. */
export const paintPill = (
  ctx: CanvasRenderingContext2D,
  centreX: number,
  y: number,
  phase?: number,
) => {
  const bars = waveformHeights(phase);
  const barGap = 5.5 * PILL_SCALE;
  const barWidth = 2 * PILL_SCALE;
  const waveform =
    PILL_BAR_HEIGHTS.length * barWidth + (PILL_BAR_HEIGHTS.length - 1) * barGap;
  const width =
    16 * PILL_SCALE + PILL_LOGO + 12 * PILL_SCALE + waveform + 16 * PILL_SCALE;
  const x = centreX - width / 2;

  const lozenge = ctx.createLinearGradient(x, y, x + width, y + PILL_HEIGHT);
  lozenge.addColorStop(0.19, DESKTOP_THEME.talkPillGradientStart);
  lozenge.addColorStop(0.5, DESKTOP_THEME.talkPillGradientMid);
  lozenge.addColorStop(0.82, DESKTOP_THEME.talkPillGradientEnd);

  ctx.fillStyle = lozenge;
  ctx.beginPath();
  ctx.roundRect(x, y, width, PILL_HEIGHT, PILL_HEIGHT / 2);
  ctx.fill();

  ctx.strokeStyle = withAlpha(DESKTOP_THEME.grey100, 0.14);
  ctx.lineWidth = 1;
  ctx.stroke();

  paintLogo(ctx, x + 16 * PILL_SCALE, y + 8 * PILL_SCALE);

  let barX = x + 16 * PILL_SCALE + PILL_LOGO + 12 * PILL_SCALE;
  ctx.fillStyle = DESKTOP_THEME.grey400;
  for (const height of bars) {
    const barHeight = height * PILL_SCALE;
    ctx.beginPath();
    ctx.roundRect(
      barX,
      y + (PILL_HEIGHT - barHeight) / 2,
      barWidth,
      barHeight,
      barWidth / 2,
    );
    ctx.fill();
    barX += barWidth + barGap;
  }
};

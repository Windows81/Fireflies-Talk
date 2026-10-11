import { DESKTOP_THEME, withAlpha } from "@/styles/color";

/**
 * 1.91:1 — what LinkedIn, X and Slack all crop link images to, so the card
 * arrives uncropped wherever someone posts it.
 *
 * The card is laid out in these points and scaled on the way out, so window
 * size and display scaling cannot change it. Type is the one thing that does
 * vary: the stack falls back to each platform's system face, so a Windows
 * card sets in Segoe rather than SF. Bundling a face would fix that.
 */
export const WIDTH = 1200;
export const HEIGHT = 630;
export const CENTRE = WIDTH / 2;
export const CONTENT_WIDTH = WIDTH - 144;

export const FONT_STACK = '-apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * The Talk pill, drawn from DictationTalkPill's own geometry so the mark on
 * the card is the one people see in the product.
/**
 * Fixed specks of light, as fractions of the card. Held as data rather than
 * drawn at random so the same milestone always produces the same card.
 */
const STARS = [
  [0.06, 0.18, 1.6],
  [0.13, 0.62, 1.1],
  [0.18, 0.31, 2.1],
  [0.24, 0.79, 1.3],
  [0.31, 0.12, 1.5],
  [0.36, 0.52, 1],
  [0.42, 0.86, 1.8],
  [0.47, 0.24, 1.2],
  [0.53, 0.68, 1.4],
  [0.58, 0.09, 1.9],
  [0.64, 0.44, 1.1],
  [0.69, 0.81, 1.5],
  [0.74, 0.19, 1.3],
  [0.79, 0.57, 2],
  [0.84, 0.35, 1.2],
  [0.88, 0.73, 1.6],
  [0.92, 0.15, 1.4],
  [0.96, 0.48, 1.1],
  [0.09, 0.9, 1.2],
  [0.28, 0.66, 1],
];

export interface MilestoneShareCard {
  totalWords: string;
  milestone: string;
  /** Figure and unit apart, so the pair can sit as its own statistic. */
  timeSaved: { amount: string; unit: string };
  /**
   * Figures to measure the columns against instead of the ones being drawn.
   * A counting card passes its final values here, so the pair keeps its place
   * while the digits grow rather than sliding about under them.
   */
  layout?: { totalWords: string; timeSaved: { amount: string; unit: string } };
  /** Bare host and path, e.g. "fireflies.ai/talk". */
  link: string;
}

export const paintBackground = (ctx: CanvasRenderingContext2D) => {
  const night = ctx.createLinearGradient(0, 0, WIDTH * 0.4, HEIGHT);
  night.addColorStop(0, DESKTOP_THEME.purple1200);
  night.addColorStop(0.55, DESKTOP_THEME.purple1300);
  night.addColorStop(1, DESKTOP_THEME.night1000);
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Glow behind the mark, so the eye lands on the pill before the number.
  const halo = ctx.createRadialGradient(
    CENTRE,
    HEIGHT * 0.1,
    0,
    CENTRE,
    HEIGHT * 0.1,
    WIDTH * 0.52,
  );
  halo.addColorStop(0, withAlpha(DESKTOP_THEME.purple700, 0.55));
  halo.addColorStop(1, withAlpha(DESKTOP_THEME.purple700, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = withAlpha(DESKTOP_THEME.grey100, 0.5);
  for (const [x, y, radius] of STARS) {
    ctx.beginPath();
    ctx.arc(x * WIDTH, y * HEIGHT, radius, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const MILESTONE_CARD_WIDTH = WIDTH;
export const MILESTONE_CARD_HEIGHT = HEIGHT;

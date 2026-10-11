/** Pixel size of the accessibility walkthrough recording as captured. */
export const SOURCE = { width: 1670, height: 1486 };

/**
 * The System Settings window within that recording. The capture has a black
 * margin baked into every frame, so the video is blown up and offset until only
 * this region shows — the same crop the design uses.
 */
export const CONTENT = { x: 112, y: 76, width: 1446, height: 1262 };

/** The window's own corner radius, in those same source pixels. */
const CONTENT_CORNER_RADIUS = 50;

/**
 * Scale and offset, as fractions of the frame, that leave only CONTENT visible.
 * Negative offsets pull the black margin out of view on the top and left; the
 * over-100% size pushes it out on the bottom and right.
 */
export const CROP = {
  aspectRatio: CONTENT.width / CONTENT.height,
  left: -CONTENT.x / CONTENT.width,
  top: -CONTENT.y / CONTENT.height,
  width: SOURCE.width / CONTENT.width,
  height: SOURCE.height / CONTENT.height,
};

/**
 * The recorded window's own rounding at a given rendered width. The frame
 * scales with the app window, so a fixed radius would stop tracking that curve
 * and clip the corners. The extra pixel swallows the curve's anti-aliased edge,
 * which would otherwise leave a dark sliver in each corner.
 */
export function cornerRadiusForWidth(frameWidth: number): number {
  if (!frameWidth) return 0;
  return (frameWidth * CONTENT_CORNER_RADIUS) / CONTENT.width + 1;
}

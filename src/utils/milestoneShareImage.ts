import {
  MILESTONE_CARD_HEIGHT,
  MILESTONE_CARD_WIDTH,
  paintMilestoneCard,
  type MilestoneShareCard,
} from "./milestoneCardPainter";

export type { MilestoneShareCard } from "./milestoneCardPainter";

/**
 * Paints the shareable card and hands back a PNG data URL. Drawn on a canvas
 * rather than captured from the on-screen preview: `webContents.capturePage`
 * is unreliable in this app, and a canvas gives the same pixels on every
 * machine regardless of window size or display scaling.
 */
export const renderMilestoneShareImage = (
  card: MilestoneShareCard,
  scale = 2,
): string | undefined => {
  const canvas = document.createElement("canvas");
  canvas.width = MILESTONE_CARD_WIDTH * scale;
  canvas.height = MILESTONE_CARD_HEIGHT * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  ctx.scale(scale, scale);
  paintMilestoneCard(ctx, card);

  return canvas.toDataURL("image/png");
};

/**
 * Puts the card on the clipboard as an image, with `caption` alongside it as
 * text so a paste into a field that takes no image still carries the link.
 * False when the clipboard bridge is not there to write to.
 */
export const copyMilestoneImage = async (
  dataUrl: string,
  caption: string,
): Promise<boolean> => {
  const electronClipboard = window?.electron?.clipboard;
  if (!electronClipboard?.writeImage) return false;

  // The main process refuses a payload it cannot use; saying "Copied" then
  // would be a lie about the clipboard.
  return await electronClipboard.writeImage(dataUrl, caption);
};

import { createStyles } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import { blurFilter } from "./dictationPillStyles";
import { ACTION_ORB_GAP, ACTION_ORB_SIZE } from "./dictationActionOrbStyles";

/**
 * The hover panel's surfaces, kept apart from the orb's.
 *
 * The two are read at different times — one while glancing at a corner of the
 * screen, the other while reading a result — and sharing a module made a long
 * file out of two short ones.
 */

export const ACTION_ORB_PANEL_WIDTH = 320;
/** Past this the history scrolls rather than growing the panel off-screen. */
export const ACTION_ORB_HISTORY_MAX_HEIGHT = 168;
/** The result well scrolls too — a drafted email can run long. */
export const ACTION_ORB_RESULT_MAX_HEIGHT = 190;
/** The Fred mark heading the panel. */
export const ACTION_PANEL_ICON_SIZE = 17;
const PANEL_HEADER_GAP = 8;
const PANEL_GLOW_SPREAD = 6;
const PANEL_RADIUS = 14;

export const panelStyles = createStyles({
  /**
   * The panel opens on whichever side of the cluster has room for it, so a
   * cluster dragged to an edge does not put its own controls off-screen.
   */
  panelLayer: {
    position: "absolute",
  },
  /** Hangs below the orbs when there is room beneath them. */
  panelBelow: {
    top: ACTION_ORB_SIZE + ACTION_ORB_GAP,
  },
  /** Flips above when the cluster has been dragged near the bottom edge. */
  panelAbove: {
    bottom: ACTION_ORB_SIZE + ACTION_ORB_GAP,
  },
  /** Opens inward from the right, which is where the cluster starts. */
  panelFromRight: {
    right: 0,
  },
  /** ...and from the left once dragged close enough to that edge. */
  panelFromLeft: {
    left: 0,
  },
  panel: (theme) => ({
    // Hugs its content while it is just a status line — a short title on a
    // fixed-width panel left a long empty run beside it.
    maxWidth: ACTION_ORB_PANEL_WIDTH,
    alignSelf: "flex-end",
    padding: 14,
    borderRadius: PANEL_RADIUS,
    gap: 10,
    backgroundColor: theme.colors.dictationPillTooltipSurface,
    borderWidth: 1,
    borderColor: withAlpha(GLOBAL.white, 0.1),
    backdropFilter: "blur(24px) saturate(140%)",
    boxShadow: `0 16px 40px ${withAlpha(GLOBAL.grey900, 0.45)}`,
  }),
  /** The same halo the orb wears, sized to the panel it backs. */
  panelGlow: {
    position: "absolute",
    top: -PANEL_GLOW_SPREAD,
    left: -PANEL_GLOW_SPREAD,
    right: -PANEL_GLOW_SPREAD,
    bottom: -PANEL_GLOW_SPREAD,
    borderRadius: PANEL_RADIUS + PANEL_GLOW_SPREAD,
    overflow: "hidden",
    opacity: 0.22,
    ...blurFilter(`blur(${PANEL_GLOW_SPREAD}px)`),
  },
  /**
   * A result needs the full width: hugging squeezes the well into a column and
   * folds the two actions under it onto two lines each.
   */
  panelWithResult: {
    width: ACTION_ORB_PANEL_WIDTH,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: PANEL_HEADER_GAP,
  },
  panelTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: GLOBAL.white,
  },
  /**
   * The status and its disclosure sit on one line, the chevron inline. Indented
   * to start under the title rather than under the mark beside it, so the two
   * lines share a left edge.
   */
  panelStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingLeft: ACTION_PANEL_ICON_SIZE + PANEL_HEADER_GAP,
  },
  panelStatus: {
    flexShrink: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: withAlpha(GLOBAL.white, 0.92),
  },
  /** Hit area for the chevron — the glyph alone is too small to aim at. */
  panelDisclosure: {
    paddingTop: 2,
    paddingHorizontal: 2,
  },
  panelChevronDown: {
    transform: [{ rotate: "180deg" }],
  },
  panelHistory: {
    maxHeight: ACTION_ORB_HISTORY_MAX_HEIGHT,
  },
  panelHistoryContent: {
    gap: 10,
    paddingTop: 2,
    paddingLeft: ACTION_PANEL_ICON_SIZE + PANEL_HEADER_GAP,
  },
  panelStep: {
    gap: 3,
  },
  panelStepText: {
    fontSize: 12,
    lineHeight: 17,
    color: withAlpha(GLOBAL.white, 0.42),
  },
  /** The tool name is evidence, so it reads as a tag rather than as prose. */
  panelStepTool: {
    alignSelf: "flex-start",
    fontSize: 10.5,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: withAlpha(GLOBAL.white, 0.55),
    backgroundColor: withAlpha(GLOBAL.white, 0.08),
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: "hidden",
  },
  /**
   * The generated text gets a well of its own. It is the thing the user came
   * back for, so it is lifted off the panel rather than sharing its surface.
   */
  panelResult: {
    borderRadius: 10,
    backgroundColor: withAlpha(GLOBAL.grey1000, 0.55),
    borderWidth: 1,
    borderColor: withAlpha(GLOBAL.white, 0.08),
    overflow: "hidden",
  },
  panelResultScroll: {
    maxHeight: ACTION_ORB_RESULT_MAX_HEIGHT,
  },
  panelResultContent: {
    padding: 10,
  },
  panelResultText: {
    fontSize: 12,
    lineHeight: 18,
    color: withAlpha(GLOBAL.white, 0.88),
  },
  /** Both actions share the well's bottom edge, split down the middle. */
  panelResultActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: withAlpha(GLOBAL.white, 0.08),
    backgroundColor: withAlpha(GLOBAL.white, 0.06),
  },
  panelResultAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  panelResultDivider: {
    width: 1,
    backgroundColor: withAlpha(GLOBAL.white, 0.08),
  },
  /** Destinations the run mentioned, as a wrapping row of chips. */
  panelLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  panelLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: withAlpha(GLOBAL.white, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(GLOBAL.white, 0.12),
  },
  panelLinkLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: GLOBAL.white,
  },
  /** Says an automatic paste missed, without implying the result is lost. */
  panelNotice: {
    fontSize: 11.5,
    lineHeight: 16,
    color: withAlpha(GLOBAL.white, 0.6),
  },
  /** What the run cost, kept quiet — it is a receipt, not the point. */
  panelCredits: {
    alignSelf: "flex-end",
    fontSize: 11,
    color: withAlpha(GLOBAL.white, 0.38),
  },
  panelCopyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GLOBAL.white,
  },
});

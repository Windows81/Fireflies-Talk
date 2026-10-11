import { Breakpoint, createStyles } from "@/styles";
import { ASSISTANT_PANE_GAP, NOTES_COLUMN_WIDTH } from "./constants";

// Side padding around the centered notes column. It shrinks on narrower windows
// so the content keeps usable width as the screen gets smaller.
const notesColumnPadding = (breakpoint: Breakpoint): number => {
  if (breakpoint === Breakpoint.Large) return 40;
  if (breakpoint === Breakpoint.Medium) return 24;
  return 16;
};

export const layoutStyles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerSubtle,
  }),
  body: {
    flex: 1,
    minHeight: 0,
    flexDirection: "row",
    gap: ASSISTANT_PANE_GAP,
    paddingLeft: 40,
    paddingRight: 16,
  },
  mainPane: {
    flex: 1,
    minHeight: 0,
    flexDirection: "row",
  },
  // Notes + tasks content column (sits left of the optional spy rail).
  mainPaneContent: {
    flex: 1,
    minHeight: 0,
  },
  // Holds the notes content (centered) plus the floating audio/edit bar. The
  // nav rail is a sibling so the spy never overlaps the content.
  notesArea: (theme) => ({
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    paddingHorizontal: notesColumnPadding(theme.breakpoint),
  }),
  notesColumn: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: "100%",
    maxWidth: NOTES_COLUMN_WIDTH,
    overflow: "hidden",
  },
  toolbarAnchor: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
  },
});

// Keep tab panes mounted but hidden so their queries don't refire on switch.
export const hiddenPaneStyle = (visible: boolean) =>
  ({
    flex: 1,
    minHeight: 0,
    width: "100%",
    display: visible ? "flex" : "none",
  }) as const;

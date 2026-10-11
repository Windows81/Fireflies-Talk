import { createStyles } from "@/styles";

export const taskRowStyles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: "hidden",
    minWidth: 0,
  },
  // Nudges the 16px box onto the first line of the 28px line-height title.
  checkboxWrap: {
    paddingTop: 6,
  },
  leading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    minWidth: 0,
  },
  actions: {
    minWidth: 32,
    paddingTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
